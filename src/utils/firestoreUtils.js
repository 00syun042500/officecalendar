import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

// 予約を追加する関数
export async function addReservation({ room, date, time, startTime, endTime }) {
  try {
    const reservationData = { room, date, time, startTime, endTime, userId: auth.currentUser.uid };
    const docRef = await addDoc(collection(db, 'reservations'), reservationData);
    return docRef.id;
  } catch (error) {
    console.error('予約エラー:', error);
    throw error; // エラーをスローして、呼び出し元でハンドリングできるようにする
  }
}

// 予約一覧を取得する関数
export const getReservations = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'reservations'));
    const reservations = [];
    querySnapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() });
    });
    return reservations;
  } catch (error) {
    console.error('予約データの取得中にエラーが発生しました:', error);
    throw error;
  }
};

const fetchReservations = async () => {
  const querySnapshot = await getDocs(collection(db, "reservations"));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
};

export async function deleteReservation(id) {
  await deleteDoc(doc(db, 'reservations', id));
}

const handleCancel = async (id) => {
  if (window.confirm('本当にキャンセルしますか？')) {
    await deleteReservation(id);
    // 予約一覧を再取得 or 状態を更新
  }
};
