// Chat GPTの応答を音声で読み上げる関数
export const speak = (
  text,
  isSpeaking,
  isVoiceEnabled,
  language,
  videoRef,
  setIsSpeaking
) => {
  if (isVoiceEnabled) {
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
  } else {
    // isVoiceEnabledがfalseの場合、即座にisSpeakingをfalseに設定する
    setIsSpeaking(false); // ここで直接isSpeakingをfalseに設定
  }
};

export default speak;
