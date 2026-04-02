// Chat GPTの応答を音声で読み上げる関数
import { postOpenAIJson } from "../utils/openaiClient";

// Chat GPTの応答を音声で読み上げる関数

export const speakPayment = async (
  text,
  isSpeaking,
  isVoiceEnabled,
  language,
  videoRef,
  setIsSpeaking
) => {
  if (isVoiceEnabled) {
    try {
      const response = await postOpenAIJson("/audio/speech", {
        model: "tts-1",
        input: text,
        voice: "alloy",
      });
      const audioBlob = await response.blob();
      const audioURL = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioURL);
      window.globalAudio = audio;
      audio.play();

      setIsSpeaking(true);

      audio.onended = () => {
        setIsSpeaking(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      };

      if (videoRef.current) {
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      setIsSpeaking(false);
    }
  } else {
    setIsSpeaking(false);
  }
};

export default speakPayment;
