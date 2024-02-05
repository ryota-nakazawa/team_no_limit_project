// チャットメッセージを表示するコンポーネント

import React from 'react';
import UserIconWithName from './UserIconWithName'; // UserIconWithNameコンポーネントをインポート

const ChatMessage = (props) => {
  return (
    <div className={`message ${props.role === "user" ? "user-message" : "gpt-message"}`}>
      <UserIconWithName name={props.name} iconUrl={props.iconUrl} />
      <div className="message-content">{props.content}</div>
    </div>
  );
};

export default ChatMessage;
