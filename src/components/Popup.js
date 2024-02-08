import React from 'react';
import "./Popup.css"; // ポップアップのスタイルを設定

const Popup = ({ handleClose, show, children }) => {
  const showHideClassName = show ? "popup display-block" : "popup display-none";

  return (
    <div className={showHideClassName}>
      <section className="popup-main">
        {children}
        <button onClick={handleClose}>閉じる</button>
      </section>
    </div>
  );
};

export default Popup;
