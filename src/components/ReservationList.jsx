import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 認証状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'reservations'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (!user) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>ログイン情報を確認中...</div>;
  }

  // userが取得できてからフィルタ
  const myReservations = reservations.filter(r => r.userId === user.uid);

  const handleGoToCancelConfirm = (reservation) => {
    // Implement the logic to handle going to cancel confirmation
    console.log('Going to cancel confirmation for reservation:', reservation);
  };

  return (
    <div className="reservation-list-card" style={{ maxWidth: 600, margin: '60px auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px rgba(38,166,154,0.10), 0 1.5px 8px rgba(0,0,0,0.04)', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2rem', color: '#26a69a', fontWeight: 'bold', letterSpacing: '0.04em' }}>自分の予約一覧</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
      ) : (
        <div style={{ width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(38,166,154,0.07)' }}>
            <thead>
              <tr style={{ background: '#26a69a', color: '#fff' }}>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem' }}>施設</th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem' }}>日付</th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem' }}>時間</th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem' }}>人数</th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {myReservations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '2em 0' }}>あなたの予約はまだありません</td>
                </tr>
              ) : (
                myReservations.map(reservation => (
                  <tr key={reservation.id} style={{ background: '#f8fafc', borderBottom: '1.5px solid #e0f2f1' }}>
                    <td style={{ padding: '0.7em 0.5em', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {facilityImages[reservation.room] && (
                        <img src={facilityImages[reservation.room]} alt={reservation.room} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', boxShadow: '0 1px 4px rgba(38,166,154,0.07)' }} />
                      )}
                      <span style={{ fontWeight: 'bold', color: '#222', fontSize: '1.08rem' }}>{reservation.room}</span>
                    </td>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>
                      {reservation.date && reservation.date.toDate
                        ? reservation.date.toDate().toLocaleDateString()
                        : reservation.date}
                    </td>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>
                      {reservation.startTime && reservation.startTime.toDate
                        ? reservation.startTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : reservation.startTime}
                      〜
                      {reservation.endTime && reservation.endTime.toDate
                        ? reservation.endTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : reservation.endTime}
                    </td>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>{reservation.people}</td>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>
                      <button className="step-next-btn" style={{ background: '#e57373', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6em 1.2em', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 1px 4px rgba(38,166,154,0.07)', transition: 'background 0.18s' }} onClick={() => handleGoToCancelConfirm(reservation)}>
                        キャンセル
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ReservationList; 