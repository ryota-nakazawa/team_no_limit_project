import React, { useState, useRef, useEffect } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/idol1.mp4";
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
  const [language, setLanguage] = useState("ja-JP"); // デフォルトの言語を設定
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    // 初回レンダリング時にアニメーションを無効にする
    setIsAnimating(false);
  }, []);

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
      navigate("/payment"); // '/payment' パスへの遷移
    }, 300); // アニメーションが完了するまでの時間
  };

  // エンターキーが押され、Shiftキーが押されていない場合に送信する
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // デフォルトのエンターキーの動作（改行）を防止
      sendToChatGPT(); // チャット送信関数を呼び出す
    }
  };

  // Chat GPTに送信する関数
  const handleSendToChatGPT = () => {
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
  };

  return (
    <div className="container">
      <div class="sidebar">
        <div class="sidebar-menu">
          <div class="menu-item active">
            <TbMessageLanguage className="sidebar-icon" />
            英会話
          </div>
          <div class="menu-item">
            <TbMessages className="sidebar-icon" />
            雑談
          </div>
          <div class="menu-item">
            <PiTranslateBold className="sidebar-icon" />
            日英翻訳
          </div>
          <div class="menu-item">
            <TbTextSpellcheck className="sidebar-icon" />
            英文校正
          </div>
          <div class="menu-item">
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
