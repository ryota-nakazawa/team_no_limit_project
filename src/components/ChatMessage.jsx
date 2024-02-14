// チャットメッセージを表示するコンポーネント
import React from "react";

const ChatMessage = (props) => {
  return (
    <div
      className={`message ${
        props.role === "user" ? "user-message" : "gpt-message"
      }`}
    >
      <div className="message-content">{props.content}</div>
    </div>
  );
};

export default ChatMessage;
