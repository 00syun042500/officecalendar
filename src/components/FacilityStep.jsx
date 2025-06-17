import React from 'react';
import { useNavigate } from 'react-router-dom';

const facilityList = [
  { name: '会議室A', image: '/roomA.webp', category: '会議室', description: '最大8名まで利用可能。プロジェクター完備。' },
  { name: '会議室B', image: '/roomB.webp', category: '会議室', description: '少人数向けの静かな会議室。ホワイトボードあり。' },
  { name: '会議室C', image: '/roomC.jpg', category: '会議室', description: '広々とした空間でセミナーにも最適。' },
  { name: 'シャワールームA', image: '/showerA.png', category: 'シャワールーム', description: '清潔な個室シャワー。タオル付き。' },
  { name: 'シャワールームB', image: '/showerB.png', category: 'シャワールーム', description: 'リラックスできる空間。アメニティ充実。' },
  { name: 'シャワールームC', image: '/showerC.png', category: 'シャワールーム', description: '短時間利用におすすめ。' },
  { name: '個室A', image: '/privateA.png', category: '個室', description: '集中作業に最適な静かな個室。' },
  { name: '個室B', image: '/privateB.png', category: '個室', description: 'オンライン会議にも使える防音個室。' },
  { name: '個室C', image: '/privateC.png', category: '個室', description: 'ゆったりとしたスペースで快適。' },
];

const categories = ['会議室', '個室', 'シャワールーム'];

function FacilityStep({ value, onChange, onNext, facilities, onReset }) {
  const navigate = useNavigate();
  return (
    <div className="step-content">
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>施設を選択してください</h2>
      {categories.map(category => {
        // カテゴリごとにA→B→C順でソート
        const sortedFacilities = facilities
          .filter(f => f.category === category)
          .sort((a, b) => {
            // 末尾のアルファベット（A/B/C）で比較
            const matchA = a.name && a.name.match(/[A-Za-zＡ-Ｚａ-ｚ]$/);
            const matchB = b.name && b.name.match(/[A-Za-zＡ-Ｚａ-ｚ]$/);
            if (matchA && matchB) {
              return matchA[0].localeCompare(matchB[0], 'ja');
            }
            // それ以外は名前順
            return (a.name || '').localeCompare(b.name || '', 'ja');
          });

        return (
          <div key={category} className="facility-category-block">
            <div className="facility-category-title">{category}</div>
            <div className="facility-list-grid">
              {sortedFacilities.map(facility => (
                <div
                  key={facility.id}
                  className={`facility-card-modern${value === facility.id ? ' selected' : ''}`}
                  onClick={() => facility.isActive !== false && onChange(facility.id)}
                  style={{
                    opacity: facility.isActive === false ? 0.5 : 1,
                    pointerEvents: facility.isActive === false ? 'none' : 'auto'
                  }}
                >
                  <img src={facility.image || '/noimage.png'} alt={facility.name} className="facility-image-modern" />
                  <div className="facility-name-modern">{facility.name}</div>
                  <div className="facility-desc-modern">
                    {facility.isActive === false ? (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>現在利用できません</span>
                    ) : (
                      facility.description || '説明なし'
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <button
        className="step-next-btn"
        onClick={onNext}
        style={{ marginTop: '2.5rem', width: '100%', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto', display: 'block' }}
      >
        次へ
      </button>
      <button
        className="home-btn"
        onClick={() => {
          if (onReset) onReset();
          navigate('/home');
        }}
        style={{ margin: '1.2rem auto 0 auto', width: '100%', maxWidth: '320px', display: 'block', background: '#607D8B', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.9rem 0', fontSize: '1.05rem', fontWeight: 'bold', letterSpacing: '0.05em', cursor: 'pointer' }}
      >
        ホームに戻る
      </button>
    </div>
  );
}

export default FacilityStep; 