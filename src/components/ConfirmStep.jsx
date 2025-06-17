import React from 'react';

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

function ConfirmStep({ facility, people, dateInfo, onPrev, onNext, facilities }) {
  // 施設IDから施設オブジェクトを取得
  const selectedFacilityObj = facilities.find(f => f.id === facility);
  const facilityName = selectedFacilityObj ? selectedFacilityObj.name : facility;
  const facilityImage = selectedFacilityObj ? selectedFacilityObj.image : '';

  return (
    <div className="confirm-card-modern">
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>予約内容の確認</h2>
      <div className="confirm-list">
        <div className="confirm-item"><span>施設：</span>{facilityName}</div>
        <div className="confirm-item"><span>人数：</span>{people}人</div>
        <div className="confirm-item"><span>日付：</span>{dateInfo.date}</div>
        <div className="confirm-item"><span>時間：</span>{dateInfo.startTime}～{dateInfo.endTime}</div>
        <div className="confirm-item">
          <span>施設画像：</span>
          <img
            src={facilityImage}
            alt={facilityName}
            style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', marginTop: '10px', objectFit: 'cover' }}
          />
        </div>
      </div>
      <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.2rem', justifyContent: 'center' }}>
        <button
          className="step-prev-btn"
          onClick={onPrev}
          style={{ width: '100%', maxWidth: '300px', minWidth: '160px', fontSize: '1rem', padding: '0.7em 0', margin: '0 auto', display: 'block', whiteSpace: 'nowrap' }}
        >
          戻る
        </button>
        <button
          className="step-next-btn"
          onClick={onNext}
          style={{ width: '100%', maxWidth: '300px', minWidth: '160px', fontSize: '1rem', padding: '0.7em 0', margin: '0 auto', display: 'block', background: '#26a69a', color: '#fff', whiteSpace: 'nowrap' }}
        >
          この内容で予約する
        </button>
      </div>
    </div>
  );
}

export default ConfirmStep; 