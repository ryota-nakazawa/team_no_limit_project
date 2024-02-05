// アイコンと名前を表示するコンポーネント

import React from 'react';

const UserIconWithName = (props) => {
  return (
    <div className="user-icon-with-name">
      <i className="bi bi-mic-fill"></i>
      <img src={props.iconUrl} alt={`${props.name} icon`} className="user-icon" />
      <div className="user-name">{props.name}</div>
    </div>
  );
};

export default UserIconWithName;
