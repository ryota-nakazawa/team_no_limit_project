import React, { useState, useRef } from "react";
import "./SpeechToChatGPT.css";
import idleMovie from "../movies/man1.mp4";
import idleImage from "../images/idlepc.png";
import youImage from "../images/you.png";
import {
  BsFillSendFill,
  BsStopCircle,
  BsMic,
  BsFillMicFill,
} from "react-icons/bs";

// 環境変数に入れる
// const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// OpenAIのAPIエンドポイント
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

const SpeechToChatGPT = () => {
  const [history, setHistory] = useState([]); // 会話の履歴を保持する状態
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("ja-JP"); // デフォルトの言語を設定
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);

  // テキスト入力反映
  const handleChange = (event) => {
    setTranscript(event.target.value); // テキスト入力の変更をtranscriptに設定
  };

  // 音声入力開始
  const startRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language; // 言語設定
    recognition.continuous = true; // 連続認識モード
    recognition.interimResults = true; // 中間結果取得
    let finalTranscript = ""; // 最終結果を格納する変数

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    // 入力停止一時停止
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error("Recognition error: ", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  // 音声入力停止
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // アイコンと名前を表示するコンポーネント
  const UserIconWithName = ({ name, iconUrl }) => {
    return (
      <div className="user-icon-with-name">
        <i class="bi bi-mic-fill"></i>
        <img src={iconUrl} alt={`${name} icon`} className="user-icon" />
        <div className="user-name">{name}</div>
      </div>
    );
  };

  // チャットメッセージを表示するコンポーネント
  const ChatMessage = ({ role, name, iconUrl, content }) => {
    return (
      <div
        className={`message ${role === "user" ? "user-message" : "gpt-message"
          }`}
      >
        <UserIconWithName name={name} iconUrl={iconUrl} />
        <div className="message-content">{content}</div>
      </div>
    );
  };

  // 読み上げが終わった時にisSpeakingをfalseにする
  const handleSpeakEnd = () => {
    setIsSpeaking(false); // 読み上げが終了したことを示す
    if (videoRef.current) {
      videoRef.current.pause(); // ビデオを一時停止
    }
  };

  // Chat GPTの応答を音声で読み上げる関数
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    if (videoRef.current) {
      videoRef.current.play(); // 発話が始まったらビデオを再生
    }

    utterance.onend = () => {
      handleSpeakEnd(); // 読み上げが終わった時に呼ばれる関数を設定
    };
  };

  // GPTの返答を停止する関数
  const stopSpeaking = () => {
    speechSynthesis.cancel(); // 読み上げをキャンセル
    handleSpeakEnd();
  };

  // Chat GPTに送信する関数
  const sendToChatGPT = async () => {
    setError("");
    if (!transcript.trim()) {
      setError("Please say something to send.");
      return;
    }
    setHistory((prevHistory) => [
      ...prevHistory,
      { role: "user", content: transcript },
    ]);

    const requestData = {
      model: "gpt-3.5-turbo",
      max_tokens: 128,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    };

    try {
      const response = await fetch(OPENAI_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices[0].message.content;
        setHistory((prevHistory) => [
          ...prevHistory,
          { role: "assistant", content: responseText },
        ]);
        setTranscript("");
        setIsSpeaking(true);
        speak(responseText); // GPTからの返答を読み上げる関数
      } else {
        console.error("Error sending to ChatGPT:", response.statusText);
      }
    } catch (error) {
      console.error("Error sending to ChatGPT:", error);
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
              key={index}
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
          <button className="start-btn" onClick={startRecognition}>
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
          <button className="send-btn" onClick={sendToChatGPT}>
            <BsFillSendFill className="icon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SpeechToChatGPT;
