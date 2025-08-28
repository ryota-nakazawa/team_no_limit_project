// 音声入力開始の関数

export const startRecognition = (language, setIsRecording, setTranscript, recognitionRef, onSilence) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  let silenceTimer = null;

  recognition.lang = language; // 言語設定
  recognition.continuous = true; // 連続認識モード
  recognition.interimResults = true; // 中間結果取得
  let finalTranscript = ""; // 最終結果を格納する変数

  recognition.onresult = (event) => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
    }

    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    const currentTranscript = finalTranscript + interimTranscript;
    setTranscript(currentTranscript);

    silenceTimer = setTimeout(() => {
      if (currentTranscript.trim()) {
        onSilence(currentTranscript);
      }
    }, 1000);
  };

  // 入力停止一時停止
  recognition.onend = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
    }
    setIsRecording(false);
  };

  recognition.onerror = (event) => {
    console.error("Recognition error: ", event.error);
    if (silenceTimer) {
      clearTimeout(silenceTimer);
    }
  };

  recognition.start();
  recognitionRef.current = recognition;
  setIsRecording(true);
};
