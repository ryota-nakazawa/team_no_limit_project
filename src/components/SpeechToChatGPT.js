import React, { useState, useRef, useEffect } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/idol3.mp4";
import conversationImage from "../images/conversation.png";
import englishConversationImage from "../images/englishConversation.jpeg";
import translationImage from "../images/translation.jpeg";
import grammarImage from "../images/grammar.jpeg";
import { sendToChatGPT } from "./SendingAPI"; // SendingAPIをインポート
import { startRecognition } from "./SpeechRecognition"; // SpeechRecognitionをインポート
import { useNavigate } from "react-router-dom";
import ChatMessage from "./ChatMessage"; // ChatMessageコンポーネントをインポート

import {
  BsFillSendFill,
  BsStopCircle,
  BsMic,
  BsFillMicFill,
  BsFillVolumeUpFill,
  BsFillVolumeMuteFill,
} from "react-icons/bs";
import {
  TbTextSpellcheck,
  TbMessageLanguage,
  TbMusic,
  TbMessages,
} from "react-icons/tb";
import { PiTranslateBold } from "react-icons/pi";

const SpeechToChatGPT = () => {
  const [history, setHistory] = useState([]); // 会話の履歴を保持する状態
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("en-US"); // デフォルトの言語を設定
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState(
    "englishConversation"
  );
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isIMEActive, setIsIMEActive] = useState(false);

  useEffect(() => {
    // デフォルトのモード説明をチャット履歴に追加
    const defaultDescription = modeDescriptions[selectedMenuItem];
    setHistory((prevHistory) => [
      ...prevHistory,
      { role: "assistant", content: defaultDescription },
    ]);
    // 初回レンダリング時にアニメーションを無効にする
    setIsAnimating(false);
  }, []);

  // chatの一番下に自動でスクロールする
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [history]); // historyが更新されるたびに実行

  //テキストの入力が編集中がどうかを判断する
  useEffect(() => {
    document.addEventListener('compositionstart', handleCompositionStart);
    document.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      document.removeEventListener('compositionstart', handleCompositionStart);
      document.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, []);

  // change background
  useEffect(() => {
    //背景URLの設定
    const backgroundImages = {
      englishConversation: englishConversationImage,
      conversation: conversationImage,
      ENtoJPTranslation: translationImage,
      JPToENTranslation: translationImage,
      grammar: grammarImage,
      //dance: 'url("../images/dance.jpg")',
    };
    const imageUrl = backgroundImages[selectedMenuItem];
    // Clear the background image first, force a reflow, then set the new image
    document.body.style.backgroundImage = "";
    void document.body.offsetHeight; // Force reflow
    document.body.style.backgroundImage = `url('${imageUrl}')`;

    console.log("change background url to" + imageUrl); //debug
  }, [selectedMenuItem]); //selectedMenuItemが更新されるたびに

  // 音声言語選択肢
  const languageSettings = {
    englishConversation: "en-US",
    conversation: "ja-JP",
    ENtoJPTranslation: "ja-JP",
    JPToENTranslation: "en-US",
    grammar: "en-US",
  };

  // モードごとの説明を定義
  const modeDescriptions = {
    englishConversation:
      "Let's start practicing business English! Ask me anything, and let's enjoy a real conversation. Don’t worry, I'll provide Japanese translations after my English sentences to help you understand better!",
    conversation:
      "こんにちは！のんびりとおしゃべりを楽しもう。日々のことから面白いネタまで、何でも話してみて。あなたの気分や関心事に合わせて、会話を盛り上げるね！",
    ENtoJPTranslation:
      "英語をここに入れてね！ 私がすぐに日本語に翻訳して、語源や使い方の例も教えるよ。もし文章にちょっとした文法の誤りがあったら、それも修正して理由を説明するね。",
    JPToENTranslation:
      "日本語をここに入れてね！私がすぐに英語に翻訳するよ。複数の言い方がある時は選択肢をいくつか示すから、使いたい表現を見つけるのに役立つよ。単語の場合は例文を和訳と一緒に示すから、参考にしてみて！",
    grammar:
      "英文の校正をお手伝いするよ！提供された英文をチェックして、文法やスペルのミスを見つけて、もっと良い英文になるようにアドバイスもするから、お任せしてね！",
  };

  // モード変更時
  const handleMenuItemClick = (item) => {
    setSelectedMenuItem(item);
    setLanguage(languageSettings[item]); // 言語設定を更新
    clearHistory(); // 会話の履歴クリア
    clearTranscript(); // 入力クリア
    // モードの説明をチャット履歴に追加
    const description = modeDescriptions[item];
    if (item !== "dance") {
      setHistory((prevHistory) => [
        ...prevHistory,
        { role: "assistant", content: description },
      ]);
    }
  };

  // テキスト入力反映
  const handleChange = (event) => {
    setTranscript(event.target.value); // テキスト入力の変更をtranscriptに設定
  };

  const handleCompositionStart = () => {
    setIsIMEActive(true);
  };

  const handleCompositionEnd = () => {
    setIsIMEActive(false);
  };

  // テキストエリアをリサイズする関数
  const resizeTextarea = (event) => {
    const textarea = event.target;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
    const minRows = 1;
    const maxRows = 6;

    textarea.style.height = "auto";
    const rows = Math.min(
      Math.max(textarea.scrollHeight / lineHeight, minRows),
      maxRows
    );

    textarea.style.height = `${Math.max(rows, minRows) * lineHeight - 10}px`;
  };

  // 音声入力停止
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // 読み上げが終わった時にisSpeakingをfalseにする
  const handleSpeakEnd = () => {
    setIsSpeaking(false); // 読み上げが終了したことを示す
    if (videoRef.current) {
      videoRef.current.pause(); // ビデオを一時停止
    }
  };

  // 音声読み上げのオン/オフを切り替える関数
  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  // GPTの返答を停止する関数
  const stopSpeaking = () => {
    window.globalAudio.pause(); // 読み上げをキャンセル
    handleSpeakEnd();
  };

  const handleNavigation = () => {
    setIsAnimating(true); // アニメーションを開始
    setTimeout(() => {
      navigate("/payment", { state: { message: '成功', type: 'success' } }); // '/payment' パスへの遷移
    }, 300); // アニメーションが完了するまでの時間
  };

  // エンターキーが押され、Shiftキーが押されていない場合に送信する
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !isIMEActive) {
      event.preventDefault(); // デフォルトのエンターキーの動作（改行）を防止
      handleSendToChatGPT(); // チャット送信関数を呼び出す
    }
  };

  // Chat GPTに送信する関数
  const handleSendToChatGPT = () => {
    if (isSendingMessage === true) {
      return;
    }
    setIsSendingMessage(true); // メッセージ送信中の状態をtrueに設定

    if (transcript === "bazz") {
      handleNavigation();
    } else {
      sendToChatGPT(
        transcript,
        isSpeaking,
        isVoiceEnabled,
        language,
        videoRef,
        selectedMenuItem,
        setHistory,
        setTranscript,
        setIsSpeaking,
        setError
      )
        .then(() => {
          setIsSendingMessage(false); // メッセージ送信が完了したら状態をfalseに設定
        })
        .catch((error) => {
          setError(error);
          setIsSendingMessage(false); // エラーが発生した場合も状態をfalseに設定
        });
    }
  };

  // チャット履歴を消去する関数
  const clearHistory = () => {
    setHistory([]);
  };

  // 入力を消去する関数
  const clearTranscript = () => {
    setTranscript("");
    // テキストエリアの高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight - 10
        }px`;
    }
  };

  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-menu">
          <div
            className={`menu-item ${selectedMenuItem === "englishConversation" ? "active" : ""
              }`}
            onClick={() => handleMenuItemClick("englishConversation")}
          >
            <TbMessageLanguage className="sidebar-icon" />
            英会話
          </div>
          <div
            className={`menu-item ${selectedMenuItem === "conversation" ? "active" : ""
              }`}
            onClick={() => handleMenuItemClick("conversation")}
          >
            <TbMessages className="sidebar-icon" />
            雑談
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "ENtoJPTranslation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("ENtoJPTranslation")}
          >
            <PiTranslateBold className="sidebar-icon" />
            英→日翻訳
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "JPToENTranslation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("JPToENTranslation")}
          >
            <PiTranslateBold className="sidebar-icon" />
            日→英翻訳
          </div>
          <div
            className={`menu-item ${selectedMenuItem === "grammar" ? "active" : ""
              }`}
            onClick={() => handleMenuItemClick("grammar")}
          >
            <TbTextSpellcheck className="sidebar-icon" />
            英文校正
          </div>
          <div
            className={`menu-item ${selectedMenuItem === "dance" ? "active" : ""
              }`}
            onClick={() => handleMenuItemClick("dance")}
          >
            <TbMusic className="sidebar-icon" />
            ダンス
          </div>
        </div>
      </div>

      <div className="video-container">
        {isVoiceEnabled ? (
          <BsFillVolumeUpFill className="icon video-icon" onClick={toggleVoice} />
        ) : (
          <BsFillVolumeMuteFill className="icon video-icon" onClick={toggleVoice} />
        )}
        <video id="myVideo" ref={videoRef} muted loop className="video">
          <source src={idleMovie} type="video/mp4" />
        </video>
      </div>

      <div className="chat-container">
        <div className="chat-history-container" ref={chatHistoryRef}>
          {history.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
        </div>

        <div className="transcript-and-send-container">
          <div className="textarea-with-icon">
            <div className="textarea-container">
              <textarea
                ref={textareaRef}
                rows="1"
                value={transcript}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onInput={resizeTextarea}
              />
            </div>
            <button className="clear-btn" onClick={clearTranscript}>
              ×
            </button>
            {!isRecording && (
              <button
                disabled={isSendingMessage || isSpeaking}
                className="Recording-btn start-btn"
                onClick={() =>
                  startRecognition(
                    language,
                    setIsRecording,
                    setTranscript,
                    recognitionRef
                  )
                }
              >
                <BsMic className="icon Recording-icon" />
              </button>
            )}
            {isRecording && (
              <button
                disabled={isSendingMessage || isSpeaking}
                className="Recording-btn stop-btn"
                onClick={stopRecognition}
              >
                <BsFillMicFill className="icon Recording-icon" />
              </button>
            )}
          </div>

          {isSpeaking ? (
            <button className="stop-speaking-btn" onClick={stopSpeaking}>
              <BsStopCircle className="icon" />
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSendToChatGPT}
              disabled={isSendingMessage}
            >
              <BsFillSendFill className="icon" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeechToChatGPT;
