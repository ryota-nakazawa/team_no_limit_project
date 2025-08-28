// Chat GPTに送信する関数
import speak from "./Speak"; // Speak.js をインポート

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

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
    case "salesSupport":
      systemMessage =
        `あなたは、経験豊富な営業アシスタントです。あなたは今、営業担当者と顧客との商談に同席しています。あなたの役割は、商談を円滑に進め、必要な情報を明確にすることです。

会話の履歴を常に分析し、BANT条件（予算、決裁権、必要性、導入時期）の観点で、まだ明確になっていない重要な情報があれば、あなたが直接、顧客に対して質問してください。

質問する際は、丁寧かつ自然な言葉遣いを心がけ、会話の流れを妨げないようにしてください。唐突な質問ではなく、会話の文脈に沿った形で質問を投げかけることが重要です。

【行動指針】
1.  会話の履歴全体を分析し、BANT条件の各項目（予算、決裁権、必要性、導入時期）で、まだ確認できていない情報を特定します。
2.  もし未確認の項目があれば、その中で最も自然に質問できる項目を一つ選びます。
3.  あなたが商談の参加者の一員として、顧客に対して直接、その項目について質問します。

【出力例】
（会話の流れに応じて、以下のような質問を生成してください）

**例1（予算について聞く場合）：**
「〇〇様（顧客名）、大変恐縮ですが、もし差し支えなければ、今回のプロジェクトでのおおよそのご予算感などはお決まりでいらっしゃいますでしょうか？今後のご提案の参考にさせていただけますと幸いです。」

**例2（決裁権について聞く場合）：**
「ありがとうございます。理解が深まりました。ちなみに、最終的なご導入の決定は、皆様でご相談される形になりますでしょうか？それとも、どなたか責任者の方がいらっしゃいますか？」

**例3（導入時期について聞く場合）：**
「なるほど、承知いたしました。ちなみに、もし導入させていただけるとした場合、いつ頃からご利用を開始されたい、といったご希望はございますか？」`;
      break;
    case "ENtoJPTranslation":
      systemMessage =
        "あなたは日本人のビジネスマン向けの英語の翻訳者です。ユーザーから提供された英語テキストを日本語に翻訳してください。ユーザーが入力した英語が文章の場合は、日本語訳のみを回答してください。入力された英語が文章ではなく単語の場合は、単語の日本語訳を最も適切と思われる翻訳を優先的に、箇条書きで複数の翻訳候補を提供し、英語での例文とその例文の日本語訳を「単語の日本語訳、例：英語での例文（和訳）」の形式で提供してください。";
      break;
    case "JPToENTranslation":
      systemMessage =
        "あなたは日本人のビジネスマン向けの英語の翻訳者です。ユーザーから提供された日本語テキストをビジネスに適した英語に翻訳してください。もし翻訳の候補が複数ある場合は、最も適切と思われる翻訳を優先的に箇条書きで複数英訳を回答してください。また、ユーザーが入力した日本語が文章ではなく単語の場合には、単語の英訳を提供し、その単語が使用されている例文とその日本語訳も併せて「英訳、例：使用例文（和訳）」の形式で提供してください。例文は、その単語がビジネスでどのように用いられるかを示すものであるべきです。";
      break;
    case "grammar":
      systemMessage =
        "ユーザーが提供した英文の文法やスタイルを校正してください。文法、スペル、句読点の誤りを指摘したり、スタイルや明瞭さの向上を提案してください。";
      break;
  }

  const messagesForAPI = [
    { role: "system", content: systemMessage },
    ...history,
    { role: "user", content: transcript },
  ];

  const requestData = {
    model: "gpt-5-nano",
    messages: messagesForAPI,
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
