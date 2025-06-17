import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './CalendarPage.css';
import GoogleStyleCalendar from '../components/GoogleStyleCalendar';

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reservations'), (snapshot) => {
      const rawReservations = snapshot.docs.map((doc) => doc.data());
      const getCategory = (roomName) => {
        if (roomName.includes('会議室')) return '会議室';
        if (roomName.includes('個室')) return '個室';
        if (roomName.includes('シャワールーム')) return 'シャワールーム';
        return 'その他';
      };
      const reservationMap = {};
      rawReservations.forEach((res) => {
        const category = getCategory(res.room);
        const key = `${category}_${res.date}_${res.startTime}`;
        if (!reservationMap[key]) {
          reservationMap[key] = [];
        }
        reservationMap[key].push(res);
      });
      const statusEvents = Object.entries(reservationMap).map(([key, reservations]) => {
        const [category, date, startTime] = key.split('_');
        let status = '○ 受付中';
        let bgColor = '#00cc99'; // 緑
        if (reservations.length >= 3) {
          status = '× 締切';
          bgColor = '#e57373'; // 赤
        } else if (reservations.length >= 2) {
          status = '△ 残りわずか';
          bgColor = '#ffb300'; // 黄
        }
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        return {
          title: `${category} - ${status}`,
          start,
          end,
          bgColor,
        };
      });
      setEvents(statusEvents);
    });
    return () => unsubscribe();
  }, []);

  const eventPropGetter = (event) => {
    return {
      style: {
        backgroundColor: event.bgColor,
        color: event.bgColor === '#ffb300' ? '#333' : '#fff',
        border: 'none',
        fontWeight: 'bold',
      },
    };
  };

  return (
    <div className="calendarpage-container">
      <h2 className="calendarpage-title">空き状況カレンダー</h2>
      <div className="calendar-wrapper">
        <GoogleStyleCalendar />
      </div>
      <button 
        className="step-prev-btn"
        style={{ width: '100%', maxWidth: 220, minWidth: 120, fontSize: '1rem', padding: '0.7em 0', margin: '2.5rem auto 0 auto', display: 'block', background: '#607D8B', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap' }}
        onClick={() => navigate('/home')}
      >
        ホームに戻る
      </button>
    </div>
  );
};

export default CalendarPage; 