import React, { useEffect, useRef, useState } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/idol3.mp4";
import { sendToChatGPT } from "./SendingAPI";
import { startRecognition } from "./SpeechRecognition";
import { useNavigate } from "react-router-dom";
import ChatMessage from "./ChatMessage";
import {
  managerCategories,
  managerCategoriesById,
} from "../data/managerCategories";
import {
  BsBarChart,
  BsCheck2Circle,
  BsClipboardCheck,
  BsCompass,
  BsFillMicFill,
  BsFillSendFill,
  BsFillVolumeMuteFill,
  BsFillVolumeUpFill,
  BsGlobe,
  BsKanban,
  BsLightbulb,
  BsMic,
  BsPeople,
  BsStopCircle,
} from "react-icons/bs";

const categoryIcons = {
  dailyOps: <BsCompass className="manager-nav-icon" />,
  meetingOps: <BsClipboardCheck className="manager-nav-icon" />,
  memberSupport: <BsPeople className="manager-nav-icon" />,
  stakeholderComms: <BsCheck2Circle className="manager-nav-icon" />,
  planningAnalysis: <BsBarChart className="manager-nav-icon" />,
  decisionSupport: <BsLightbulb className="manager-nav-icon" />,
  progressManagement: <BsKanban className="manager-nav-icon" />,
  englishPractice: <BsGlobe className="manager-nav-icon" />,
};

const SpeechToChatGPT = () => {
  const [history, setHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("ja-JP");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState(
    managerCategories[0].id
  );
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isIMEActive, setIsIMEActive] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const activeCategory = managerCategoriesById[selectedMenuItem];
  const idolStatus = isRecording
    ? "聞き取り中"
    : isSendingMessage
      ? "考え中"
      : isSpeaking
        ? "返答中"
        : "待機中";

  useEffect(() => {
    setHistory([{ role: "assistant", content: activeCategory.description }]);
    setError("");
  }, [activeCategory]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    document.addEventListener("compositionstart", handleCompositionStart);
    document.addEventListener("compositionend", handleCompositionEnd);

    return () => {
      document.removeEventListener("compositionstart", handleCompositionStart);
      document.removeEventListener("compositionend", handleCompositionEnd);
    };
  }, []);

  const handleMenuItemClick = (item) => {
    setSelectedMenuItem(item);
    setLanguage("ja-JP");
    clearTranscript();
    if (window.globalAudio && !window.globalAudio.paused) {
      stopSpeaking();
    }
  };

  const handleChange = (event) => {
    setTranscript(event.target.value);
  };

  const handleCompositionStart = () => {
    setIsIMEActive(true);
  };

  const handleCompositionEnd = () => {
    setIsIMEActive(false);
  };

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

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecognition = () => {
    setIsButtonDisabled(true);
    if (isRecording) {
      stopRecognition();
    } else {
      startRecognition(
        language,
        setIsRecording,
        setTranscript,
        recognitionRef,
        (text) => handleSendToChatGPT(text)
      );
    }
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 200);
  };

  const handleSpeakEnd = () => {
    setIsSpeaking(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const toggleVoice = () => {
    if (window.globalAudio && !window.globalAudio.paused) {
      stopSpeaking();
    }
    setIsVoiceEnabled((prevState) => !prevState);
  };

  const stopSpeaking = () => {
    if (window.globalAudio) {
      window.globalAudio.pause();
    }
    handleSpeakEnd();
  };

  const handleNavigation = () => {
    navigate("/payment", { state: { message: "成功", type: "success" } });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !isIMEActive) {
      event.preventDefault();
      handleSendToChatGPT();
    }
  };

  const handleSendToChatGPT = (textFromSpeech) => {
    const textToSend =
      typeof textFromSpeech === "string" ? textFromSpeech : transcript;

    if (isSendingMessage || !textToSend.trim()) {
      return;
    }

    setIsSendingMessage(true);
    stopRecognition();

    if (textToSend === "bazz") {
      handleNavigation();
      return;
    }

    sendToChatGPT(
      textToSend,
      history,
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
        setIsSendingMessage(false);
      })
      .catch((requestError) => {
        setError(requestError?.message || String(requestError));
        setIsSendingMessage(false);
      });
  };

  const clearHistory = () => {
    setHistory([{ role: "assistant", content: activeCategory.description }]);
    setError("");
  };

  const clearTranscript = () => {
    setTranscript("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight - 10
      }px`;
    }
  };

  return (
    <div className="container home-shell">
      <aside className="manager-sidebar-nav">
        <div className="manager-sidebar-brand">
          <p className="manager-sidebar-kicker">Manager Copilot</p>
          <h1>課長お助けエージェント</h1>
          <p className="manager-sidebar-copy">
            アイドルに相談しながら、課長業務をカテゴリ別に支援します。
          </p>
        </div>

        <div className="manager-sidebar-menu">
          {managerCategories.map((category) => (
            <button
              key={category.id}
              className={`manager-nav-item ${
                selectedMenuItem === category.id ? "active" : ""
              }`}
              onClick={() => handleMenuItemClick(category.id)}
              type="button"
            >
              {categoryIcons[category.id]}
              <span className="manager-nav-body">
                <span className="manager-nav-label">{category.label}</span>
                <span className="manager-nav-subtext">{category.title}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="manager-sidebar-footer">
          <strong>{activeCategory.label}</strong>
          <p>{activeCategory.summary}</p>
        </div>
      </aside>

      <div
        className={`video-container idol-stage ${
          isSpeaking ? "is-speaking" : ""
        } ${isRecording ? "is-recording" : ""}`}
      >
        <div className="idol-stage-shell">
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
          <div className="idol-stage-frame">
            <div className="idol-stage-ring" />
            <video id="myVideo" ref={videoRef} muted loop className="video idol-video">
              <source src={idleMovie} type="video/mp4" />
            </video>
          </div>
          <div className="idol-stage-footer">
            <span className="idol-status-dot" />
            <span>{idolStatus}</span>
          </div>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-category-header">
          <div>
            <p className="chat-category-label">{activeCategory.label}</p>
            <h2>{activeCategory.title}</h2>
          </div>
          <button type="button" className="chat-reset-btn" onClick={clearHistory}>
            履歴を初期化
          </button>
        </div>

        <div className="chat-history-container" ref={chatHistoryRef}>
          {error ? <div className="error-banner">{error}</div> : null}
          {history.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}
        </div>

        <div className="transcript-and-send-container composer-shell">
          <div className="textarea-with-icon">
            <div className="textarea-container">
              <textarea
                ref={textareaRef}
                rows="1"
                value={transcript}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onInput={resizeTextarea}
                placeholder="状況や相談したい内容を入力してください"
              />
            </div>
            <button className="clear-btn" onClick={clearTranscript} type="button">
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
              type="button"
            >
              {isRecording ? (
                <BsFillMicFill className="icon Recording-icon" />
              ) : (
                <BsMic className="icon Recording-icon" />
              )}
            </button>
          </div>

          {isSpeaking ? (
            <button className="stop-speak-btn" onClick={stopSpeaking} type="button">
              <BsStopCircle className="icon" />
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSendToChatGPT}
              disabled={isSendingMessage}
              type="button"
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
