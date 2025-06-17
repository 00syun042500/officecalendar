import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ROLE_OPTIONS = ['ビギナー', 'リーダー', 'マネージャー', 'オーナー'];

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [modalType, setModalType] = useState(''); // 'detail' or 'edit'
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [updateStatus, setUpdateStatus] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setError('ユーザー情報の取得に失敗しました。');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const openDetail = (user) => {
    setSelectedUser(user);
    setModalType('detail');
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || ''
    });
    setModalType('edit');
  };

  const closeModal = () => {
    setSelectedUser(null);
    setEditUser(null);
    setModalType('');
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      setUpdateStatus({ type: 'loading', message: '更新中...' });
      const userRef = doc(db, 'users', editUser.id);
      await updateDoc(userRef, editForm);
      setUsers(users.map(u => u.id === editUser.id ? { ...u, ...editForm } : u));
      setUpdateStatus({ type: 'success', message: 'ユーザー情報を更新しました。' });
      setTimeout(() => {
        setUpdateStatus({ type: '', message: '' });
        closeModal();
      }, 2000);
    } catch (error) {
      console.error('Error updating user:', error);
      setUpdateStatus({ type: 'error', message: '更新に失敗しました。' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('本当にこのユーザーを削除しますか？')) {
      try {
        setUpdateStatus({ type: 'loading', message: '削除中...' });
        await deleteDoc(doc(db, 'users', id));
        setUsers(users.filter(u => u.id !== id));
        setUpdateStatus({ type: 'success', message: 'ユーザーを削除しました。' });
        setTimeout(() => {
          setUpdateStatus({ type: '', message: '' });
        }, 2000);
      } catch (error) {
        console.error('Error deleting user:', error);
        setUpdateStatus({ type: 'error', message: '削除に失敗しました。' });
      }
    }
  };

  // 検索・フィルタ処理
  const filteredUsers = users.filter(user => {
    const nameMatch = user.name?.toLowerCase().includes(searchName.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchEmail.toLowerCase());
    return nameMatch && emailMatch;
  });

  // 並び替え処理
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!key) return 0;
    let aValue = a[key] || '';
    let bValue = b[key] || '';
    return direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
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

  const addUser = async (name, email) => {
    try {
      await addDoc(collection(db, 'users'), {
        name: name,
        email: email,
        role: 'ビギナー'
      });
      alert('ユーザーを登録しました！');
    } catch (e) {
      alert('登録に失敗しました: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: "url('/bg-marble.jpg') center/cover no-repeat fixed"
      }}>
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>読み込み中...</div>
          <div style={{ color: '#666' }}>ユーザー情報を取得しています</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: "url('/bg-marble.jpg') center/cover no-repeat fixed"
      }}>
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ color: '#e57373', fontSize: '1.2rem', marginBottom: '1rem' }}>エラーが発生しました</div>
          <div style={{ color: '#666' }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#26a69a',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: "url('/bg-marble.jpg') center/cover no-repeat fixed",
        padding: 0,
      }}
    >
      {updateStatus.message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '1rem',
          borderRadius: '8px',
          background: updateStatus.type === 'error' ? '#e57373' : '#26a69a',
          color: '#fff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          {updateStatus.message}
        </div>
      )}

      <div style={{
        maxWidth: 750,
        margin: '40px auto',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(38,166,154,0.10), 0 1.5px 8px rgba(0,0,0,0.04)',
        padding: 36,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          fontSize: '2rem',
          color: '#26a69a',
          fontWeight: 'bold',
          letterSpacing: '0.04em'
        }}>ユーザー管理</h2>

        {/* 検索・フィルタ欄 */}
        <div style={{ width: '100%', marginBottom: 24, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="名前で検索"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ borderRadius: 8, border: '1px solid #ccc', padding: '12px', fontSize: 16, minWidth: 180 }}
          />
          <input
            type="text"
            placeholder="メールアドレスで検索"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            style={{ borderRadius: 8, border: '1px solid #ccc', padding: '12px', fontSize: 16, minWidth: 180 }}
          />
        </div>

        <div style={{ width: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(38,166,154,0.07)'
          }}>
            <thead>
              <tr style={{ background: '#26a69a', color: '#fff' }}>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  名前 {getSortArrow('name')}
                </th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => handleSort('email')}>
                  メールアドレス {getSortArrow('email')}
                </th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => handleSort('role')}>
                  権限 {getSortArrow('role')}
                </th>
                <th style={{ padding: '1em 0.5em', fontWeight: 'bold', fontSize: '1.1rem' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#888', padding: '2em 0', fontSize: '1rem' }}>ユーザーがいません</td>
                </tr>
              ) : (
                sortedUsers.map((u) => (
                  <tr key={u.id} style={{ background: '#f8fafc', borderBottom: '1.5px solid #e0f2f1' }}>
                    <td style={{ padding: '0.8em 0.5em', textAlign: 'center', fontWeight: 'bold', color: '#222', fontSize: '1rem' }}>{u.name || '-'}</td>
                    <td style={{ padding: '0.8em 0.5em', textAlign: 'center', fontSize: '0.98rem' }}>{u.email || '-'}</td>
                    <td style={{ padding: '0.8em 0.5em', textAlign: 'center', fontSize: '0.98rem' }}>{u.role || '-'}</td>
                    <td style={{ padding: '0.8em 0.5em', textAlign: 'center', display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button
                        onClick={() => openEdit(u)}
                        style={{
                          background: '#FFD600',
                          color: '#333',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.6em 1.2em',
                          fontWeight: 'bold',
                          fontSize: '0.98rem',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
                          transition: 'background 0.18s'
                        }}
                      >
                        権限編集
                      </button>
                      {u.email !== currentUserEmail && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{
                            background: '#e57373',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '0.6em 1.2em',
                            fontWeight: 'bold',
                            fontSize: '0.98rem',
                            cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(38,166,154,0.07)',
                            transition: 'background 0.18s'
                          }}
                        >
                          削除
                        </button>
                      )}
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
            padding: '12px 32px',
            fontWeight: 'bold',
            fontSize: '1.05rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            cursor: 'pointer',
            width: '100%',
            maxWidth: 260,
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'block'
          }}
        >
          ホームに戻る
        </button>
      </div>

      {/* 権限編集モーダル */}
      {modalType === 'edit' && editUser && (
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
            padding: 28,
            width: '90%',
            maxWidth: 340,
            boxShadow: '0 2px 10px rgba(0,0,0,0.13)'
          }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 18 }}>権限を編集</h3>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, fontSize: '1rem' }}>権限</label>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
                  required
                >
                  <option value="">選択してください</option>
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: '#607D8B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontSize: '0.98rem',
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
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontSize: '0.98rem',
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
    </div>
  );
};

export default AdminUserList; 