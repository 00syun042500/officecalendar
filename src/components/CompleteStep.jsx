import React from 'react';
import { useNavigate } from 'react-router-dom';

// Facility画像パスのマッピング
const facilityImages = {
  '会議室A': '/roomA.webp',
  '会議室B': '/roomB.webp',
  '会議室C': '/roomC.jpg',
  'シャワールームA': '/showerA.png',
  'シャワールームB': '/showerB.png',
  'シャワールームC': '/showerC.png',
  '個室A': '/privateA.png',
  '個室B': '/privateB.png',
  '個室C': '/privateC.png',
};

function CompleteStep({ facility, people, dateInfo, onReset, facilities }) {
  const navigate = useNavigate();
  const handleHome = () => {
    if (onReset) onReset();
    navigate('/home');
  };
  // 施設IDから施設オブジェクトを取得
  const selectedFacilityObj = facilities ? facilities.find(f => f.id === facility) : null;
  const facilityName = selectedFacilityObj ? selectedFacilityObj.name : facility;
  const facilityImage = selectedFacilityObj ? selectedFacilityObj.image : '';
  return (
    <div className="complete-card-modern">
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#26a69a' }}>予約が完了しました！</h2>
      <div className="complete-list">
        <div className="complete-item"><span>施設：</span>{facilityName}</div>
        <div className="complete-item"><span>人数：</span>{people}人</div>
        <div className="complete-item"><span>日付：</span>{dateInfo.date}</div>
        <div className="complete-item"><span>時間：</span>{dateInfo.startTime}～{dateInfo.endTime}</div>
        <div className="complete-item">
          <span>施設画像：</span>
          <img
            src={facilityImage}
            alt={facilityName}
            style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', marginTop: '10px', objectFit: 'cover' }}
          />
        </div>
      </div>
      <button
        className="home-btn"
        onClick={handleHome}
        style={{ margin: '2.5rem auto 0 auto', width: '100%', maxWidth: '300px', minWidth: '160px', fontSize: '1rem', padding: '0.7em 0', display: 'block', background: '#26a69a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        ホームに戻る
      </button>
      <button
        className="home-btn"
        onClick={() => {
          if (onReset) onReset();
          navigate('/reservations');
        }}
        style={{ margin: '1.2rem auto 0 auto', width: '100%', maxWidth: '300px', minWidth: '160px', fontSize: '1rem', padding: '0.7em 0', display: 'block', background: '#607D8B', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        予約一覧へ
      </button>
    </div>
  );
}

export default CompleteStep; 