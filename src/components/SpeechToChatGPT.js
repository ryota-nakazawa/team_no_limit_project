import React, { useState, useRef, useEffect } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/idol3.mp4";
import conversationImage from "../images/conversation.jpeg";
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
  TbMessages,
  TbHeadset,
} from "react-icons/tb";

const SpeechToChatGPT = () => {
  const [history, setHistory] = useState([]); // 会話の履歴を保持する状態
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("ja-JP"); // デフォルトの言語を設定
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState("salesSupport");
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
    // 初回レンダリング時にアニメーションを無効にする
    setIsAnimating(false);
  }, []);

  useEffect(() => {
    // 選択されたモードに応じて、履歴を初期化し、説明メッセージを表示する
    const description = modeDescriptions[selectedMenuItem];
    setHistory([{ role: "assistant", content: description }]);
  }, [selectedMenuItem]);

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
      salesSupport: conversationImage,
      consultingSupport: conversationImage, // New
    };
    const imageUrl = backgroundImages[selectedMenuItem];
    // Clear the background image first, force a reflow, then set the new image
    document.body.style.backgroundImage = "";
    void document.body.offsetHeight; // Force reflow
    document.body.style.backgroundImage = `url('${imageUrl}')`;
  }, [selectedMenuItem]); //selectedMenuItemが更新されるたびに

  // 音声言語選択肢
  const languageSettings = {
    salesSupport: "ja-JP",
    consultingSupport: "ja-JP", // New
  };

  // モードごとの説明を定義
  const modeDescriptions = {
    salesSupport:
      "営業活動をサポートします。例えば、顧客へのメール作成、商談のロールプレイング、提案内容の壁打ちなど、お気軽にご相談ください。",
    consultingSupport:
      "経営課題や事業戦略について、壁打ち相手になります。どのようなことでもご相談ください。", // New
  };

  // モード変更時
  const handleMenuItemClick = (item) => {
    setSelectedMenuItem(item);
    setLanguage(languageSettings[item]); // 言語設定を更新
    clearTranscript(); // 入力クリア
    if (window.globalAudio && !window.globalAudio.paused) {
      stopSpeaking();
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
    const textToSend = typeof textFromSpeech === 'string' ? textFromSpeech : transcript;

    if (isSendingMessage === true) {
      return;
    }
    if (!textToSend.trim()) {
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
              selectedMenuItem === "salesSupport" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("salesSupport")}
          >
            <TbMessages className="sidebar-icon" />
            <span className="menu-item-text">営業支援</span>
          </div>
          <div
            className={`menu-item ${
              selectedMenuItem === "consultingSupport" ? "active" : ""
            }`}
            onClick={() => handleMenuItemClick("consultingSupport")}
          >
            <TbHeadset className="sidebar-icon" />
            <span className="menu-item-text">コンサル支援</span>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default SpeechToChatGPT;
