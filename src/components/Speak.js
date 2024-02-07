// Chat GPTの応答を音声で読み上げる関数
import idleMovie from "../movies/idol1.mp4";

export const speak = (text, isSpeaking, language, videoRef, setIsSpeaking) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  speechSynthesis.speak(utterance);
  setIsSpeaking(true);
  if (videoRef.current) {
    videoRef.current.play(); // 発話が始まったらビデオを再生
  }

  utterance.onend = () => {
    setIsSpeaking(false); // 読み上げが終了したことを示す
    if (videoRef.current) {
      videoRef.current.pause(); // ビデオを一時停止
    }
  };
};

export default speak;
