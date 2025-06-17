import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { deleteReservation } from '../utils/firestoreUtils';
import { toast } from 'react-toastify';

// 施設画像パスのマッピング
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

function CancelConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reservation } = location.state || {};

  if (!reservation) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundImage: 'url("/white-marble.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'relative'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          データがありません。
        </div>
      </div>
    );
  }

  const handleCancel = async () => {
    try {
      await deleteReservation(reservation.id);
      toast.success('キャンセルしました', {
        position: 'top-center',
        autoClose: 2000,
        onClose: () => navigate('/reservations'),
      });
    } catch (error) {
      toast.error('キャンセルに失敗しました。もう一度お試しください。', {
        position: 'top-center',
        autoClose: 3000,
      });
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundImage: 'url("/white-marble.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      position: 'relative',
      padding: '2.5rem 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '18px',
        boxShadow: '0 4px 18px rgba(38,166,154,0.10), 0 1.5px 8px rgba(0,0,0,0.04)',
        padding: '40px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          fontSize: '2rem',
          color: '#e57373',
          fontWeight: 'bold',
          letterSpacing: '0.04em'
        }}>
          予約キャンセル確認
        </h2>

        <div style={{
          width: '100%',
          maxWidth: '300px',
          marginBottom: '2rem'
        }}>
          <img
            src={facilityImages[reservation.room] || '/images/default.jpg'}
            alt={reservation.room}
            style={{
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              objectFit: 'cover'
            }}
          />
        </div>

        <div style={{
          width: '100%',
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold', color: '#666', marginRight: '0.5rem' }}>施設：</span>
            <span style={{ fontSize: '1.1rem', color: '#333' }}>{reservation.room}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold', color: '#666', marginRight: '0.5rem' }}>日付：</span>
            <span style={{ fontSize: '1.1rem', color: '#333' }}>{reservation.date}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold', color: '#666', marginRight: '0.5rem' }}>時間：</span>
            <span style={{ fontSize: '1.1rem', color: '#333' }}>{reservation.startTime}〜{reservation.endTime}</span>
          </div>
          <div>
            <span style={{ fontWeight: 'bold', color: '#666', marginRight: '0.5rem' }}>人数：</span>
            <span style={{ fontSize: '1.1rem', color: '#333' }}>{reservation.people}人</span>
          </div>
        </div>

        <p style={{
          color: '#e57373',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          本当にキャンセルしますか？
        </p>

        <div style={{
          display: 'flex',
          gap: '1.2rem',
          width: '100%',
          maxWidth: '400px'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              padding: '0.7em 0',
              fontSize: '1rem',
              background: '#607D8B',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background 0.2s'
            }}
          >
            戻る
          </button>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              padding: '0.7em 0',
              fontSize: '1rem',
              background: '#e57373',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background 0.2s'
            }}
          >
            キャンセルする
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelConfirm;
