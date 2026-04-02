import speak from "./Speak";
import { managerCategoriesById } from "../data/managerCategories";
import { postOpenAIJson } from "../utils/openaiClient";

export const sendToChatGPT = async (
  transcript,
  history,
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
    setError("送信する内容を入力してください。");
    return;
  }

  const activeCategory = managerCategoriesById[selectedMenuItem];
  const normalizedTranscript =
    transcript.trim() === "会議終了" && selectedMenuItem === "meetingOps"
      ? "ここまでの会話をもとに、決定事項、保留事項、次アクション、関係者へのフォロー文面に整理してください。"
      : transcript;

  setHistory((prevHistory) => [
    ...prevHistory,
    { role: "user", content: normalizedTranscript },
  ]);

  const systemMessage =
    activeCategory?.systemPrompt ||
    "あなたは課長の実務を支援する有能なアシスタントです。";

  const messagesForAPI = [
    { role: "system", content: systemMessage },
    ...history,
    { role: "user", content: normalizedTranscript },
  ];

  const requestData = {
    model: "gpt-5.4",
    messages: messagesForAPI,
  };

  try {
    const response = await postOpenAIJson("/chat/completions", requestData);
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
      );
    }

    await setHistory((prevHistory) => [
      ...prevHistory,
      { role: "assistant", content: responseText },
    ]);
    setTranscript("");
    setError("");
  } catch (error) {
    setError(error.message);
    console.error("Error sending to ChatGPT:", error);
  }
};
