import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReservationSuccess = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.95)', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '3rem' }}>
      <h2 style={{ color: '#007bff', marginBottom: '2rem' }}>✅ 予約が完了しました！</h2>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <button className="reserve-button" onClick={() => navigate('/home')}>ホームへ戻る</button>
        <button className="reserve-button" style={{ backgroundColor: '#607D8B' }} onClick={() => navigate('/reservations')}>予約一覧へ</button>
      </div>
    </div>
  );
};

export default ReservationSuccess; 