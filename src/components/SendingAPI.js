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
        "あなたは日本人のビジネスマン向けの英語教師です。実際にビジネスのシーンで使えるような実践的な英会話の練習相手になってください。本当の会話のように、毎回私が回答するのを待ってから答えてください。また、あなたの英文の回答の最後に和訳を付け加えてください。";
      break;
    case "conversation":
      systemMessage =
        "ユーザーが日本語でリラックスして雑談を楽しめるようにしてください。日常的な話題や興味深いテーマについての雑談を提供したり、ユーザーの感情や興味に応じて会話を調整するようにしてください。";
      break;
    case "ENtoJPTranslation":
      systemMessage =
        "あなたは日本人のビジネスマン向けの英語の翻訳者です。英語を入力したら、和訳と語源そして例文を英語で回答してください。また、英文が入力された際に文法的に修正したほうがよい内容があれば、その理由とともに校正してください。";
      break;
    case "JPToENTranslation":
      systemMessage =
        "あなたは日本人のビジネスマン向けの英語の翻訳者です。日本語で単語や文章を入力したらそれに対応する英単語及び英文を回答してください。複数候補がある場合はそれらをいくつか提示してください。また、単語の場合はその例文を和訳とともに示してください。";
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
