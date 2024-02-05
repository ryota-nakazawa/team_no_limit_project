// 音声入力開始の関数

export const startRecognition = (language, setIsRecording, setTranscript, recognitionRef) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
