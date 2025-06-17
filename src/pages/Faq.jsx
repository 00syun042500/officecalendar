import React from 'react';
import { useNavigate } from 'react-router-dom';

const faqs = [
  {
    q: 'Q. 予約のキャンセルはどうやって行いますか？',
    a: 'A. 「予約一覧」画面からキャンセルしたい予約の「キャンセル」ボタンを押してください。',
  },
  {
    q: 'Q. 予約できる最大人数や時間は？',
    a: 'A. 会議室は最大10人・6時間まで、個室・シャワールームは1人・個室3時間/シャワー30分までです。',
  },
  {
    q: 'Q. 他の人の予約状況は見られますか？',
    a: 'A. 「空き状況」カレンダーで他の利用者の予約枠も確認できます（個人情報は表示されません）。',
  },
  {
    q: 'Q. 予約完了メールは届きますか？',
    a: 'A. 現在は画面上での通知のみです。今後メール通知機能も追加予定です。',
  },
  {
    q: 'Q. ログインできない場合は？',
    a: 'A. パスワード再設定や管理者へのお問い合わせをお願いします。',
  },
];

function Faq() {
  const navigate = useNavigate();
  return (
    <div className="guide-bg">
      <div className="guide-card">
        <h2 className="guide-title">よくある質問</h2>
        <ul className="faq-list">
          {faqs.map((item, i) => (
            <li key={i} className="faq-item">
              <div className="faq-q">{item.q}</div>
              <div className="faq-a">{item.a}</div>
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

export default Faq;
