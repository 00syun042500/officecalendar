import React, { useState, useEffect } from 'react';
import FacilityStep from './FacilityStep';
import PeopleStep from './PeopleStep';
import DateStep from './DateStep';
import ConfirmStep from './ConfirmStep';
import CompleteStep from './CompleteStep';
import './ReservationForm.css';
import { collection, addDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

const steps = [
  { label: '施設選択' },
  { label: '人数選択' },
  { label: '日時選択' },
  { label: '確認' },
  { label: '完了' },
];

const STORAGE_KEY = 'reservationStepperState';

function ReservationStepper() {
  // localStorageから初期値を取得
  const getInitialState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          step: parsed.step || 0,
          facility: parsed.facility || '',
          people: parsed.people !== undefined ? parsed.people : 0,
          dateInfo: parsed.dateInfo || { date: '', startTime: '', endTime: '' },
        };
      } catch {
        // パース失敗時は初期値
        return { step: 0, facility: '', people: 0, dateInfo: { date: '', startTime: '', endTime: '' } };
      }
    }
    return { step: 0, facility: '', people: 0, dateInfo: { date: '', startTime: '', endTime: '' } };
  };

  const [step, setStep] = useState(getInitialState().step);
  const [facility, setFacility] = useState(getInitialState().facility);
  const [people, setPeople] = useState(getInitialState().people);
  const [dateInfo, setDateInfo] = useState(getInitialState().dateInfo);
  const [facilities, setFacilities] = useState([]);

  // 状態が変わるたびにlocalStorageに保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, facility, people, dateInfo }));
  }, [step, facility, people, dateInfo]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'facilities'), (snapshot) => {
      setFacilities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  // 施設選択バリデーション付きnext
  const handleFacilityNext = () => {
    if (!facility) {
      window.alert('施設を選択してください');
      return;
    }
    nextStep();
  };

  // 日時選択後、確認画面へ
  const handleDateNext = () => {
    if (!dateInfo.date || !dateInfo.startTime || !dateInfo.endTime) {
      window.alert('日時を選択してください');
      return;
    }
    nextStep();
  };

  // 予約確定時、完了画面へ
  const handleConfirmNext = async () => {
    try {
      // 施設一覧から選択中のfacilityIdに一致する施設名を取得
      const selectedFacilityObj = facilities.find(f => f.id === facility);
      const facilityName = selectedFacilityObj ? selectedFacilityObj.name : '';

      await addDoc(collection(db, 'reservations'), {
        facilityId: facility,
        room: facilityName,
        date: dateInfo.date,
        startTime: dateInfo.startTime,
        endTime: dateInfo.endTime,
        people: people,
        createdAt: new Date(),
        userId: auth.currentUser ? auth.currentUser.uid : null,
        userName: auth.currentUser
          ? auth.currentUser.displayName || auth.currentUser.email
          : '',
      });
      nextStep();
    } catch (e) {
      window.alert('予約の保存に失敗しました。時間をおいて再度お試しください。');
    }
  };

  // 完了画面からホームに戻る時にlocalStorageをリセットする関数
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep(0);
    setFacility('');
    setPeople(0);
    setDateInfo({ date: '', startTime: '', endTime: '' });
  };

  const handlePeopleNext = (newPeople) => {
    setPeople(newPeople);
    setTimeout(() => nextStep(), 0); // 強制的に次のレンダリングで進める
  };

  // ここでfacilityNameを定義
  const selectedFacilityObj = facilities.find(f => f.id === facility);
  const facilityName = selectedFacilityObj ? selectedFacilityObj.name : '';

  return (
    <div className="reservation-form-container">
      <div className="stepper-bar-modern">
        {steps.map((s, idx) => (
          <React.Fragment key={s.label}>
            <div className={`stepper-step-modern${step === idx ? ' active' : ''}${step > idx ? ' done' : ''}`}>
              <div className="stepper-circle">{idx + 1}</div>
              <div className="stepper-label">{s.label}</div>
            </div>
            {idx < steps.length - 1 && <div className="stepper-line-modern" />}
          </React.Fragment>
        ))}
      </div>
      <div className="stepper-content">
        {step === 0 && <FacilityStep value={facility} onChange={setFacility} onNext={handleFacilityNext} facilities={facilities} onReset={handleReset} />}
        {step === 1 && <PeopleStep
          value={people}
          onChange={setPeople}
          onNext={handlePeopleNext}
          onPrev={prevStep}
          facility={facilities.find(f => f.id === facility)}
          onReset={handleReset}
        />}
        {step === 2 && <DateStep value={dateInfo} onChange={setDateInfo} onPrev={prevStep} onNext={handleDateNext} facility={facilityName} people={people} />}
        {step === 3 && <ConfirmStep facility={facility} people={people} dateInfo={dateInfo} onPrev={prevStep} onNext={handleConfirmNext} facilities={facilities} />}
        {step === 4 && <CompleteStep facility={facility} people={people} dateInfo={dateInfo} onReset={handleReset} facilities={facilities} />}
      </div>
    </div>
  );
}

export default ReservationStepper;