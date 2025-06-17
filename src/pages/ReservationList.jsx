import React, { useEffect, useState } from 'react';
import { getReservations, deleteReservation } from '../utils/firestoreUtils';
import './ReservationList.css';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import '../components/ReservationForm.css';

function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 予約一覧を取得
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'reservations'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Firestore reservations:', data);
      setReservations(data);
    } catch (e) {
      console.error('Firestore取得エラー:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // キャンセル処理
  const handleCancel = async (id) => {
    if (window.confirm('本当にキャンセルしますか？')) {
      await deleteReservation(id);
      fetchReservations(); // ← キャンセル後に一覧を更新
    }
  };

  const handleGoToCancelConfirm = (reservation) => {
    navigate('/cancel-confirm', { state: { reservation } });
  };

  return (
    <div className="reservation-form-container">
      <div className="reservation-list-card" style={{ maxWidth: 600, margin: '60px auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px rgba(38,166,154,0.10), 0 1.5px 8px rgba(0,0,0,0.04)', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2rem', color: '#26a69a', fontWeight: 'bold', letterSpacing: '0.04em' }}>自分の予約一覧</h2>
        {loading ? (
          <div>読み込み中...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>施設名</th>
                <th>日付</th>
                <th>時間</th>
                <th>人数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reservations.filter(r => r.userId === auth.currentUser.uid).length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>あなたの予約はまだありません</td>
                </tr>
              ) : (
                reservations
                  .filter(reservation => reservation.userId === auth.currentUser.uid)
                  .map(reservation => (
                    <tr key={reservation.id}>
                      <td>{reservation.room}</td>
                      <td>{reservation.date}</td>
                      <td>{reservation.startTime}〜{reservation.endTime}</td>
                      <td>{reservation.people}</td>
                      <td>
                        <button className="cancel-btn" onClick={() => handleGoToCancelConfirm(reservation)}>
                          キャンセル
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}
        <button 
          className="step-prev-btn"
          style={{ width: '100%', maxWidth: 220, minWidth: 120, fontSize: '1rem', padding: '0.7em 0', margin: '2.5rem auto 0 auto', display: 'block', background: '#607D8B', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap' }}
          onClick={() => navigate('/home')}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}

export default ReservationList;
