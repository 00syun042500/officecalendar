import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import './home.css'; // スタイルを共有

const localizer = momentLocalizer(moment);

const FacilityLedger = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [reservations, setReservations] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  // 施設一覧を取得
  useEffect(() => {
    const fetchFacilities = async () => {
      const querySnapshot = await getDocs(collection(db, 'facilities'));
      setFacilities(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchFacilities();
  }, []);

  // 選択した施設の予約履歴を取得
  useEffect(() => {
    if (!selectedFacility) return;
    const fetchReservations = async () => {
      const querySnapshot = await getDocs(collection(db, 'reservations'));
      const data = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.facilityId === selectedFacility);
      setReservations(data);
    };
    fetchReservations();
  }, [selectedFacility]);

  // カレンダー用イベントデータに変換
  useEffect(() => {
    const evs = reservations.map(r => ({
      id: r.id,
      title: `${r.userName || r.user || '不明'}（${r.people || '-'}人）`,
      start: new Date(`${r.date}T${r.startTime}`),
      end: new Date(`${r.date}T${r.endTime}`),
      resource: r
    }));
    setEvents(evs);
  }, [reservations]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: "url('/bg-marble.jpg') center/cover no-repeat fixed",
        padding: '0',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px rgba(38,166,154,0.10), 0 1.5px 8px rgba(0,0,0,0.04)', padding: 32 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24, fontSize: '1.7rem', color: '#26a69a', fontWeight: 'bold' }}>施設利用実績台帳</h2>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <select
            value={selectedFacility}
            onChange={e => setSelectedFacility(e.target.value)}
            style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #ccc', fontSize: 16, minWidth: 200 }}
          >
            <option value="">施設を選択してください</option>
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div className="calendar-wrapper" style={{ marginBottom: 32 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={event => setSelectedEvent(event)}
            messages={{
              next: '次',
              previous: '前',
              today: '今日',
              month: '月',
              week: '週',
              day: '日',
              agenda: '一覧'
            }}
            views={['month', 'week', 'day']}
            defaultView="month"
          />
        </div>
        {/* 詳細モーダル */}
        {selectedEvent && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 2px 12px rgba(0,0,0,0.13)' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 16 }}>利用履歴の詳細</h3>
              <div><b>利用者:</b> {selectedEvent.resource.userName || selectedEvent.resource.user || '不明'}</div>
              <div><b>日付:</b> {selectedEvent.resource.date}</div>
              <div><b>時間:</b> {selectedEvent.resource.startTime || selectedEvent.resource.time || '-'} ～ {selectedEvent.resource.endTime || selectedEvent.resource.time || '-'}</div>
              <div><b>人数:</b> {selectedEvent.resource.people || '-'}</div>
              <button
                style={{ marginTop: 24, background: '#607D8B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                onClick={() => setSelectedEvent(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="reserve-button reserve-btn-list"
          style={{
            marginTop: 8,
            width: '100%',
            maxWidth: 320,
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'block'
          }}
        >
          <span className="button-content">
            <img src="/icon-list.jpg" alt="ホームに戻る" className="button-icon" />
            ホームに戻る
          </span>
        </button>
      </div>
    </div>
  );
};

export default FacilityLedger; 