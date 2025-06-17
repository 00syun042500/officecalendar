import React from 'react';

function PeopleStep({ value, onChange, onNext, onPrev, facility, onReset }) {
  // facility: 施設オブジェクト（{ id, name, capacity, ... }）

  // capacityを必ず数値型に変換
  const rawCapacity = facility && facility.capacity;
  const maxPeople = Number(rawCapacity) > 0 ? Number(rawCapacity) : null;

  const handleNext = () => {
    if (!maxPeople) {
      window.alert('この施設の最大利用人数が管理者によって設定されていません。管理者にご連絡ください。');
      return;
    }
    if (value > maxPeople) {
      window.alert(`この施設の最大利用人数は${maxPeople}人です。${maxPeople}人以下を入力してください。`);
      return;
    }
    if (value < 1) {
      window.alert('1人以上を入力してください。');
      return;
    }
    onNext(value);
  };

  return (
    <div className="step-content">
      <div className="people-card-modern">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>人数を入力してください</h2>
        <input
          type="number"
          min={0}
          value={value === undefined || value === null ? 0 : value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="people-input-modern"
          style={{ fontSize: '1.2rem', padding: '8px 16px', borderRadius: 8, border: '1.5px solid #26a69a', width: 120, textAlign: 'center', marginBottom: 24 }}
        />
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.2rem', justifyContent: 'center', width: '100%' }}>
          <button className="step-prev-btn" onClick={() => { if (onReset) onReset(); onPrev(); }}>戻る</button>
          <button className="step-next-btn" onClick={handleNext}>次へ</button>
        </div>
      </div>
    </div>
  );
}

export default PeopleStep; 