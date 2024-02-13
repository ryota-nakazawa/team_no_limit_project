import React, { useState, useRef, useEffect } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/idol1.mp4";
import idleImage from "../images/idol1.png";
import youImage from "../images/you.png";
import { sendToChatGPT } from './SendingAPI'; // SendingAPIをインポート
import { startRecognition } from './SpeechRecognition'; // SpeechRecognitionをインポート
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage'; // ChatMessageコンポーネントをインポート
import { motion } from "framer-motion";

import {
  BsFillSendFill,
  BsStopCircle,
  BsMic,
  BsFillMicFill,
} from "react-icons/bs";

const SpeechToChatGPT = () => {
  const [history, setHistory] = useState([]); // 会話の履歴を保持する状態
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("ja-JP"); // デフォルトの言語を設定
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    // 初回レンダリング時にアニメーションを無効にする
    setIsAnimating(false);
  }, []);

  // テキスト入力反映
  const handleChange = (event) => {
    setTranscript(event.target.value); // テキスト入力の変更をtranscriptに設定
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

  // GPTの返答を停止する関数
  const stopSpeaking = () => {
    speechSynthesis.cancel(); // 読み上げをキャンセル
    handleSpeakEnd();
  };

  const handleNavigation = () => {
    setIsAnimating(true); // アニメーションを開始
    setTimeout(() => {
      navigate('/payment'); // '/payment' パスへの遷移
    }, 300); // アニメーションが完了するまでの時間
  };

  // Chat GPTに送信する関数
  const handleSendToChatGPT = () => {
    setIsSendingMessage(true); // メッセージ送信中の状態をtrueに設定

    if (transcript === "bazz") {
      handleNavigation();
    } else {
      sendToChatGPT(transcript, isSpeaking, language, videoRef, setHistory, setTranscript, setIsSpeaking, setError)
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
  };

  return (
    <div className="container">
      <div className="video-and-chat-container">
        <div className="video-container">
          <video id="myVideo" ref={videoRef} muted loop className="video">
            <source src={idleMovie} type="video/mp4" />
          </video>
        </div>

        <div className="chat-container">
          <button className="clear-history" onClick={clearHistory}>
            &times;
          </button>
          {history.map((message, index) => (
            <ChatMessage
              role={message.role}
              name={message.role === "user" ? "あなた" : "アイドル"}
              iconUrl={message.role === "user" ? youImage : idleImage}
              content={message.content}
            />
          ))}
        </div>
      </div>

      <div className="transcript-and-send-container">
        <div className="language">
          <button
            className={`language-btn ${language === "ja-JP" ? "selected" : ""}`}
            onClick={() => setLanguage("ja-JP")}
          >
            日
          </button>
          <button
            className={`language-btn ${language === "en-US" ? "selected" : ""}`}
            onClick={() => setLanguage("en-US")}
          >
            英
          </button>
        </div>
        <div className="textarea-container">
          <textarea value={transcript} onChange={handleChange} />
          <button className="clear-btn" onClick={clearTranscript}>
            ×
          </button>
        </div>
        {!isRecording && (
          <button className="start-btn" onClick={() => startRecognition(language, setIsRecording, setTranscript, recognitionRef)}>
            <BsMic className="icon" />
          </button>
        )}
        {isRecording && (
          <button className="stop-btn" onClick={stopRecognition}>
            <BsFillMicFill className="icon" />
          </button>
        )}

        {isSpeaking ? (
          <button className="stop-speaking-btn" onClick={stopSpeaking}>
            <BsStopCircle className="icon-large" />
          </button>
        ) : (
          <button className="send-btn" onClick={handleSendToChatGPT} disabled={isSendingMessage}>
            <BsFillSendFill className="icon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SpeechToChatGPT;
