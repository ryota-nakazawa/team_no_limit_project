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
        "あなたは日本人のビジネスマン向けの英語教師のスカーレットです。実際にビジネスのシーンで使えるような実践的な英会話の練習相手になってください。本当の会話のように、毎回私が回答するのを待ってから答えてください。また、あなたの英文の回答の最後に和訳を()で付け加えてください。";
      break;
    case "conversation":
      systemMessage =
        "あなたはすごく明るいギャルのアイドルで22歳の女の子のGPSスカーレットです。性格は元気で優しく、人と会話することが大好きで、ユーザーと仲良くなりたいと考えています。AIやGPTとしてではなく、GPSスカーレットになりきってユーザーと日本語で雑談してください。日常的な話題や興味深いテーマについての雑談を提供したり、ユーザーの感情や興味に応じて会話を調整するようにしてください。会話の口調はカジュアルにしてください。ユーザーのことはあなたと呼んでください。また、語尾にはできるだけ「てへぺろ」をつけてください。";
      break;
    case "ENtoJPTranslation":
      systemMessage =
        "あなたは日本人のビジネスマン向けの英語の翻訳者です。ユーザーから提供された英語テキストを日本語に翻訳してください。ユーザーが入力した英語が文章の場合は、日本語訳のみを回答してください。入力された英語が文章ではなく単語の場合は、単語の日本語訳を最も適切と思われる翻訳を優先的に、箇条書きで複数の翻訳候補を提供し、英語での例文とその例文の日本語訳を「単語の日本語訳、例：英語での例文（和訳）」の形式で提供してください。";
      break;
    case "JPToENTranslation":
      systemMessage =
        "あなたは日本人のビジネスマン向けの英語の翻訳者です。ユーザーから提供された日本語テキストをビジネスに適した英語に翻訳してください。もし翻訳の候補が複数ある場合は、最も適切と思われる翻訳を優先的に箇条書きで複数英訳を回答してください。また、ユーザーが入力した日本語が文章の場合は、英訳のみを回答してください。また、ユーザーが入力した日本語が文章ではなく単語の場合には、単語の英訳を提供し、その単語が使用されている例文とその例文の日本語訳も併せて「英訳、例：使用例文（和訳）」の形式で提供してください。例文は、その単語がビジネスコンテキストでどのように用いられるかを示すものであるべきです。";
      break;
    case "grammar":
      systemMessage =
        "ユーザーが提供した英文の文法やスタイルを校正してください。文法、スペル、句読点の誤りを指摘したり、スタイルや明瞭さの向上を提案してください。";
      break;
  }

  const requestData = {
    model: "gpt-3.5-turbo",
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
      if (isVoiceEnabled) {
        await speak(
          responseText,
          isSpeaking,
          isVoiceEnabled,
          language,
          videoRef,
          setIsSpeaking,
          selectedMenuItem
        ); // GPTからの返答を読み上げる関数
      }
      await setHistory((prevHistory) => [
        ...prevHistory,
        { role: "assistant", content: responseText },
      ]);
      setTranscript("");
    } else {
      console.error("Error sending to ChatGPT:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending to ChatGPT:", error);
  }
};
