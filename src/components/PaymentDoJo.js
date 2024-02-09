import React, { useState, useRef } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/bazz.mp4";
import hiddenMovie from "../movies/bazzdance.mp4";
import idleImage from "../images/bazz.png";
import youImage from "../images/you.png";
import { sendToChatGPTPayment } from './SendingAPIPayment'; // SendingAPIをインポート
import { startRecognition } from './SpeechRecognition'; // SpeechRecognitionをインポート
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage'; // ChatMessageコンポーネントをインポート
import Popup from './Popup';

import {
  BsFillSendFill,
  BsStopCircle,
  BsMic,
  BsFillMicFill,
} from "react-icons/bs";

const PaymentDoJo = () => {
  const [history, setHistory] = useState([]); // 会話の履歴を保持する状態
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("ja-JP"); // デフォルトの言語を設定
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

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
    navigate('/'); // '/payment' パスへの遷移
  };

  // Chat GPTに送信する関数
  const handleSendToChatGPTPayment = () => {
    sendToChatGPTPayment(transcript, isSpeaking, language, videoRef, setHistory, setTranscript, setIsSpeaking, setError); // SendingAPIの関数を呼び出し
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
        <button onClick={handleNavigation}>アイドルとのチャットへ</button>

        <div className="chat-container">
          <button className="clear-history" onClick={clearHistory}>
            &times;
          </button>
          {history.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              name={message.role === "user" ? "あなた" : "道場師範"}
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
          <button className="send-btn" onClick={handleSendToChatGPTPayment}>
            <BsFillSendFill className="icon" />
          </button>
        )}
        {/* ボタンをクリックしてポップアップを表示 */}
        <button className="popup-btn" onClick={() => setShowPopup(true)}>ポップアップを表示</button>

        {/* ポップアップ */}
        <Popup show={showPopup} handleClose={() => setShowPopup(false)}>
          <video id="popupVideo" ref={videoRef} autoPlay controls>
            <source src={hiddenMovie} type="video/mp4" />
          </video>
        </Popup>
      </div>
    </div>
  );
};

export default PaymentDoJo;
