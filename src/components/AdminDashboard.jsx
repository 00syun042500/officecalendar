import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import logo from '../assets/logo.jpg';
import './home.css';
import NotificationBell from './NotificationBell';
import { collection, addDoc, serverTimestamp, onSnapshot, orderBy, updateDoc, doc, deleteDoc, query, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

const adminMessages = [
  '管理者の皆様、いつもお疲れ様です！',
  '快適なオフィス運営をサポートします。',
  '管理業務もスマートに！',
  '今日も素敵な一日を！',
  'システム管理でみんなを笑顔に！'
];

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [adminPhoto, setAdminPhoto] = useState('');
  const navigate = useNavigate();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [globalMessage, setGlobalMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState("");
  const [showAdminNoticeModal, setShowAdminNoticeModal] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [adminBadgeBlink, setAdminBadgeBlink] = useState(false);
  const prevAdminUnreadCount = useRef(0);
  const [currentUser, setCurrentUser] = useState(null);

  // 管理者固有のローカルストレージキーを生成
  const getAdminPhotoKey = (email) => `adminPhoto_${email}`;

  useEffect(() => {
    setAdmin(auth.currentUser);
    setCurrentUser(auth.currentUser);
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setAdmin(u);
      setCurrentUser(u);
      if (u?.email) {
        const photoKey = getAdminPhotoKey(u.email);
        const savedPhoto = localStorage.getItem(photoKey);
        if (u?.photoURL) {
          // 管理者固有のキーで画像を保存
          localStorage.setItem(photoKey, u.photoURL);
          setAdminPhoto(u.photoURL);
        } else if (savedPhoto) {
          // photoURLが空でもローカルストレージに画像があればそれを使う
          setAdminPhoto(savedPhoto);
        } else {
          // どちらもなければ空文字（デフォルト画像が表示される）
          setAdminPhoto('');
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminNotifications(
        data.filter(n => n.type === "admin_announce")
            .filter(n => !(n.deletedUsers && currentUser && n.deletedUsers.includes(currentUser.uid)))
      );
      setAdminUnreadCount(
        data.filter(n => n.type === "admin_announce")
            .filter(n => !(n.deletedUsers && currentUser && n.deletedUsers.includes(currentUser.uid)))
            .filter(n => !(n.readUsers && currentUser && n.readUsers.includes(currentUser.uid))).length
      );
    });
    return () => unsubscribe();
  }, [currentUser]);

  // バッジ点滅制御
  useEffect(() => {
    if (adminUnreadCount > prevAdminUnreadCount.current) {
      setAdminBadgeBlink(true);
      setTimeout(() => setAdminBadgeBlink(false), 1500);
    }
    prevAdminUnreadCount.current = adminUnreadCount;
  }, [adminUnreadCount]);

  const handleLogout = async () => {
    try {
      // ログアウト時に現在の管理者の画像をクリア
      if (admin?.email) {
        const photoKey = getAdminPhotoKey(admin.email);
        localStorage.removeItem(photoKey);
      }
      await auth.signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
    }
  };

  function getMotivationMessage() {
    const idx = new Date().getDay() % adminMessages.length;
    return adminMessages[idx];
  }

  // 仮の全体通知送信関数
  const sendGlobalMessage = async (message) => {
    setSending(true);
    setSendResult("");
    try {
      await addDoc(collection(db, "notifications"), {
        message,
        createdAt: serverTimestamp(),
        sender: admin?.displayName || admin?.email || "管理者",
        type: "admin_announce"
      });
      setSendResult("全社員にメッセージを送信しました！");
      setGlobalMessage("");
    } catch (e) {
      setSendResult("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  // 既読化
  const handleReadNotification = async (id) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'notifications', id), {
      readUsers: arrayUnion(currentUser.uid)
    });
  };
  // 一括既読
  const handleReadAllNotifications = async () => {
    if (!currentUser) return;
    const unread = adminNotifications.filter(n => !(n.readUsers && n.readUsers.includes(currentUser.uid)));
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), {
        readUsers: arrayUnion(currentUser.uid)
      });
    }
  };
  // 削除
  const handleDeleteNotification = async (id) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'notifications', id), {
      deletedUsers: arrayUnion(currentUser.uid)
    });
  };

  return (
    <div
      className="home-container"
      style={{
        backgroundImage: "url('/bg-marble.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh'
      }}
    >
      {admin && (
        <div
          style={{
            position: 'fixed',
            top: 18,
            left: 28,
            display: 'flex',
            alignItems: 'center',
            zIndex: 1002,
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 28,
            padding: '6px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            height: 56,
            gap: 16
          }}
        >
          {/* 管理者アイコン＋名前 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={
                adminPhoto || admin?.photoURL
                  ? adminPhoto || admin.photoURL
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.displayName || admin?.email || 'Admin')}&background=007bff&color=fff&rounded=true&size=48`
              }
              alt="admin icon"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                objectFit: 'cover',
                background: '#eee',
                display: 'block',
                marginRight: 0
              }}
              onError={e => {
                e.target.onerror = null;
                if (admin?.email) {
                  const photoKey = getAdminPhotoKey(admin.email);
                  const savedPhoto = localStorage.getItem(photoKey);
                  if (savedPhoto) {
                    e.target.src = savedPhoto;
                  } else {
                    e.target.src = '/images/default-admin.png';
                  }
                } else {
                  e.target.src = '/images/default-admin.png';
                }
              }}
            />
            <span style={{
              fontWeight: 'bold',
              color: '#333',
              fontSize: '1.08rem',
              whiteSpace: 'nowrap',
              padding: 0
            }}>
              {admin?.displayName || admin?.email?.split('@')[0] || '管理者'}
            </span>
          </div>

          {/* ベル通知ボタン */}
          <NotificationBell
            buttonStyle={{
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
            iconSrc="/icon-bell.png"
          />

          {/* 管理者通知ボタン */}
          <button
            style={{
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
            onClick={() => setShowAdminNoticeModal(true)}
            title="管理者からの通知"
          >
            <img src="/icon-message.jpg" alt="管理者通知" style={{ width: 24, height: 24 }} />
            {adminUnreadCount > 0 && (
              <span
                className={adminBadgeBlink ? 'badge-blink' : ''}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: '#e53935',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: 12,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                }}
              >
                {adminUnreadCount}
              </span>
            )}
          </button>

          {/* プロフィールボタン */}
          <button
            style={{
              background: '#00b894',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '0 16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
              height: 44,
              margin: '0 2px',
              transition: 'box-shadow 0.2s',
              whiteSpace: 'nowrap'
            }}
            onClick={() => navigate('/profile', { state: { fromAdmin: true } })}
          >
            プロフィール
          </button>

          {/* ログアウトボタン */}
          <button
            style={{
              background: '#e57373',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '0 18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
              height: 44,
              margin: '0 2px',
              transition: 'box-shadow 0.2s'
            }}
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      )}
      <div className="home-main-layout">
        <div className="home-welcome-area">
          <div className="home-motivation">{getMotivationMessage()}</div>
          <div className="home-subtitle">管理者ダッシュボード</div>
          <img src={logo} alt="管理者ロゴ" className="home-illust" />
          <div className="home-button-col">
            <button
              className="reserve-button reserve-btn-reserve"
              onClick={() => navigate('/admin/reservations')}
            >
              <span className="button-content">
                <img src="/icon-list.jpg" alt="予約管理" className="button-icon" />
                予約管理
              </span>
            </button>
            <button
              className="reserve-button reserve-btn-list"
              onClick={() => navigate('/admin/facilities')}
            >
              <span className="button-content">
                <img src="/icon-calendar.webp" alt="施設管理" className="button-icon" />
                施設管理
              </span>
            </button>
            <button
              className="reserve-button reserve-btn-calendar"
              onClick={() => navigate('/admin/users')}
            >
              <span className="button-content">
                <img src="/icon-reserve.jpg" alt="ユーザー管理" className="button-icon" />
                ユーザー管理
              </span>
            </button>
            <button
              className="reserve-button reserve-btn-message"
              style={{ background: '#ffe082', color: '#333', fontWeight: 'bold' }}
              onClick={() => {
                setSendResult("");
                setShowMessageModal(true);
              }}
            >
              <span className="button-content">
                <img src="/icon-message.jpg" alt="全体メッセージ" className="button-icon" />
                全体メッセージ送信
              </span>
            </button>
          </div>
        </div>
      </div>
      {/* 全体メッセージ送信モーダル */}
      {showMessageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            padding: 40,
            minWidth: 480,
            maxWidth: 600,
            width: '100%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: 8 }}>全体メッセージ送信</div>
            <textarea
              value={globalMessage}
              onChange={e => setGlobalMessage(e.target.value)}
              rows={4}
              style={{ width: '100%', borderRadius: 8, border: '1px solid #ccc', padding: 8, fontSize: '1rem' }}
              placeholder="社員全員に送るメッセージを入力してください"
              disabled={sending}
            />
            {sendResult && <div style={{ color: sendResult.includes('失敗') ? 'red' : 'green', fontWeight: 'bold' }}>{sendResult}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSendResult("");
                  setShowMessageModal(false);
                }}
                style={{ background: '#ccc', color: '#333', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}
                disabled={sending}
              >
                閉じる
              </button>
              <button
                onClick={async () => {
                  if (!globalMessage.trim()) return;
                  await sendGlobalMessage(globalMessage);
                }}
                style={{ background: '#00b894', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}
                disabled={sending || !globalMessage.trim()}
              >
                {sending ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 管理者通知モーダル */}
      {showAdminNoticeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 56,
            minWidth: 540,
            maxWidth: 720,
            maxHeight: '85vh',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>管理者からの通知</span>
                {adminUnreadCount > 0 && (
                  <span style={{
                    background: '#e53935',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {adminUnreadCount}件の未読
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
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
                  onClick={() => setShowAdminNoticeModal(false)}
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
            {adminNotifications.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 0', 
                color: '#888', 
                fontSize: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <span>通知はありません</span>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {adminNotifications.map(n => {
                  const isRead = n.readUsers && currentUser && n.readUsers.includes(currentUser.uid);
                  const isImportant = n.important;
                  return (
                    <li
                      key={n.id}
                      style={{
                        background: isRead ? '#f5f5f5' : isImportant ? '#fff3e0' : '#f3e5f5',
                        border: isRead 
                          ? '1px solid #eee' 
                          : isImportant 
                            ? '1.5px solid #ff9800' 
                            : '1.5px solid #7b1fa2',
                        borderRadius: 12,
                        marginBottom: 12,
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        position: 'relative',
                        minHeight: 60,
                        transition: 'all 0.2s',
                        animation: isRead ? 'none' : 'slideIn 0.3s ease-out',
                        ':hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ 
                          fontSize: 24, 
                          lineHeight: 1, 
                          marginTop: 2,
                          color: isImportant ? '#ff9800' : '#7b1fa2'
                        }}>
                          {isImportant ? '⚠️' : '📢'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.05rem', 
                            marginBottom: 4, 
                            color: isImportant ? '#ff9800' : '#7b1fa2',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            {n.title || 'お知らせ'}
                            {isImportant && (
                              <span style={{
                                background: '#ff9800',
                                color: '#fff',
                                borderRadius: 4,
                                padding: '2px 6px',
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                重要
                              </span>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: 14, 
                            color: '#444', 
                            marginBottom: 8, 
                            lineHeight: 1.4,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {n.body || n.message}
                          </div>
                          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                            送信者: {n.sender || '管理者'}
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
                              {!isRead && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleReadNotification(n.id); }}
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#7b1fa2', 
                                    cursor: 'pointer', 
                                    fontSize: 15, 
                                    padding: '4px 8px', 
                                    borderRadius: 4, 
                                    transition: 'all 0.2s',
                                    ':hover': {
                                      background: '#f3e5f5'
                                    }
                                  }}
                                  title="既読にする"
                                >
                                  ✓ 既読
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
                                  whiteSpace: 'nowrap',
                                  ':hover': {
                                    background: '#ffebee'
                                  }
                                }}
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
            <style>{`
              @keyframes slideIn {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
              @keyframes badgeBlink {
                0% { filter: brightness(1); }
                30% { filter: brightness(2.2); }
                60% { filter: brightness(0.7); }
                100% { filter: brightness(1); }
              }
              .badge-blink {
                animation: badgeBlink 1.2s ease-in-out 2;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 