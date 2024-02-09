import React, { useEffect } from 'react';
import "./Popup.css"; // ポップアップのスタイルを設定

export const Popup = ({ handleClose, show, children }) => {
  useEffect(() => {
    const video = document.getElementById('popupVideo');
    if (video) {
      // ポップアップが開かれた時に動画を再生する
      if (show) {
        video.play();
      } else {
        // ポップアップが閉じられた時に動画を停止する
        video.pause();
      }
    }
  }, [show]);

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
