import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import NotificationBell from './NotificationBell';

const FACILITY_CATEGORIES = [
  '会議室',
  '個室',
  'シャワールーム'
];

const CATEGORY_ORDER = ['会議室', '個室', 'シャワールーム'];

const AdminFacilityList = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    capacity: '',
    businessHours: {
      start: '09:00',
      end: '18:00'
    },
    equipment: [],
    maintenanceSchedule: [],
    maxAdvanceDays: 30
  });
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedFacilityStats, setSelectedFacilityStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    totalReservations: 0,
    averageDuration: 0,
    peakHours: [],
    usageByDay: {},
    usageByMonth: {}
  });
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedFacilityCalendar, setSelectedFacilityCalendar] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateReservations, setSelectedDateReservations] = useState([]);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleCsvData, setSampleCsvData] = useState([]);
  const [sampleCsvHeader, setSampleCsvHeader] = useState([]);
  const navigate = useNavigate();
  const [addFormError, setAddFormError] = useState('');
  const [addFormSuccess, setAddFormSuccess] = useState('');
  const [selectedDateMaintenances, setSelectedDateMaintenances] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'facilities'), (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFacilities(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reservations'), (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
      setUnreadCount(data.filter(n => n.read === false).length);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddFormError('');
    setAddFormSuccess('');
    if (!name) {
      setAddFormError('施設名は必須です');
      return;
    }
    if (!editForm.category) {
      setAddFormError('カテゴリーを選択してください');
      return;
    }
    if (editForm.capacity !== '' && (isNaN(editForm.capacity) || Number(editForm.capacity) <= 0)) {
      setAddFormError('定員は1以上の数字で入力してください');
      return;
    }
    try {
    const docRef = await addDoc(collection(db, 'facilities'), {
      name,
      description,
        category: editForm.category,
        capacity: parseInt(editForm.capacity) || 0,
        businessHours: editForm.businessHours,
        equipment: editForm.equipment,
        maintenanceSchedule: editForm.maintenanceSchedule,
        maxAdvanceDays: parseInt(editForm.maxAdvanceDays) || 30,
        isActive: true
      });
      setFacilities([...facilities, { 
        id: docRef.id, 
        name, 
        description, 
        category: editForm.category,
        capacity: parseInt(editForm.capacity) || 0,
        businessHours: editForm.businessHours,
        equipment: editForm.equipment,
        maintenanceSchedule: editForm.maintenanceSchedule,
        maxAdvanceDays: parseInt(editForm.maxAdvanceDays) || 30,
        isActive: true 
      }]);
    setName('');
    setDescription('');
      setEditForm({
        name: '',
        description: '',
        category: '',
        capacity: '',
        businessHours: {
          start: '09:00',
          end: '18:00'
        },
        equipment: [],
        maintenanceSchedule: [],
        maxAdvanceDays: 30
      });
      setAddFormSuccess('施設を追加しました');
    } catch (err) {
      setAddFormError('追加に失敗しました: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当にこの施設を削除しますか？')) {
      await deleteDoc(doc(db, 'facilities', id));
    }
  };

  // 利用可否スイッチ
  const handleToggleActive = async (id, current) => {
    const facility = facilities.find(f => f.id === id);
    const nextStatus = !current;
    const confirmMsg = nextStatus
      ? `「${facility.name}」を稼働中にしますか？`
      : `「${facility.name}」を停止中にしますか？`;
    if (!window.confirm(confirmMsg)) return;
    const facilityRef = doc(db, 'facilities', id);
    await updateDoc(facilityRef, { isActive: nextStatus });

    // Firestoreに通知を追加
    await addDoc(collection(db, 'notifications'), {
      title: `「${facility.name}」が${nextStatus ? '稼働中' : '稼働停止'}になりました`,
      body: `管理者によって${facility.name}の稼働状態が${nextStatus ? '稼働中' : '停止中'}に変更されました。`,
      createdAt: serverTimestamp(),
      read: false,
      type: 'facility_status',
      deletedUsers: [] // 追加
    });

    alert(`「${facility.name}」を${nextStatus ? '稼働中' : '停止中'}に変更しました。`);
  };

  // 検索・フィルタ処理
  const filteredFacilities = facilities.filter(f => {
    const nameMatch = f.name?.toLowerCase().includes(searchName.toLowerCase());
    const descMatch = f.description?.toLowerCase().includes(searchDescription.toLowerCase());
    return nameMatch && descMatch;
  });

  // 並び替え処理
  const sortedFacilities = [...filteredFacilities].sort((a, b) => {
    // カテゴリ順
    const catA = CATEGORY_ORDER.indexOf(a.category);
    const catB = CATEGORY_ORDER.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    // 施設名のローマ字A→B→C順（末尾のA/B/Cを比較）
    const matchA = a.name && a.name.match(/[A-Za-z]$/);
    const matchB = b.name && b.name.match(/[A-Za-z]$/);
    if (matchA && matchB) {
      return matchA[0].localeCompare(matchB[0]);
    }
    // それ以外は名前順
    return (a.name || '').localeCompare(b.name || '');
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

  const handleEdit = async (facility) => {
    setSelectedFacility(facility);
    setEditForm({
      name: facility.name,
      description: facility.description || '',
      category: facility.category || '',
      capacity: facility.capacity || '',
      businessHours: facility.businessHours || { start: '09:00', end: '18:00' },
      equipment: facility.equipment || [],
      maintenanceSchedule: facility.maintenanceSchedule || [],
      maxAdvanceDays: facility.maxAdvanceDays || 30
    });
    setShowDetailModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFacility) return;
    const facilityRef = doc(db, 'facilities', selectedFacility.id);
    await updateDoc(facilityRef, editForm);
    setFacilities(facilities.map(f => 
      f.id === selectedFacility.id ? { ...f, ...editForm } : f
    ));
    setShowDetailModal(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddEquipment = () => {
    setEditForm(prev => ({
      ...prev,
      equipment: [...prev.equipment, { name: '', quantity: 1 }]
    }));
  };

  const handleRemoveEquipment = (index) => {
    setEditForm(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  const handleEquipmentChange = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      equipment: prev.equipment.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAddMaintenance = () => {
    setEditForm(prev => ({
      ...prev,
      maintenanceSchedule: [...prev.maintenanceSchedule, { 
        startDate: '', 
        endDate: '', 
        description: '' 
      }]
    }));
  };

  const handleRemoveMaintenance = (index) => {
    setEditForm(prev => ({
      ...prev,
      maintenanceSchedule: prev.maintenanceSchedule.filter((_, i) => i !== index)
    }));
  };

  const handleMaintenanceChange = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      maintenanceSchedule: prev.maintenanceSchedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateStats = (facilityId) => {
    const facilityReservations = reservations.filter(r => r.facilityId === facilityId);
    const totalReservations = facilityReservations.length;
    
    const totalDuration = facilityReservations.reduce((acc, curr) => {
      const start = new Date(`${curr.date}T${curr.startTime}`);
      const end = new Date(`${curr.date}T${curr.endTime}`);
      return acc + (end - start) / (1000 * 60 * 60);
    }, 0);
    const averageDuration = totalReservations > 0 ? totalDuration / totalReservations : 0;

    const hourCounts = {};
    facilityReservations.forEach(reservation => {
      const hour = new Date(`${reservation.date}T${reservation.startTime}`).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: `${hour}時`, count }));

    const usageByDay = {};
    facilityReservations.forEach(reservation => {
      const day = new Date(`${reservation.date}T${reservation.startTime}`).getDay();
      usageByDay[day] = (usageByDay[day] || 0) + 1;
    });

    const usageByMonth = {};
    facilityReservations.forEach(reservation => {
      const month = new Date(`${reservation.date}T${reservation.startTime}`).getMonth();
      usageByMonth[month] = (usageByMonth[month] || 0) + 1;
    });

    setStats({
      totalReservations,
      averageDuration,
      peakHours,
      usageByDay,
      usageByMonth
    });
  };

  const handleShowStats = (facility) => {
    setSelectedFacilityStats(facility);
    calculateStats(facility.id);
    setShowStatsModal(true);
  };

  // カレンダー表示用の関数
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    // 前月の日付を追加
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    // 当月の日付を追加
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // 日付の予約を取得
  const getReservationsForDate = (date) => {
    if (!date) return [];
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    return reservations.filter(reservation => {
      // 日付と時間を組み合わせて比較
      const reservationDate = new Date(`${reservation.date}T${reservation.startTime}`);
      return reservationDate >= startOfDay && reservationDate <= endOfDay;
    });
  };

  // 日付の予約＋メンテナンスを取得
  const getReservationsAndMaintenanceForDate = (facility, date) => {
    if (!date) return { reservations: [], maintenances: [] };
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    // 予約
    const reservationsForDate = reservations.filter(reservation => {
      if (!reservation.facilityId || reservation.facilityId !== facility.id) return false;
      const reservationDate = new Date(`${reservation.date}T${reservation.startTime}`);
      return reservationDate >= startOfDay && reservationDate <= endOfDay;
    });

    // メンテナンス
    const maintenancesForDate = (facility.maintenanceSchedule || []).filter(m => {
      if (!m.startDate || !m.endDate) return false;
      const start = new Date(m.startDate);
      const end = new Date(m.endDate);
      return startOfDay <= end && endOfDay >= start;
    });

    return { reservations: reservationsForDate, maintenances: maintenancesForDate };
  };

  // カレンダーモーダルの表示
  const handleShowCalendar = (facility) => {
    setSelectedFacilityCalendar(facility);
    setShowCalendarModal(true);
  };

  // 月の移動
  const handleMonthChange = (increment) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  // 日付選択
  const handleDateSelect = (date) => {
    if (!date) return;
    setSelectedDate(date);
    if (selectedFacilityCalendar) {
      const { reservations, maintenances } = getReservationsAndMaintenanceForDate(selectedFacilityCalendar, date);
      setSelectedDateReservations(reservations);
      setSelectedDateMaintenances(maintenances);
    }
  };

  // CSVエクスポート用関数
  const exportFacilitiesToCSV = (facilities) => {
    if (!facilities || facilities.length === 0) {
      alert('エクスポートする施設データがありません');
      return;
    }
    // CSVヘッダー
    const headers = ['名前', '説明', 'カテゴリ', '定員', '設備', '稼働状態'];
    // CSVデータ生成（sortedFacilitiesの順・表記統一）
    const rows = sortedFacilities.map(f => [
      f.name || '',
      f.description || '',
      f.category || '',
      (f.capacity !== undefined && f.capacity !== null && f.capacity !== '') ? `${f.capacity}人` : '',
      f.equipment && f.equipment.length > 0 ? f.equipment.map(eq => eq.name).join(';') : '',
      f.isActive ? '稼働中' : '停止中'
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    // ダウンロード処理
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'facilities.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        let successCount = 0;
        let failCount = 0;
        let errorDetails = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            // 必須項目チェック
            if (!row['名前'] || !row['カテゴリ']) {
              failCount++;
              errorDetails.push(`行${i + 2}: 名前またはカテゴリが未入力です。`);
              continue;
            }
            // 定員チェック
            if (row['定員'] && isNaN(parseInt(row['定員']))) {
              failCount++;
              errorDetails.push(`行${i + 2}: 定員が数値ではありません。`);
              continue;
            }
            // 利用可能時間チェック
            if (row['利用可能時間'] && !/^\d{2}:\d{2}~\d{2}:\d{2}$/.test(row['利用可能時間'])) {
              failCount++;
              errorDetails.push(`行${i + 2}: 利用可能時間の形式が不正です（例: 09:00~18:00）。`);
              continue;
            }
            // Firestoreに追加（既存施設名があれば更新、なければ新規追加）
            const q = query(collection(db, 'facilities'), where('name', '==', row['名前']));
            const snapshot = await getDocs(q);
            const facilityData = {
              name: row['名前'],
              description: row['説明'] || '',
              category: row['カテゴリ'] || '',
              capacity: parseInt(row['定員']) || 0,
              businessHours: row['利用可能時間'] ? {
                start: row['利用可能時間'].split('~')[0] || '09:00',
                end: row['利用可能時間'].split('~')[1] || '18:00'
              } : { start: '09:00', end: '18:00' },
              equipment: row['設備'] ? row['設備'].split(';').map(name => ({ name: name.trim(), quantity: 1 })) : [],
              isActive: row['稼働状態'] === '稼働中',
              maintenanceSchedule: [],
              maxAdvanceDays: 30
            };
            if (!snapshot.empty) {
              // 既存施設を更新
              await updateDoc(doc(db, 'facilities', snapshot.docs[0].id), facilityData);
            } else {
              // 新規追加
              await addDoc(collection(db, 'facilities'), facilityData);
            }
            successCount++;
          } catch (err) {
            failCount++;
            errorDetails.push(`行${i + 2}: Firestoreエラー - ${err.message}`);
          }
        }
        let message = `インポート完了: ${successCount}件成功, ${failCount}件失敗`;
        if (errorDetails.length > 0) {
          message += '\n\n【エラー詳細】\n' + errorDetails.join('\n');
        }
        alert(message);
      },
      error: (err) => {
        alert('CSVの読み込みに失敗しました: ' + err.message);
      }
    });
  };

  // サンプルCSVプレビュー取得（facilitiesから動的生成）
  const handleShowSampleCsv = () => {
    if (!sortedFacilities || sortedFacilities.length === 0) {
      alert('施設データがありません');
      return;
    }
    // CSVヘッダー
    const header = ['名前', '説明', 'カテゴリ', '定員', '設備', '稼働状態'];
    // CSVデータ
    const data = sortedFacilities.map(f => ({
      '名前': f.name || '',
      '説明': f.description || '',
      'カテゴリ': f.category || '',
      '定員': (f.capacity !== undefined && f.capacity !== null && f.capacity !== '') ? `${f.capacity}人` : '',
      '設備': f.equipment && f.equipment.length > 0 ? f.equipment.map(eq => eq.name).join(';') : '',
      '稼働状態': f.isActive ? '稼働中' : '停止中'
    }));
    setSampleCsvHeader(header);
    setSampleCsvData(data);
    setShowSampleModal(true);
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
      <div style={{
        maxWidth: 1200,
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
        }}>施設管理</h2>

        {/* CSVエクスポート・インポートボタン */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
          <button
            onClick={() => exportFacilitiesToCSV(facilities)}
            style={{
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              width: 180,
              height: 44,
              fontWeight: 'bold',
              fontSize: '1.08rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(25,118,210,0.10)',
              transition: 'background 0.18s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '0.04em',
              textAlign: 'center',
              lineHeight: 1,
              marginTop: '-9px'
            }}
          >
            CSVエクスポート
          </button>
          <label
            style={{
              background: '#43a047',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              width: 180,
              height: 44,
              fontWeight: 'bold',
              fontSize: '1.08rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(67,160,71,0.10)',
              transition: 'background 0.18s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: 1
            }}
          >
            CSVインポート
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ textAlign: 'center', color: '#888', fontSize: 14, marginBottom: 8 }}>
          施設データをCSV形式でエクスポート・インポートできます。<br />
          <a href="/sample/facilities_sample.csv" download style={{ color: '#1976d2', textDecoration: 'underline', marginRight: 16 }}>サンプルCSVをダウンロード</a>
          <button type="button" onClick={handleShowSampleCsv} style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0 }}>サンプルCSVをプレビュー</button>
        </div>

        {/* カテゴリーフィルター（検索・フィルタ欄） */}
        {/* 削除済み */}

        <hr style={{ width: '100%', margin: '24px 0', border: 'none', borderTop: '1.5px solid #e0f2f1' }} />

        {/* 施設追加フォーム */}
        <form onSubmit={handleAdd} style={{ width: '100%', marginBottom: 32, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="施設名"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ borderRadius: 8, border: '1.5px solid #b2dfdb', padding: '12px', fontSize: 16, minWidth: 140, background: '#fafdff', height: 44 }}
            required
          />
          <input
            type="text"
            placeholder="説明（任意）"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ borderRadius: 8, border: '1.5px solid #b2dfdb', padding: '12px', fontSize: 16, minWidth: 200, background: '#fafdff', height: 44 }}
          />
          <select
            value={editForm.category}
            onChange={handleEditChange}
            name="category"
            style={{ borderRadius: 8, border: '1.5px solid #b2dfdb', padding: '12px', fontSize: 16, minWidth: 140, background: '#fafdff', height: 44 }}
            required
          >
            <option value="">カテゴリーを選択</option>
            {FACILITY_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button
            type="submit"
            style={{
              background: '#26a69a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 32px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
              minWidth: 140,
              height: 44
            }}
          >
            追加
          </button>
        </form>
        {(addFormError || addFormSuccess) && (
          <div style={{ width: '100%', textAlign: 'center', marginBottom: 16 }}>
            {addFormError && <span style={{ color: '#e57373', fontWeight: 'bold', fontSize: 15 }}>{addFormError}</span>}
            {addFormSuccess && <span style={{ color: '#43a047', fontWeight: 'bold', fontSize: 15 }}>{addFormSuccess}</span>}
          </div>
        )}

        {/* 検索・フィルタ欄 */}
        <div style={{ width: '100%', marginBottom: 18, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="施設名で検索"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ borderRadius: 8, border: '1px solid #ccc', padding: '10px', fontSize: 16, minWidth: 120 }}
          />
          <input
            type="text"
            placeholder="説明で検索"
            value={searchDescription}
            onChange={e => setSearchDescription(e.target.value)}
            style={{ borderRadius: 8, border: '1px solid #ccc', padding: '10px', fontSize: 16, minWidth: 180 }}
          />
        </div>

        {/* 施設一覧テーブル */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            minWidth: 800,
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(38,166,154,0.07)',
            fontSize: '1.05rem',
            letterSpacing: '0.01em',
            background: '#fafdff'
          }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #26a69a 60%, #b2dfdb 100%)', color: '#fff' }}>
                <th style={{ padding: '1.1em 0.7em', fontWeight: 'bold', fontSize: '1.12rem', letterSpacing: '0.04em' }}>順番</th>
                <th style={{ padding: '1.1em 0.7em', fontWeight: 'bold', fontSize: '1.12rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  施設名 {getSortArrow('name')}
                </th>
                <th style={{ padding: '1.1em 0.7em', fontWeight: 'bold', fontSize: '1.12rem', cursor: 'pointer' }} onClick={() => handleSort('category')}>
                  カテゴリー {getSortArrow('category')}
                </th>
                <th style={{ padding: '1.1em 0.7em', fontWeight: 'bold', fontSize: '1.12rem', cursor: 'pointer' }} onClick={() => handleSort('capacity')}>
                  定員 {getSortArrow('capacity')}
                </th>
                <th style={{ padding: '1.1em 0.7em', fontWeight: 'bold', fontSize: '1.12rem' }}>利用可否</th>
                <th style={{ padding: '1.1em 0.7em', fontWeight: 'bold', fontSize: '1.12rem' }}>統計</th>
                <th style={{ padding: '1.1em 0.7em', fontWeight: 'bold', fontSize: '1.12rem' }}>カレンダー</th>
                <th style={{ padding: '1.1em 0.7em', fontWeight: 'bold', fontSize: '1.12rem' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedFacilities.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#888', padding: '2em 0' }}>施設がありません</td>
                </tr>
              ) : (
                sortedFacilities.map((f, idx) => (
                  <tr key={f.id} style={{ background: f.isActive === false ? '#ffeaea' : idx % 2 === 0 ? '#f8fafc' : '#e0f7fa', borderBottom: '1.5px solid #e0f2f1', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1em 0.7em', textAlign: 'center', fontWeight: 'bold', color: '#26a69a', fontSize: '1.08rem' }}>{idx + 1}</td>
                    <td style={{ padding: '1em 0.7em', textAlign: 'center', fontWeight: 'bold', color: '#222', fontSize: '1.08rem' }}>{f.name}</td>
                    <td style={{ padding: '1em 0.7em', textAlign: 'center' }}>{f.category || '-'}</td>
                    <td style={{ padding: '1em 0.7em', textAlign: 'center' }}>{f.capacity !== undefined && f.capacity !== null && f.capacity !== '' ? `${f.capacity}人` : '-'}</td>
                    <td style={{ padding: '1em 0.7em', textAlign: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <input
                          type="checkbox"
                          checked={f.isActive !== false}
                          onChange={() => handleToggleActive(f.id, f.isActive !== false)}
                          style={{ width: 24, height: 24, accentColor: f.isActive === false ? '#e57373' : '#26a69a', cursor: 'pointer' }}
                        />
                        <span style={{
                          fontWeight: 'bold',
                          color: f.isActive === false ? '#e57373' : '#26a69a',
                          fontSize: '1.1rem',
                          letterSpacing: '0.04em',
                          padding: '2px 10px',
                          borderRadius: 8,
                          background: f.isActive === false ? '#ffebee' : '#e0f2f1',
                          border: f.isActive === false ? '1.5px solid #e57373' : '1.5px solid #26a69a',
                          transition: 'all 0.2s'
                        }}>
                          {f.isActive === false ? '停止中' : '稼働中'}
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '1em 0.7em', textAlign: 'center' }}>
                      <button
                        onClick={() => handleShowStats(f)}
                        style={{
                          background: '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.7em 1.4em',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
                          transition: 'background 0.18s',
                          minWidth: 80
                        }}
                      >
                        統計
                      </button>
                    </td>
                    <td style={{ padding: '1em 0.7em', textAlign: 'center' }}>
                      <button
                        onClick={() => handleShowCalendar(f)}
                        style={{
                          background: '#2196F3',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.7em 1.4em',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
                          transition: 'background 0.18s',
                          minWidth: 80
                        }}
                      >
                        カレンダー
                      </button>
                    </td>
                    <td style={{ padding: '1em 0.7em', textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(f)}
                        style={{
                          background: '#FFD600',
                          color: '#333',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.7em 1.4em',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
                          transition: 'background 0.18s',
                          minWidth: 80
                        }}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        style={{
                          background: '#e57373',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.7em 1.4em',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
                          transition: 'background 0.18s',
                          minWidth: 80
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

        {/* ホームに戻るボタン */}
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
            cursor: 'pointer',
            width: '100%',
            maxWidth: 320,
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'block'
          }}
        >
          ホームに戻る
        </button>

        {/* 詳細編集モーダル */}
        {showDetailModal && selectedFacility && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              width: '90%',
              maxWidth: 800,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: 24 }}>施設の詳細設定</h3>
              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>施設名</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>カテゴリー</label>
                    <select
                      name="category"
                      value={editForm.category}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                      required
                    >
                      <option value="">選択してください</option>
                      {FACILITY_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>定員数</label>
                    <input
                      type="number"
                      name="capacity"
                      value={editForm.capacity}
                      onChange={handleEditChange}
                      style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                      min="0"
                    />
                  </div>
                </div>

                {/* 設備・備品管理 */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>設備・備品</h4>
                    <button
                      type="button"
                      onClick={handleAddEquipment}
                      style={{
                        background: '#26a69a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 0',
                        width: 90,
                        minWidth: 0,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      追加
                    </button>
                  </div>
                  {editForm.equipment.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleEquipmentChange(index, 'name', e.target.value)}
                        placeholder="設備・備品名"
                        style={{ flex: 2, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem' }}
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleEquipmentChange(index, 'quantity', parseInt(e.target.value))}
                        placeholder="数量"
                        min="1"
                        style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem', maxWidth: 80 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(index)}
                        style={{
                          background: '#e57373',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '8px 0',
                          width: 90,
                          minWidth: 0,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>

                {/* メンテナンス予定 */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>メンテナンス・清掃予定</h4>
                    <button
                      type="button"
                      onClick={handleAddMaintenance}
                      style={{
                        background: '#26a69a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 0',
                        width: 90,
                        minWidth: 0,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      追加
                    </button>
                  </div>
                  {editForm.maintenanceSchedule.map((schedule, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input
                        type="date"
                        value={schedule.startDate}
                        onChange={(e) => handleMaintenanceChange(index, 'startDate', e.target.value)}
                        style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem', minWidth: 120 }}
                      />
                      <input
                        type="date"
                        value={schedule.endDate}
                        onChange={(e) => handleMaintenanceChange(index, 'endDate', e.target.value)}
                        style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem', minWidth: 120 }}
                      />
                      <input
                        type="text"
                        value={schedule.description}
                        onChange={(e) => handleMaintenanceChange(index, 'description', e.target.value)}
                        placeholder="内容（例：エアコン清掃）"
                        style={{ flex: 2, padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMaintenance(index)}
                        style={{
                          background: '#e57373',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '8px 0',
                          width: 90,
                          minWidth: 0,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    style={{
                      background: '#607D8B',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '12px 24px',
                      cursor: 'pointer'
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#26a69a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '12px 24px',
                      cursor: 'pointer'
                    }}
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 統計モーダル */}
        {showStatsModal && selectedFacilityStats && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              width: '90%',
              maxWidth: 1200,
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: 24 }}>
                {selectedFacilityStats.name}の利用統計
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #26a69a 0%, #1a8c82 100%)', 
                  padding: 24, 
                  borderRadius: 12,
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(38,166,154,0.2)'
                }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: 12, fontSize: '1.1rem' }}>総予約数</h4>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                    {stats.totalReservations}
                    <span style={{ fontSize: '1.2rem', marginLeft: 8 }}>件</span>
                  </p>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', 
                  padding: 24, 
                  borderRadius: 12,
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(33,150,243,0.2)'
                }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: 12, fontSize: '1.1rem' }}>平均利用時間</h4>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>
                    {stats.averageDuration.toFixed(1)}
                    <span style={{ fontSize: '1.2rem', marginLeft: 8 }}>時間</span>
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: 16, fontSize: '1.2rem', color: '#333' }}>ピーク時間帯</h4>
                <div style={{ display: 'flex', gap: 16 }}>
                  {stats.peakHours.map((peak, index) => (
                    <div key={index} style={{ 
                      background: '#fff',
                      padding: 20,
                      borderRadius: 12,
                      flex: 1,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #e0e0e0'
                    }}>
                      <p style={{ 
                        fontWeight: 'bold', 
                        color: '#26a69a',
                        fontSize: '1.1rem',
                        marginBottom: 8
                      }}>
                        {peak.hour}
                      </p>
                      <div style={{
                        height: 4,
                        background: '#e0e0e0',
                        borderRadius: 2,
                        marginBottom: 8,
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${(peak.count / Math.max(...stats.peakHours.map(p => p.count))) * 100}%`,
                          background: '#26a69a',
                          borderRadius: 2
                        }} />
                      </div>
                      <p style={{ 
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        color: '#333',
                        margin: 0
                      }}>
                        {peak.count}
                        <span style={{ fontSize: '1rem', marginLeft: 4 }}>件</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: 16, fontSize: '1.2rem', color: '#333' }}>曜日別利用状況</h4>
                <div style={{ 
                  background: '#fff',
                  padding: 24,
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', height: 200, alignItems: 'flex-end' }}>
                    {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => {
                      const count = stats.usageByDay[index] || 0;
                      const maxCount = Math.max(...Object.values(stats.usageByDay));
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: '100%',
                            height: `${height}%`,
                            background: index === 0 ? '#e57373' : index === 6 ? '#2196F3' : '#26a69a',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease'
                          }} />
                          <p style={{ 
                            fontWeight: 'bold', 
                            marginTop: 8,
                            color: index === 0 ? '#e57373' : index === 6 ? '#2196F3' : '#333'
                          }}>
                            {day}
                          </p>
                          <p style={{ 
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#666',
                            margin: '4px 0 0 0'
                          }}>
                            {count}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: 16, fontSize: '1.2rem', color: '#333' }}>月別利用状況</h4>
                <div style={{ 
                  background: '#fff',
                  padding: 24,
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    {['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'].map((month, index) => {
                      const count = stats.usageByMonth[index] || 0;
                      const maxCount = Math.max(...Object.values(stats.usageByMonth));
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={month} style={{ 
                          flex: '0 0 calc(25% - 8px)', 
                          marginBottom: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            width: '100%',
                            height: 120,
                            display: 'flex',
                            alignItems: 'flex-end',
                            marginBottom: 8
                          }}>
                            <div style={{
                              width: '100%',
                              height: `${height}%`,
                              background: 'linear-gradient(180deg, #26a69a 0%, #1a8c82 100%)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease'
                            }} />
                          </div>
                          <p style={{ 
                            fontWeight: 'bold', 
                            marginBottom: 4,
                            color: '#333'
                          }}>
                            {month}
                          </p>
                          <p style={{ 
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#26a69a',
                            margin: 0
                          }}>
                            {count}
                            <span style={{ fontSize: '0.9rem', marginLeft: 2 }}>件</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowStatsModal(false)}
                  style={{
                    background: '#607D8B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '12px 24px',
                    cursor: 'pointer'
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* カレンダーモーダル */}
        {showCalendarModal && selectedFacilityCalendar && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              padding: 32,
              width: '90%',
              maxWidth: 1000,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                  {selectedFacilityCalendar.name}の予約カレンダー
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginBottom: 24 }}>
                  <button
                    onClick={() => handleMonthChange(-1)}
                    style={{
                      background: '#26a69a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      boxShadow: '0 2px 4px rgba(38,166,154,0.2)',
                      transition: 'all 0.2s',
                      minWidth: 100
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1a8c82'}
                    onMouseOut={e => e.currentTarget.style.background = '#26a69a'}
                  >
                    ← 前月
                  </button>
                  <div style={{ fontWeight: 'bold', fontSize: '1.4rem', minWidth: 180, textAlign: 'center', color: '#26a69a', letterSpacing: '0.05em' }}>
                    {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                  </div>
                  <button
                    onClick={() => handleMonthChange(1)}
                    style={{
                      background: '#26a69a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      boxShadow: '0 2px 4px rgba(38,166,154,0.2)',
                      transition: 'all 0.2s',
                      minWidth: 100
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#1a8c82'}
                    onMouseOut={e => e.currentTarget.style.background = '#26a69a'}
                  >
                    次月 →
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                {/* カレンダー表示 */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
                    {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                      <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: 12, color: index === 0 ? '#e57373' : index === 6 ? '#2196F3' : '#333', fontSize: '1.1rem' }}>
                        {day}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                    {getDaysInMonth(currentMonth).map((date, index) => {
                      const isSunday = date && date.getDay() === 0;
                      const isSaturday = date && date.getDay() === 6;
                      const isToday = date && date.toDateString() === new Date().toDateString();
                      let badgeCount = 0;
                      let hasMaintenance = false;
                      if (date && selectedFacilityCalendar) {
                        const { reservations, maintenances } = getReservationsAndMaintenanceForDate(selectedFacilityCalendar, date);
                        badgeCount = reservations.length + maintenances.length;
                        hasMaintenance = maintenances.length > 0;
                      }
                      return (
                        <div
                          key={index}
                          onClick={() => handleDateSelect(date)}
                          style={{
                            aspectRatio: '1',
                            padding: 8,
                            background: date ? (isToday ? '#e3f2fd' : '#f8fafc') : 'transparent',
                            borderRadius: 8,
                            cursor: date ? 'pointer' : 'default',
                            border: selectedDate && date && selectedDate.getTime() === date.getTime() 
                              ? '2px solid #26a69a' 
                              : '1px solid #e0e0e0',
                            position: 'relative',
                            transition: 'all 0.2s',
                            color: isSunday ? '#e57373' : isSaturday ? '#2196F3' : '#333',
                            fontWeight: isToday ? 'bold' : 'normal',
                            boxShadow: hasMaintenance ? '0 0 0 2px #ffb300' : undefined
                          }}
                          onMouseOver={e => {
                            if (date) {
                              e.currentTarget.style.background = '#e3f2fd';
                              e.currentTarget.style.transform = 'scale(1.02)';
                            }
                          }}
                          onMouseOut={e => {
                            if (date) {
                              e.currentTarget.style.background = isToday ? '#e3f2fd' : '#f8fafc';
                              e.currentTarget.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          {date && (
                            <>
                              <span style={{ fontSize: '1.1rem', display: 'block', marginBottom: badgeCount > 0 ? 4 : 0 }}>
                                {date.getDate()}
                              </span>
                              {badgeCount > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: 4,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  background: hasMaintenance ? '#ffb300' : '#26a69a',
                                  color: '#fff',
                                  borderRadius: 12,
                                  padding: '3px 8px',
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(38,166,154,0.2)'
                                }}>
                                  {badgeCount}件
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 予約詳細表示 */}
                <div>
                  <h4 style={{ fontWeight: 'bold', marginBottom: 16 }}>
                    {selectedDate ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の予約・予定` : '日付を選択してください'}
                  </h4>
                  {selectedDateReservations.length === 0 && (!selectedDateMaintenances || selectedDateMaintenances.length === 0) ? (
                    <p style={{ color: '#888' }}>予約・予定はありません</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* メンテナンス・清掃予定 */}
                      {selectedDateMaintenances && selectedDateMaintenances.map((m, i) => (
                        <div
                          key={i}
                          style={{
                            background: '#fffde7',
                            padding: 16,
                            borderRadius: 8,
                            border: '1.5px solid #ffb300',
                            color: '#ff8f00',
                            fontWeight: 'bold',
                            boxShadow: '0 1px 4px rgba(255,193,7,0.07)'
                          }}
                        >
                          🛠️ メンテナンス・清掃予定: {m.description || '（内容未記入）'}<br />
                          <span style={{ fontWeight: 'normal', color: '#888', fontSize: 13 }}>
                            {m.startDate} ~ {m.endDate}
                          </span>
                        </div>
                      ))}
                      {/* 予約 */}
                      {selectedDateReservations.map(reservation => (
                        <div
                          key={reservation.id}
                          style={{
                            background: '#f5f5f5',
                            padding: 16,
                            borderRadius: 8
                          }}
                        >
                          <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                            利用者: {reservation.userName || '-'}
                          </p>
                          <p>
                            利用人数: {reservation.people ? reservation.people + '人' : '-'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  style={{
                    background: '#607D8B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '12px 24px',
                    cursor: 'pointer'
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* サンプルCSVプレビューモーダル */}
        {showSampleModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.4)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 1100, minWidth: 900, maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 18 }}>サンプルCSVプレビュー</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {sampleCsvHeader.map((h, i) => (
                        <th key={i} style={{ borderBottom: '2px solid #26a69a', padding: '8px 6px', background: '#e0f2f1', color: '#26a69a', fontWeight: 'bold' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleCsvData.map((row, i) => (
                      <tr key={i}>
                        {sampleCsvHeader.map((h, j) => (
                          <td key={j} style={{ borderBottom: '1px solid #eee', padding: '7px 6px', textAlign: 'center' }}>{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: 'right', marginTop: 18 }}>
                <button onClick={() => setShowSampleModal(false)} style={{ background: '#607D8B', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 'bold', cursor: 'pointer' }}>閉じる</button>
              </div>
            </div>
          </div>
        )}


      </div>
      <style>
        {`
          @media (max-width: 900px) {
            table, th, td {
              font-size: 0.95rem !important;
            }
            button {
              font-size: 0.95rem !important;
              padding: 0.5em 0.8em !important;
              min-width: 60px !important;
            }
            input, select {
              font-size: 0.95rem !important;
              padding: 8px !important;
              min-width: 80px !important;
              height: 36px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminFacilityList; 