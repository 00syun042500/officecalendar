import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const AdminReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFacility, setSearchFacility] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [appliedSearch, setAppliedSearch] = useState({ facility: '', user: '', date: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'reservations'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(data);
      setLoading(false);
    };
    fetchReservations();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('本当にこの予約を削除しますか？')) {
      await deleteDoc(doc(db, 'reservations', id));
      setReservations(reservations.filter(r => r.id !== id));
    }
  };

  // 検索・フィルタ処理
  const handleSearch = () => {
    // すべて空なら全件表示
    if (!searchFacility && !searchUser && !searchDate) {
      setAppliedSearch({ facility: '', user: '', date: '' });
      return;
    }
    // AND条件でフィルタ
    setAppliedSearch({ facility: searchFacility, user: searchUser, date: searchDate });
  };

  // フィルタ処理もAND条件に
  const filteredReservations = reservations.filter(r => {
    if (!appliedSearch.facility && !appliedSearch.user && !appliedSearch.date) return true;
    const facilityMatch = appliedSearch.facility
      ? (r.facilityName?.toLowerCase().includes(appliedSearch.facility.toLowerCase()) || r.room?.toLowerCase().includes(appliedSearch.facility.toLowerCase()))
      : true;
    const userMatch = appliedSearch.user
      ? (r.userName?.toLowerCase().includes(appliedSearch.user.toLowerCase()) || r.user?.toLowerCase().includes(appliedSearch.user.toLowerCase()))
      : true;
    const dateMatch = appliedSearch.date
      ? r.date === appliedSearch.date
      : true;
    return facilityMatch && userMatch && dateMatch;
  });

  // 並び替え処理
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;
    let aValue = a[key] || '';
    let bValue = b[key] || '';
    if (key === 'dateTime') {
      aValue = (a.date || '') + ' ' + (a.time || '');
      bValue = (b.date || '') + ' ' + (b.time || '');
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      return direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    }
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  // 入力欄変更時に即時appliedSearchも更新
  const handleFacilityChange = (e) => {
    setSearchFacility(e.target.value);
  };
  const handleUserChange = (e) => {
    setSearchUser(e.target.value);
  };
  const handleDateChange = (e) => {
    setSearchDate(e.target.value);
  };

  // 条件クリア
  const handleClearSearch = () => {
    setAppliedSearch({ facility: '', user: '', date: '' });
    setSearchFacility('');
    setSearchUser('');
    setSearchDate('');
  };

  if (loading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: "url('/bg-marble.jpg') center/cover no-repeat fixed",
        padding: 0,
      }}
    >
      <div className="reservation-list-card" style={{
        maxWidth: 700,
        margin: '60px auto',
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 18px rgba(38,166,154,0.10), 0 1.5px 8px rgba(0,0,0,0.04)',
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          fontSize: '2rem',
          color: '#26a69a',
          fontWeight: 'bold',
          letterSpacing: '0.04em'
        }}>予約管理</h2>
        <div style={{ width: '100%', marginBottom: 12, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="施設名で検索"
            value={searchFacility}
            onChange={handleFacilityChange}
            style={{ borderRadius: 6, border: '1px solid #ccc', padding: '10px', fontSize: 16, minWidth: 120 }}
          />
          <input
            type="text"
            placeholder="ユーザー名で検索"
            value={searchUser}
            onChange={handleUserChange}
            style={{ borderRadius: 6, border: '1px solid #ccc', padding: '10px', fontSize: 16, minWidth: 120 }}
          />
          <input
            type="date"
            value={searchDate}
            onChange={handleDateChange}
            style={{ borderRadius: 6, border: '1px solid #ccc', padding: '10px', fontSize: 16, minWidth: 120 }}
          />
        </div>
        <div style={{ width: '100%', marginBottom: 18, textAlign: 'center' }}>
          <button
            onClick={handleSearch}
            style={{
              background: '#26a69a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 28px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
              minWidth: 120
            }}
          >
            検索
          </button>
        </div>
        {/* おしゃれな検索条件バー */}
        {(appliedSearch.facility || appliedSearch.user || appliedSearch.date) && (
          <div style={{
            width: '100%',
            background: 'linear-gradient(90deg, #e0f7fa 60%, #b2dfdb 100%)',
            color: '#00897b',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 22,
            fontWeight: 'bold',
            fontSize: '1.08rem',
            boxShadow: '0 2px 10px rgba(38,166,154,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, marginRight: 6, color: '#009688', fontSize: '1.08em', letterSpacing: '0.01em' }}>
                <span style={{ marginRight: 4 }}>🔎</span>検索条件：
              </span>
              {appliedSearch.facility && (
                <span style={{
                  background: '#fff',
                  color: '#26a69a',
                  borderRadius: 8,
                  padding: '4px 12px',
                  marginRight: 4,
                  boxShadow: '0 1px 4px rgba(38,166,154,0.08)',
                  fontWeight: 500,
                  fontSize: '0.98em',
                  display: 'inline-block',
                  border: '1.5px solid #b2dfdb'
                }}>
                  施設名「{appliedSearch.facility}」
                </span>
              )}
              {appliedSearch.user && (
                <span style={{
                  background: '#fff',
                  color: '#26a69a',
                  borderRadius: 8,
                  padding: '4px 12px',
                  marginRight: 4,
                  boxShadow: '0 1px 4px rgba(38,166,154,0.08)',
                  fontWeight: 500,
                  fontSize: '0.98em',
                  display: 'inline-block',
                  border: '1.5px solid #b2dfdb'
                }}>
                  ユーザー名「{appliedSearch.user}」
                </span>
              )}
              {appliedSearch.date && (
                <span style={{
                  background: '#fff',
                  color: '#26a69a',
                  borderRadius: 8,
                  padding: '4px 12px',
                  marginRight: 4,
                  boxShadow: '0 1px 4px rgba(38,166,154,0.08)',
                  fontWeight: 500,
                  fontSize: '0.98em',
                  display: 'inline-block',
                  border: '1.5px solid #b2dfdb'
                }}>
                  日付「{appliedSearch.date}」
                </span>
              )}
            </div>
            <button
              onClick={handleClearSearch}
              style={{
                background: 'none',
                border: 'none',
                color: '#e57373',
                fontWeight: 'bold',
                fontSize: '1.08rem',
                cursor: 'pointer',
                padding: '6px 16px',
                borderRadius: 8,
                transition: 'background 0.18s',
                marginLeft: 8,
                boxShadow: '0 1px 4px rgba(38,166,154,0.07)'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#ffeaea'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
              aria-label="条件クリア"
            >
              × 条件クリア
            </button>
          </div>
        )}
        <div style={{ width: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(38,166,154,0.07)'
          }}>
            <thead>
              <tr style={{ background: '#26a69a', color: '#fff' }}>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem', cursor: 'pointer' }} onClick={() => handleSort('facilityName')}>
                  施設名 {getSortArrow('facilityName')}
                </th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem', cursor: 'pointer' }} onClick={() => handleSort('dateTime')}>
                  日時 {getSortArrow('dateTime')}
                </th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem', cursor: 'pointer' }} onClick={() => handleSort('people')}>
                  人数 {getSortArrow('people')}
                </th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem', cursor: 'pointer' }} onClick={() => handleSort('userName')}>
                  ユーザー名 {getSortArrow('userName')}
                </th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.08rem' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedReservations.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#e57373', padding: '2em 0', fontWeight: 'bold', fontSize: '1.1em' }}>
                    検索内容が見つかりませんでした
                  </td>
                </tr>
              ) : (
                sortedReservations.map((r) => (
                  <tr key={r.id} style={{ background: '#f8fafc', borderBottom: '1.5px solid #e0f2f1' }}>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>{r.facilityName || r.room || '-'}</td>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>{r.date} {r.time}</td>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>{r.people || '-'}</td>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>{r.userName || r.user || '-'}</td>
                    <td style={{ padding: '0.7em 0.5em', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(r.id)}
                        style={{
                          background: '#e57373',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.6em 1.2em',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
                          transition: 'background 0.18s'
                        }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          style={{
            marginTop: 32,
            background: '#607D8B',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 28px',
            fontWeight: 'bold',
            fontSize: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            cursor: 'pointer'
          }}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
};

export default AdminReservationList; 