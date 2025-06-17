import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';
import { getReservations } from '../utils/firestoreUtils'; // 予約取得関数
import './GoogleStyleCalendar.css';

export default function GoogleStyleCalendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Firestoreから予約データを取得してevents形式に変換
    getReservations().then((reservations) => {
      const mapped = reservations.map(r => ({
        title: `${r.room}予約`,
        start: `${r.date}T${r.startTime}`,
        end: `${r.date}T${r.endTime}`,
      }));
      setEvents(mapped);
    });
  }, []);

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      locale={jaLocale}
      events={events}
      height="auto"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      eventOverlap={true}
      slotEventOverlap={false}
      eventDisplay="block"
    />
  );
}
