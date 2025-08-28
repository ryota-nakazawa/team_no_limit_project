import React, { useState, useRef, useEffect } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/idol3.mp4";
import conversationImage from "../images/conversation.jpeg";
import englishConversationImage from "../images/englishConversation.jpeg";
import translationImage_ja from "../images/ja_en.jpeg";
import translationImage_en from "../images/en_ja.jpeg";
import grammarImage from "../images/grammar.jpeg";
import danceVideo from "../movies/YouCamVideo_20240304_222024 3.mp4";
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
  BsTranslate,
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
  const [selectedMenuItem, setSelectedMenuItem] = useState("ENtoJPTranslation");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isIMEActive, setIsIMEActive] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

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
      ENtoJPTranslation: translationImage_en,
      JPToENTranslation: translationImage_ja,
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
      "今日もお疲れさま！のんびりおしゃべりしようね。どんなことでも話してみて。",
    ENtoJPTranslation:
      "今日もお疲れさま！英語を送ってね。 日本語に翻訳して使い方の例も教えるよ。",
    JPToENTranslation:
      "今日もお疲れさま！日本語を送ってね。英語に翻訳するよ。複数の言い方がある時は選択肢をいくつか示すから、使いたい表現を見つけるのに役立つよ。単語の場合は例文を和訳と一緒に示すから、参考にしてみて！",
    grammar:
      "今日もお疲れさま！英文の校正をお手伝いするよ。提供された英文をチェックして、もっと良い英文になるようにアドバイスするね！",
  };

  // モード変更時
  const handleMenuItemClick = (item) => {
    setSelectedMenuItem(item);
    setLanguage(languageSettings[item]); // 言語設定を更新
    clearHistory(); // 会話の履歴クリア
    clearTranscript(); // 入力クリア
    if (window.globalAudio && !window.globalAudio.paused) {
      stopSpeaking();
    }
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
  
  // 録音ボタン高速押下エラー対策(連打しすぎなければ基本問題ない)
  const toggleRecognition = () => {
    setIsButtonDisabled(true); // ボタンを一時的に無効化
    if (isRecording) {
      stopRecognition();
    } else {
      startRecognition(language, setIsRecording, setTranscript, recognitionRef, (text) => handleSendToChatGPT(text));
    }
    setTimeout(() => {
      setIsButtonDisabled(false); // 一定時間後にボタンを再度有効化
    }, 200); // 0.2秒後にボタンを再度有効にする
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
    if (window.globalAudio && !window.globalAudio.paused) {
      stopSpeaking();
    }
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
  const handleSendToChatGPT = (textFromSpeech) => {
    console.log("handleSendToChatGPT called");
    const textToSend = typeof textFromSpeech === 'string' ? textFromSpeech : transcript;

    if (isSendingMessage === true) {
      console.log("Already sending a message, returning.");
      return;
    }
    if (!textToSend.trim()) {
      console.log("Transcript is empty, returning.");
      return;
    }

    setIsSendingMessage(true); // メッセージ送信中の状態をtrueに設定
    stopRecognition(); // レコーディング停止

    if (textToSend === "bazz") {
      handleNavigation();
    } else {
      sendToChatGPT(
        textToSend,
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
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight - 10
      }px`;
    }
  };
  
  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-menu">
          <div
            className={`menu-item ${
              selectedMenuItem === "ENtoJPTranslation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("ENtoJPTranslation")}
          >
            <BsTranslate className="sidebar-icon" />
            <span className="menu-item-text">英日翻訳</span>
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "JPToENTranslation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("JPToENTranslation")}
          >
            <PiTranslateBold className="sidebar-icon" />
            <span className="menu-item-text">日英翻訳</span>
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "grammar" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("grammar")}
          >
            <TbTextSpellcheck className="sidebar-icon" />
            <span className="menu-item-text">英文校正</span>
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "englishConversation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("englishConversation")}
          >
            <TbMessageLanguage className="sidebar-icon" />
            <span className="menu-item-text">英会話</span>
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "conversation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("conversation")}
          >
            <TbMessages className="sidebar-icon" />
            <span className="menu-item-text">雑談</span>
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "dance" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("dance")}
          >
            <TbMusic className="sidebar-icon" />
            <span className="menu-item-text">ダンス</span>
          </div>
        </div>
      </div>

      {selectedMenuItem === "dance" ? (
        <div className="danceVideo-container">
          <video
            id="danceVideo"
            // ref={videoRef}
            src={danceVideo}
            autoPlay
            className="danceVideo"
            controls
          ></video>
        </div>
      ) : (
        <>
          <div className="video-container">
            {isVoiceEnabled ? (
              <BsFillVolumeUpFill
                className="icon video-icon"
                onClick={toggleVoice}
              />
            ) : (
              <BsFillVolumeMuteFill
                className="icon video-icon"
                onClick={toggleVoice}
              />
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
                <button
                  disabled={isButtonDisabled || isSendingMessage || isSpeaking}
                  onClick={toggleRecognition}
                  className={
                    isRecording
                      ? "Recording-btn stop-btn"
                      : "Recording-btn start-btn"
                  }
                >
                  {isRecording ? (
                    <BsFillMicFill className="icon Recording-icon" />
                  ) : (
                    <BsMic className="icon Recording-icon" />
                  )}
                </button>
              </div>

              {isSpeaking ? (
                <button className="stop-speak-btn" onClick={stopSpeaking}>
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
        </>
      )}
    </div>
  );
};

export default SpeechToChatGPT;
