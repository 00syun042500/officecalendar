import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addReservation } from '../utils/firestoreUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ReservationConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { room, date, time, startTime, endTime } = location.state || {};
  console.log('フォームから渡す値: ' + JSON.stringify({
    room, date, startTime, endTime, time: `${startTime}～${endTime}`
  }));
  console.log('確認画面で受け取った値: ' + JSON.stringify({ room, date, startTime, endTime, time }));
  console.log('Firestoreに保存する値: ' + JSON.stringify({ room, date, time, startTime, endTime }));
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleConfirm = async () => {
    // 入力値の検証
    if (!room || !date || !time) {
      toast.error('予約情報が正しくありません。', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Firestoreに保存する値をデバッグ出力
      console.log('Firestoreに保存する値: ' + JSON.stringify({ room, date, time, startTime, endTime }));
      await addReservation({
        room: room || '',
        date: date || '',
        time: time || '',
        startTime: startTime || '',
        endTime: endTime || ''
      });

      // 成功通知を表示してから遷移
      toast.success('✅ 予約が完了しました！', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: () => {
          navigate('/reservation-success');
        }
      });

    } catch (error) {
      console.error('❌ 予約エラー:', error);
      toast.error('予約に失敗しました。もう一度お試しください。', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="confirm-container">
      <h2>以下の内容で予約しますか？</h2>
      <ul>
        <li><strong>部屋:</strong> {room}</li>
        <li><strong>日付:</strong> {date}</li>
        <li><strong>時間:</strong> {time}</li>
      </ul>
      <div className="button-container">
        <button 
          onClick={handleBack}
          className="back-button"
          disabled={isLoading}
        >
          戻る
        </button>
        <button 
          onClick={handleConfirm}
          className="confirm-button"
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : '予約を確定する'}
        </button>
      </div>
    </div>
  );
}

export default ReservationConfirm;
