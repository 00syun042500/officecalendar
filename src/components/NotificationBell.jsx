import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, updateDoc, doc, deleteDoc, query, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const NotificationBell = ({ buttonStyle, iconSrc }) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(auth.currentUser);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 通知の取得
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // currentUserが取得できてからフィルタ
      const filteredData = data
        .filter(n => n.type !== 'admin_announce') // 管理者通知を除外
        .filter(n => !(n.deletedUsers && currentUser && n.deletedUsers.includes(currentUser.uid)));
      setNotifications(filteredData);
      setUnreadCount(
        filteredData.filter(n => !(n.readUsers && n.readUsers.includes(currentUser?.uid))).length
      );
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 通知を既読化
  const handleReadNotification = async (id) => {
    await updateDoc(doc(db, 'notifications', id), {
      readUsers: arrayUnion(currentUser.uid)
    });
  };

  // 通知を一括既読化
  const handleReadAllNotifications = async () => {
    const unread = notifications.filter(n => n.read === false);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), {
        readUsers: arrayUnion(currentUser.uid)
      });
    }
  };

  // 通知を削除
  const handleDeleteNotification = async (id) => {
    await updateDoc(doc(db, 'notifications', id), {
      deletedUsers: arrayUnion(currentUser.uid)
    });
  };

  return (
    <div>
      <button
        className="notification-bell-btn"
        onClick={() => setShowNotificationModal(true)}
        style={buttonStyle || {
          background: '#fff',
          border: 'none',
          borderRadius: 20,
          boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          margin: '0 2px',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s'
        }}
        title="通知一覧"
      >
        <img src={iconSrc || '/icon-bell.png'} alt="通知" style={{ width: 24, height: 24 }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6, background: '#e57373', color: '#fff',
            borderRadius: '50%', width: 18, height: 18, fontSize: 12, fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* 通知一覧モーダル */}
      {showNotificationModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: '90%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '1.3rem', margin: 0 }}>通知一覧</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleReadAllNotifications}
                  style={{
                    background: '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontWeight: 'bold',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    minWidth: 140,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(25,118,210,0.2)'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#1565c0'}
                  onMouseOut={e => e.currentTarget.style.background = '#1976d2'}
                >
                  <span style={{ fontSize: 15 }}>✓</span>
                  すべて既読にする
                </button>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  style={{
                    background: '#607D8B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 'bold',
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(96,125,139,0.2)'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#455A64'}
                  onMouseOut={e => e.currentTarget.style.background = '#607D8B'}
                >
                  閉じる
                </button>
              </div>
            </div>
            {notifications.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 0',
                color: '#888',
                fontSize: '1.1rem'
              }}>
                通知はありません
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {notifications.map(n => {
                  // 通知タイプに応じたスタイル設定
                  const getNotificationStyle = (type) => {
                    switch (type) {
                      case 'facility_status':
                        return {
                          background: n.readUsers && n.readUsers.includes(currentUser?.uid) ? '#f5f5f5' : '#e3f2fd',
                          border: n.readUsers && n.readUsers.includes(currentUser?.uid) ? '1px solid #eee' : '1.5px solid #1976d2',
                          icon: '🏢',
                          color: '#1976d2'
                        };
                      case 'reservation':
                        return {
                          background: n.readUsers && n.readUsers.includes(currentUser?.uid) ? '#f5f5f5' : '#e8f5e9',
                          border: n.readUsers && n.readUsers.includes(currentUser?.uid) ? '1px solid #eee' : '1.5px solid #43a047',
                          icon: '📅',
                          color: '#43a047'
                        };
                      case 'maintenance':
                        return {
                          background: n.readUsers && n.readUsers.includes(currentUser?.uid) ? '#f5f5f5' : '#fff3e0',
                          border: n.readUsers && n.readUsers.includes(currentUser?.uid) ? '1px solid #eee' : '1.5px solid #f57c00',
                          icon: '🔧',
                          color: '#f57c00'
                        };
                      default:
                        return {
                          background: n.readUsers && n.readUsers.includes(currentUser?.uid) ? '#f5f5f5' : '#f3e5f5',
                          border: n.readUsers && n.readUsers.includes(currentUser?.uid) ? '1px solid #eee' : '1.5px solid #7b1fa2',
                          icon: '📢',
                          color: '#7b1fa2'
                        };
                    }
                  };

                  const style = getNotificationStyle(n.type);

                  return (
                    <li
                      key={n.id}
                      style={{
                        ...style,
                        borderRadius: 12,
                        marginBottom: 12,
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        position: 'relative',
                        minHeight: 60,
                        transition: 'all 0.2s',
                        transform: n.readUsers && n.readUsers.includes(currentUser?.uid) ? 'none' : 'translateX(0)',
                        animation: n.readUsers && n.readUsers.includes(currentUser?.uid) ? 'none' : 'slideIn 0.3s ease-out'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ 
                          fontSize: 24,
                          lineHeight: 1,
                          marginTop: 2
                        }}>
                          {style.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.05rem', 
                            marginBottom: 4,
                            color: style.color
                          }}>
                            {n.title}
                          </div>
                          <div style={{ 
                            fontSize: 14, 
                            color: '#444', 
                            marginBottom: 8,
                            lineHeight: 1.4
                          }}>
                            {n.body}
                          </div>
                          <div style={{ 
                            fontSize: 12, 
                            color: '#888',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>
                              {n.createdAt && n.createdAt.toDate ? n.createdAt.toDate().toLocaleString() : ''}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {!n.readUsers || !n.readUsers.includes(currentUser?.uid) && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleReadNotification(n.id); }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: style.color,
                                    cursor: 'pointer',
                                    fontSize: 15,
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = `${style.color}15`}
                                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                                  title="既読にする"
                                >
                                  <span style={{ fontSize: 16 }}>✓</span>
                                  既読
                                </button>
                              )}
                              <button
                                onClick={e => { e.stopPropagation(); handleDeleteNotification(n.id); }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#e57373',
                                  cursor: 'pointer',
                                  fontSize: 15,
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#ffebee'}
                                onMouseOut={e => e.currentTarget.style.background = 'none'}
                                title="削除"
                              >
                                <span style={{ fontSize: 16 }}>🗑️</span>
                                削除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <style>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;