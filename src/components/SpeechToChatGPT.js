import React, { useState, useRef, useEffect } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/idol2.mp4";
import { sendToChatGPT } from "./SendingAPI"; // SendingAPIをインポート
import { startRecognition } from "./SpeechRecognition"; // SpeechRecognitionをインポート
import { useNavigate } from "react-router-dom";
import ChatMessage from "./ChatMessage"; // ChatMessageコンポーネントをインポート
import { motion } from "framer-motion";

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

  // 音声言語選択肢
  const languageSettings = {
    englishConversation: "en-US",
    conversation: "ja-JP",
    translation: "en-US",
    grammar: "en-US",
  };

  // モードごとの説明を定義
  const modeDescriptions = {
    englishConversation: "英会話モードの説明",
    conversation: "雑談モードの説明",
    translation: "日英翻訳モードの説明",
    grammar: "英文校正モードの説明",
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
    speechSynthesis.cancel(); // 読み上げをキャンセル
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
              selectedMenuItem === "englishConversation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("englishConversation")}
          >
            <TbMessageLanguage className="sidebar-icon" />
            英会話
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "conversation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("conversation")}
          >
            <TbMessages className="sidebar-icon" />
            雑談
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "translation" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("translation")}
          >
            <PiTranslateBold className="sidebar-icon" />
            日英翻訳
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "grammar" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("grammar")}
          >
            <TbTextSpellcheck className="sidebar-icon" />
            英文校正
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "dance" ? "active" : ""
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
          <BsFillVolumeUpFill className="icon" onClick={toggleVoice} />
        ) : (
          <BsFillVolumeMuteFill className="icon" onClick={toggleVoice} />
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
