import React from 'react';
import { useNavigate } from 'react-router-dom';
import './guide.css';

const guideSteps = [
  {
    title: '施設を選ぶ',
    desc: '「予約する」ボタンから利用したい施設を選択します。会議室・個室・シャワールームなど用途に合わせて選べます。',
    icon: '🏢',
  },
  {
    title: '人数・日時を入力',
    desc: '利用人数と希望日時を選択します。空き状況カレンダーで混雑状況も確認できます。',
    icon: '🗓️',
  },
  {
    title: '内容を確認して予約',
    desc: '入力内容を確認し、「この内容で予約する」ボタンで予約完了！',
    icon: '✅',
  },
  {
    title: '予約の確認・キャンセル',
    desc: '「予約一覧」から自分の予約状況を確認できます。不要になった予約は一覧からキャンセル可能です。',
    icon: '📋',
  },
];

function Guide() {
  const navigate = useNavigate();
  return (
    <div className="guide-bg">
      <div className="guide-card guide-center-card">
        <h2 className="guide-title">
          <span role="img" aria-label="guide" style={{ marginRight: 8 }}>📝</span>
          使い方ガイド
        </h2>
        <ul className="guide-list">
          {guideSteps.map((step, i) => (
            <li key={i} className="guide-step">
              <div className="guide-step-header">
                <span className="guide-step-icon">{step.icon}</span>
                <span className="guide-step-title">{`${i + 1}. ${step.title}`}</span>
              </div>
              <div className="guide-step-desc">{step.desc}</div>
            </li>
          ))}
        </ul>
        <button
          className="step-prev-btn"
          style={{ margin: '2.5rem auto 0 auto', width: '100%', maxWidth: 220, minWidth: 120 }}
          onClick={() => navigate('/home')}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}

export default Guide;
