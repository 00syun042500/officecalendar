import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// 仮の空き状況データ（本番はAPIやDB連携）
function getMockAvailability(startDate) {
  // 7日分の日付とランダムな空き状況を生成
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    // ランダムな空き状況（本番はAPI/DB）
    const slots = {};
    timeSlots.forEach(slot => {
      slots[slot] = Math.random() > 0.5;
    });
    days.push({ date: dateStr, slots });
  }
  return days;
}

// 09:00～21:00まで30分刻み
const timeSlots = [
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00', '18:30',
  '19:00', '19:30',
  '20:00', '20:30',
  '21:00',
];

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}-${('0' + d.getDate()).slice(-2)}`;
}

function getWeekDates(startDate) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// 時刻文字列（"12:00"）を分数に変換
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function DateStep({ value, onChange, onPrev, onNext, facility, people }) {
  const [selected, setSelected] = useState({ date: '', start: '', end: '' });
  const [weekOffset, setWeekOffset] = useState(0);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 週の開始日を計算
  const today = new Date();
  today.setHours(0,0,0,0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(weekStart);

  console.log('DateStep people:', people);
  const selectedPeople = people || 1;

  // Firestoreから予約データ取得
  useEffect(() => {
    setLoading(true);
    getDocs(collection(db, 'reservations')).then(snapshot => {
      setReservations(snapshot.docs.map(doc => doc.data()));
      setLoading(false);
    });
  }, []);

  // カレンダーの○/−判定
  function isSlotAvailable(date, slot) {
    if (!facility) return false;
    // その施設・日付・時間帯に予約が1件でもあれば予約不可
    const unavailable = reservations.some(r =>
      r.room === facility &&
      r.date === date &&
      timeToMinutes(slot) >= timeToMinutes(r.startTime) &&
      timeToMinutes(slot) < timeToMinutes(r.endTime)
    );
    return !unavailable;
  }

  // 範囲選択ロジック
  const handleCellClick = (date, slot) => {
    setError('');
    // 過去の時間を選択した場合のチェック
    const now = new Date();
    const selectedDate = new Date(date + 'T' + slot);
    if (selectedDate < now) {
      window.alert('過去の時間は選択できません。');
      return;
    }
    // 1回目クリック: 開始
    if (!selected.date || !selected.start) {
      setSelected({ date, start: slot, end: '' });
      onChange({ date, startTime: slot, endTime: '' });
      return;
    }
    // 2回目クリック: 同じ日付で開始より後ろの枠
    if (selected.date === date && timeSlots.indexOf(slot) > timeSlots.indexOf(selected.start)) {
      // 選択範囲に予約不可枠が含まれていないかチェック
      const range = timeSlots.slice(timeSlots.indexOf(selected.start), timeSlots.indexOf(slot) + 1);
      const hasUnavailable = range.some(s => !isSlotAvailable(date, s));
      if (hasUnavailable) {
        setError('選択範囲に予約不可の時間帯が含まれています');
        return;
      }
      // 最大利用時間チェック
      const startIndex = timeSlots.indexOf(selected.start);
      const endIndex = timeSlots.indexOf(slot);
      const duration = (endIndex - startIndex) * 30; // +1しない
      let maxDuration;
      if (facility.includes('会議室')) {
        maxDuration = 360; // 6時間
      } else if (facility.includes('個室')) {
        maxDuration = 180; // 3時間
      } else if (facility.includes('シャワールーム')) {
        maxDuration = 30; // 30分
      } else {
        maxDuration = 60; // デフォルト1時間
      }
      if (duration > maxDuration) {
        window.alert(`最大利用時間（${maxDuration / 60}時間）を超えています。`);
        setSelected({ date: '', start: '', end: '' });
        onChange({ date: '', startTime: '', endTime: '' });
        return;
      }
      setSelected({ date, start: selected.start, end: slot });
      onChange({ date, startTime: selected.start, endTime: slot });
      return;
    }
    // それ以外はリセットして新たに開始
    setSelected({ date, start: slot, end: '' });
    onChange({ date, startTime: slot, endTime: '' });
  };

  // 選択範囲のハイライト判定
  function isInSelectedRange(date, slot) {
    if (!selected.date || !selected.start || !selected.end) return false;
    if (selected.date !== date) return false;
    const startIdx = timeSlots.indexOf(selected.start);
    const endIdx = timeSlots.indexOf(selected.end);
    const idx = timeSlots.indexOf(slot);
    return idx >= startIdx && idx <= endIdx;
  }

  return (
    <div className="step-content">
      <div className="calendar-card-modern">
        <h2 style={{ textAlign: 'center', marginBottom: '1.2rem' }}>日時を選択してください</h2>
        <div className="calendar-legend">
          <span className="legend-available">○ 予約可</span>
          <span className="legend-unavailable">- 予約不可</span>
        </div>
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <div className="calendar-table-wrapper">
          <div className="calendar-week-nav">
            <button className="calendar-week-btn" onClick={() => setWeekOffset(weekOffset - 1)}>＜ 前の週</button>
            <span style={{ fontWeight: 'bold', color: '#26a69a', fontSize: '1.1rem' }}>
              {weekDates[0].slice(0, 4)}年{weekDates[0].slice(5, 7)}月
            </span>
            <button className="calendar-week-btn" onClick={() => setWeekOffset(weekOffset + 1)}>次の週 ＞</button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
          ) : (
          <table className="calendar-table-modern">
            <thead>
              <tr>
                <th></th>
                {weekDates.map(date => (
                  <th key={date}>{formatDateLabel(date)}<br /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot}>
                  <td>{slot}</td>
                  {weekDates.map(date => (
                    <td key={date + slot}>
                      {isSlotAvailable(date, slot) ? (
                        <button
                          className={`calendar-slot-btn-modern${selected.date === date && (selected.start === slot || isInSelectedRange(date, slot)) ? ' selected' : ''}`}
                          onClick={() => handleCellClick(date, slot)}
                        >○</button>
                      ) : (
                        <span className="calendar-slot-unavailable">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', width: '100%' }}>
          <button
            className="step-next-btn"
            style={{ width: '100%', maxWidth: 220, minWidth: 120, fontSize: '1rem', padding: '0.7em 0', margin: '0 auto', display: 'block' }}
            onClick={() => {
              console.log('facility:', facility, 'people:', people);
              if (!selected.date || !selected.start || !selected.end) {
                window.alert('開始時間と終了時間を選択してください');
                return;
              }
              // 人数制限チェック
              let maxPeople = 1;
              if (facility && facility.includes('会議室')) {
                maxPeople = 10;
              }
              if (selectedPeople > maxPeople) {
                window.alert(facility && facility.includes('会議室') ? '会議室は最大10人まで利用可能です。' : '個室・シャワールームは最大1人まで利用可能です。');
                return;
              }
              // 範囲内に予約不可枠が含まれていないか再チェック
              const range = timeSlots.slice(timeSlots.indexOf(selected.start), timeSlots.indexOf(selected.end) + 1);
              const hasUnavailable = range.some(s => !isSlotAvailable(selected.date, s));
              if (hasUnavailable) {
                window.alert('選択範囲に予約不可の時間帯が含まれています');
                return;
              }
              // 既存予約との重複チェック（同じユーザー・施設・日付で時間帯が重複していないか）
              const userId = auth.currentUser ? auth.currentUser.uid : null;
              const overlap = reservations.some(r =>
                r.room === facility &&
                r.date === selected.date &&
                r.userId === userId &&
                timeToMinutes(selected.start) < timeToMinutes(r.endTime) &&
                timeToMinutes(selected.end) > timeToMinutes(r.startTime)
              );
              if (overlap) {
                window.alert('既に同じ施設・日付・時間帯で予約があります。');
                return;
              }
              onChange({ date: selected.date, startTime: selected.start, endTime: selected.end });
              onNext();
            }}
          >
            次へ
          </button>
          <button className="step-prev-btn" style={{ width: '100%', maxWidth: 220, minWidth: 120, fontSize: '1rem', padding: '0.7em 0', margin: '0 auto', display: 'block' }} onClick={onPrev}>戻る</button>
        </div>
      </div>
    </div>
  );
}

export default DateStep; 