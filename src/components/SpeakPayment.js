// Chat GPTの応答を音声で読み上げる関数

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

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
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

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
      console.error('Error:', error);
    }
  } else {
    setIsSpeaking(false);
  }
};

export default speakPayment;
