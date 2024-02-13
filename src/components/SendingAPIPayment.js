// Chat GPTに送信する関数
import speakPayment from './SpeakPayment';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export const sendToChatGPTPayment = async (transcript, isSpeaking, language, videoRef, setHistory, setTranscript, setIsSpeaking, setError) => {

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
        content: "あなたは決済関連のIT企業に勤めている営業で言葉遣いがとても丁寧な言葉遣いです。返答の際には必ず決済に関する知識を混ぜながら回答してください。できれば回答の中で「座組」、「頭を刈り上げてでも」、「止血」と言ったキーワードを使い、語尾は「うんうん」にしてください。また、決済の話題以外での回答はしてはいけません。",
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
      speakPayment(responseText, isSpeaking, language, videoRef, setIsSpeaking); // GPTからの返答を読み上げる関数
    } else {
      console.error("Error sending to ChatGPT:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending to ChatGPT:", error);
  }
};
