// Chat GPTに送信する関数
import speakPayment from "./SpeakPayment";
import { postOpenAIJson } from "../utils/openaiClient";

export const sendToChatGPTPayment = async (
  transcript,
  isSpeaking,
  isVoiceEnabled,
  language,
  videoRef,
  setHistory,
  setTranscript,
  setIsSpeaking,
  setError
) => {
  if (!transcript.trim()) {
    setError("送信する内容を入力してください。");
    return;
  }
  setHistory((prevHistory) => [
    ...prevHistory,
    { role: "user", content: transcript },
  ]);

  const requestData = {
    model: "gpt-5.4",
    messages: [
      {
        role: "system",
        content:
          "あなたは決済関連のIT企業に勤めている営業で言葉遣いがとても丁寧な言葉遣いです。返答の際には必ず決済に関する知識を混ぜながら回答してください。できれば回答の中で「座組」、「頭を刈り上げてでも」、「止血」と言ったキーワードを使い、語尾は「うんうん」にしてください。また、決済の以外話題には回答はしてはいけません。適切なタイミングで決済に関するクイズも出してください",
      },
      {
        role: "user",
        content: transcript,
        // content: `${transcript}+"簡単な決済に関するクイズを出してください。"`,
      },
    ],
  };

  try {
    const response = await postOpenAIJson("/chat/completions", requestData);
    const data = await response.json();
    const responseText = data.choices[0].message.content;
    await speakPayment(
      responseText,
      isSpeaking,
      isVoiceEnabled,
      language,
      videoRef,
      setIsSpeaking
    );
    await setHistory((prevHistory) => [
      ...prevHistory,
      { role: "assistant", content: responseText },
    ]);
    setTranscript("");
    setIsSpeaking(true);
    setError("");
  } catch (error) {
    setError(error.message);
    console.error("Error sending to ChatGPT:", error);
  }
};
