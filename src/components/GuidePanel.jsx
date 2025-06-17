import React, { useState } from 'react';
import './guide-panel.css';

const steps = [
  {
    icon: "📝",
    title: "予約方法",
    desc: "「予約する」ボタンから施設・日時・人数を選んで予約できます。"
  },
  {
    icon: "📋",
    title: "予約一覧の確認",
    desc: "「予約一覧」ボタンで自分の予約状況を確認できます。"
  },
  {
    icon: "📅",
    title: "空き状況の確認",
    desc: "「空き状況」ボタンで他の予約状況もカレンダーで確認できます。"
  },
  {
    icon: "❌",
    title: "予約のキャンセル",
    desc: "予約一覧からキャンセルしたい予約を選んでキャンセルできます。"
  }
];

const GuidePanel = ({ onClose }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300); // アニメーション時間と合わせる
  };

  return (
    <div className={`guide-panel${closing ? ' slide-out-left' : ''}`}>
      <button className="guide-panel-close" onClick={handleClose} aria-label="閉じる">×</button>
      <div className="guide-panel-header">
        <span>使い方ガイド</span>
      </div>
      <ul className="guide-panel-list">
        {steps.map((step, idx) => (
          <li className="guide-panel-step" key={idx}>
            <span className="guide-panel-step-icon">{step.icon}</span>
            <span className="guide-panel-step-title">{step.title}</span>
            <div className="guide-panel-step-desc">{step.desc}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GuidePanel;
