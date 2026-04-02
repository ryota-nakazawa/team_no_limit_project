const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY?.trim();

export const assertOpenAIKey = () => {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI APIキーが未設定です。.env を作成して REACT_APP_OPENAI_API_KEY を設定し、開発サーバーを再起動してください。"
    );
  }

  return OPENAI_API_KEY;
};

const readErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (payload?.error?.message) {
      return payload.error.message;
    }
  } catch (jsonError) {
    // Ignore JSON parse failure and fall back to text/status.
  }

  try {
    const text = await response.text();
    if (text) {
      return text;
    }
  } catch (textError) {
    // Ignore text read failure and fall back to status.
  }

  return response.statusText || "Unknown error";
};

export const postOpenAIJson = async (path, body) => {
  const apiKey = assertOpenAIKey();
  const response = await fetch(`https://api.openai.com/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(`OpenAI API error (${response.status}): ${message}`);
  }

  return response;
};
