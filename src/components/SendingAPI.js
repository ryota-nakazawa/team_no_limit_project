// Chat GPTに送信する関数
import speak from "./Speak"; // Speak.js をインポート

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export const sendToChatGPT = async (
  transcript,
  isSpeaking,
  isVoiceEnabled,
  language,
  videoRef,
  selectedMenuItem,
  setHistory,
  setTranscript,
  setIsSpeaking,
  setError
) => {
  if (!transcript.trim()) {
    setError("Please say something to send.");
    return;
  }
  setHistory((prevHistory) => [
    ...prevHistory,
    { role: "user", content: transcript },
  ]);

  let systemMessage = "You are a helpful assistant.";
  switch (selectedMenuItem) {
    case "englishConversation":
      systemMessage =
        "ユーザーが英語の会話練習をできるようにしてください。ユーザーの入力に対して自然な英語で返答すること、会話を続けるための質問を提案すること、必要に応じて、会話のヒントや文法のアドバイスを提供するようにしてください。";
      break;
    case "conversation":
      systemMessage =
        "ユーザーが日本語でリラックスして雑談を楽しめるようにしてください。日常的な話題や興味深いテーマについての雑談を提供したり、ユーザーの感情や興味に応じて会話を調整するようにしてください。";
      break;
    case "translation":
      systemMessage =
        "ユーザーの日本語のテキストを英語に翻訳してください。ユーザーが提供した日本語のテキストを正確に英語に翻訳すること、文脈を考慮した自然な翻訳を提供するようにしてください。";
      break;
    case "grammar":
      systemMessage =
        "ユーザーが提供した英文の文法やスタイルを校正してください。文法、スペル、句読点の誤りを指摘したり、スタイルや明瞭さの向上を提案してください。";
      break;
  }

  const requestData = {
    model: "gpt-3.5-turbo",
    max_tokens: 128,
    messages: [
      {
        role: "system",
        content: systemMessage,
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
      await speak(
        responseText,
        isSpeaking,
        isVoiceEnabled,
        language,
        videoRef,
        setIsSpeaking
      ); // GPTからの返答を読み上げる関数
      await setHistory((prevHistory) => [
        ...prevHistory,
        { role: "assistant", content: responseText },
      ]);
      setTranscript("");
      setIsSpeaking(true);

    } else {
      console.error("Error sending to ChatGPT:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending to ChatGPT:", error);
  }
};
