import React, { useState, useRef, useEffect } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/bazz.mp4";
import hiddenMovie from "../movies/bazzdance.mp4";
import { sendToChatGPTPayment } from "./SendingAPIPayment"; // SendingAPIをインポート
import { startRecognition } from "./SpeechRecognition"; // SpeechRecognitionをインポート
import { useNavigate } from "react-router-dom";
import ChatMessage from "./ChatMessage"; // ChatMessageコンポーネントをインポート
import Popup from "./Popup";
import { IoAccessibility } from "react-icons/io5";
import { motion } from "framer-motion";
import useMedia from "use-media";

import {
  BsFillSendFill,
  BsStopCircle,
  BsMic,
  BsFillMicFill,
  BsFillVolumeUpFill,
  BsFillVolumeMuteFill,
} from "react-icons/bs";

const PaymentDoJo = () => {
  const [history, setHistory] = useState([]); // 会話の履歴を保持する状態
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("ja-JP"); // デフォルトの言語を設定
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const videoRefBazz = useRef(null);
  const videoRefDance = useRef(null);
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const isPc = useMedia("(min-width: 960px)");
  const isTablet = useMedia("(min-width: 520px) and (max-width: 959px)");
  const isMobile = useMedia("(max-width: 519px)");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // chatの一番下に自動でスクロールする
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [history]); // historyが更新されるたびに実行

  // テキスト入力反映
  const handleChange = (event) => {
    setTranscript(event.target.value); // テキスト入力の変更をtranscriptに設定
  };

  // テキストエリアをリサイズする関数
  const resizeTextarea = (event) => {
    const textarea = event.target;
    const MAX_ROWS = 4;

    // 一時的にheightをautoにしてscrollHeightを取得
    textarea.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
    const rows = Math.min(textarea.value.split("\n").length, MAX_ROWS);
    const newHeight = lineHeight * rows;

    // 新しい高さを設定
    textarea.style.height = `${newHeight}px`;
  };

  // 音声入力停止
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // 音声読み上げのオン/オフを切り替える関数
  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  // 読み上げが終わった時にisSpeakingをfalseにする
  const handleSpeakEnd = () => {
    setIsSpeaking(false); // 読み上げが終了したことを示す
    if (videoRefBazz.current) {
      videoRefBazz.current.pause(); // ビデオを一時停止
    }
  };

  // GPTの返答を停止する関数
  const stopSpeaking = () => {
    speechSynthesis.cancel(); // 読み上げをキャンセル
    handleSpeakEnd();
  };

  const handleNavigation = () => {
    navigate("/"); // '/payment' パスへの遷移
  };

  // エンターキーが押され、Shiftキーが押されていない場合に送信する
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // デフォルトのエンターキーの動作（改行）を防止
      handleSendToChatGPTPayment(); // チャット送信関数を呼び出す
    }
  };

  // Chat GPTに送信する関数
  const handleSendToChatGPTPayment = () => {
    setIsSendingMessage(true); // メッセージ送信中の状態をtrueに設定
    sendToChatGPTPayment(
      transcript,
      isSpeaking,
      language,
      videoRefBazz,
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
    <motion.div
      className="container"
      initial={{ opacity: 0, scale: 0.5, rotate: -180 }} // 初期状態: 透明で縮小して回転
      animate={{ opacity: 1, scale: 1, rotate: 0 }} // アニメーション後の状態: 完全に表示され、元のサイズと角度に戻る
      exit={{ opacity: 0, scale: 0.5, rotate: 180 }} // ページ遷移時の状態: 透明で縮小して逆方向に回転
      transition={{ duration: 1.2 }} // 0.5秒かけてアニメーションする
    >
      <div className="video-container">
        {isVoiceEnabled ? (
          <BsFillVolumeUpFill className="icon" onClick={toggleVoice} />
        ) : (
          <BsFillVolumeMuteFill className="icon" onClick={toggleVoice} />
        )}
        <video id="myVideo" ref={videoRefBazz} muted loop className="video">
          <source src={idleMovie} type="video/mp4" />
        </video>
      </div>

      {/* <div className="video-and-chat-container">
        <div className="video-container">
          <video id="myVideo" ref={videoRefBazz} muted loop className="video">
            <source src={idleMovie} type="video/mp4" />
          </video>
        </div>
        <div className="chat-container">
          <button className="clear-history" onClick={clearHistory}>
            &times;
          </button>
          {history.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
        </div>
      </div> */}

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
            <div>
              <button onClick={handleNavigation}>Back</button>
            </div>
            <div className="language">
              <button
                className={`language-btn ${
                  language === "ja-JP" ? "selected" : ""
                }`}
                onClick={() => setLanguage("ja-JP")}
              >
                日
              </button>
              <button
                className={`language-btn ${
                  language === "en-US" ? "selected" : ""
                }`}
                onClick={() => setLanguage("en-US")}
              >
                英
              </button>
            </div>
            <div className="textarea-container">
              <textarea
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
              onClick={handleSendToChatGPTPayment}
              disabled={isSendingMessage}
            >
              <BsFillSendFill className="icon" />
            </button>
          )}
          {/* ボタンをクリックしてポップアップを表示 */}
          <button className="popup-btn" onClick={() => setShowPopup(true)}>
            <IoAccessibility className="icon" />
          </button>
          <Popup show={showPopup} handleClose={() => setShowPopup(false)}>
            <video id="popupVideo" ref={videoRefDance} autoPlay controls>
              <source src={hiddenMovie} type="video/mp4" />
            </video>
          </Popup>
        </div>
      </div>

      {/* {(isTablet || isMobile) && (
        <div>
          <div className="img-container"><img src={bazzImage} alt="Image" /></div>
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
          </div></div>)
      } */}
    </motion.div>
  );
};

export default PaymentDoJo;
