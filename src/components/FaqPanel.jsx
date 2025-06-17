import React, { useState } from 'react';
import './guide-panel.css'; // デザインを統一するため同じCSSを利用

const faqs = [
  {
    q: "Q. 予約の変更はできますか？",
    a: "A. 一度キャンセルして再度予約してください。"
  },
  {
    q: "Q. 予約の上限はありますか？",
    a: "A. 特にありませんが、節度をもって利用しましょう。"
  },
  {
    q: "Q. 予約完了メールは届きますか？",
    a: "A. 現在メール通知には対応していません。"
  },
  {
    q: "Q. 予約できる期間は？",
    a: "A. 施設によって異なりますので、管理者にお問い合わせください。"
  }
];

const FaqPanel = ({ onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300); // アニメーション時間と合わせる
  };

  return (
    <div className={`guide-panel guide-panel-right${closing ? ' slide-out-right' : ''}`}>
      <button className="guide-panel-close" onClick={handleClose} aria-label="閉じる">×</button>
      <div className="guide-panel-header">
        <span>よくある質問</span>
      </div>
      <ul className="guide-panel-list">
        {faqs.map((faq, idx) => (
          <li className="guide-panel-step" key={idx}>
            <span className="guide-panel-step-title" style={{ color: "#1976d2" }}>{faq.q}</span>
            <div className="guide-panel-step-desc faq-answer">{faq.a}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FaqPanel;
