import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { getReservations } from '../utils/firestoreUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import './profile.css'; // 新規作成 or home.cssを流用
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function Profile() {
  const user = auth.currentUser;
  const [myReservations, setMyReservations] = useState([]);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.state && location.state.fromAdmin;

  // ユーザー固有のローカルストレージキーを生成
  const getUserPhotoKey = (email) => `userPhoto_${email}`;

  useEffect(() => {
    const fetchMyReservations = async () => {
      const all = await getReservations();
      setMyReservations(all.filter(r => r.userId === user?.uid));
    };
    fetchMyReservations();
  }, [user]);

  if (!user) {
    return <div>ログイン情報がありません。</div>;
  }

  // 画像ファイルを選択したとき
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoURL(URL.createObjectURL(file));
    }
  };

  // プロフィール更新
  const handleSave = async () => {
    try {
      let newPhotoURL = photoURL;
      // 画像アップロード処理（今回は簡易的にローカルURLのみ。実際はFirebase Storage推奨）
      if (photoFile) {
        // 本番運用ではFirebase Storageにアップロードし、そのURLを取得してnewPhotoURLにセット
        // ここではローカルURLのまま
      }
      await updateProfile(user, {
        displayName,
        photoURL: newPhotoURL,
      });

      // Firestoreのusersコレクションも更新
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          name: displayName,
        });
      } else {
        await setDoc(userRef, {
          name: displayName,
          email: user.email,
          role: "ビギナー"
        });
      }

      toast.success('編集が完了しました。');
      setIsEditing(false);
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/home');
      }
      return;
    } catch (error) {
      console.error(error);
      toast.error('編集に失敗しました。再度お試しください。');
    }
  };

  // 編集キャンセル
  const handleCancel = () => {
    setDisplayName(user.displayName || '');
    setPhotoURL(user.photoURL || '');
    setPhotoFile(null);
    setIsEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    if (newPass !== confirm) {
      setMessage('新しいパスワードが一致しません');
      return;
    }
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);
      setMessage('パスワードを変更しました');
      setShowChange(false);
      setCurrent('');
      setNewPass('');
      setConfirm('');
    } catch (err) {
      setMessage('パスワード変更に失敗しました: ' + err.message);
    }
  };

  const saveDisplayName = async (userId, displayName) => {
    await updateDoc(doc(db, 'users', userId), {
      name: displayName,
    });
  };

  return (
    <div className="profile-bg">
      <div className="profile-card">
        <img
          src={
            photoURL
              ? photoURL
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || user?.email || 'User')}&background=007bff&color=fff&rounded=true&size=96`
          }
          alt="user icon"
          className="profile-avatar"
          onError={e => {
            e.target.onerror = null;
            e.target.src = '/images/default-user.png';
          }}
        />
        <div className="profile-name">{displayName || user?.email}</div>
        <div className="profile-email">{user?.email}</div>

        {/* 編集ボタン */}
        {!isEditing && (
          <button className="profile-btn" onClick={() => setIsEditing(true)}>
            プロフィール編集
          </button>
        )}

        {/* 編集フォーム */}
        {isEditing && (
          <div className="profile-edit-form">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="表示名"
              className="profile-edit-input"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="profile-edit-input"
            />
            <button className="profile-btn" onClick={handleSave}>
              保存
            </button>
            <button
              className="profile-btn"
              style={{ background: '#b0bec5', color: '#263238' }}
              onClick={handleCancel}
            >
              キャンセル
            </button>
          </div>
        )}

        {/* パスワード変更ボタン */}
        <button className="profile-btn" onClick={() => setShowChange(!showChange)}>
          パスワードを変更する
        </button>
        {showChange && (
          <form onSubmit={handleChangePassword} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', maxWidth: 260, marginBottom: 10 }}>
              <input
                type="password"
                placeholder="現在のパスワード"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                required
                className="profile-edit-input"
                style={{ width: '100%', textAlign: 'center' }}
              />
            </div>
            <div style={{ width: '100%', maxWidth: 260, marginBottom: 10 }}>
              <input
                type="password"
                placeholder="新しいパスワード"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                required
                className="profile-edit-input"
                style={{ width: '100%', textAlign: 'center' }}
              />
            </div>
            <div style={{ width: '100%', maxWidth: 260, marginBottom: 18 }}>
              <input
                type="password"
                placeholder="新しいパスワード（確認）"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="profile-edit-input"
                style={{ width: '100%', textAlign: 'center' }}
              />
            </div>
            <button type="submit" className="profile-btn" style={{ width: 260, margin: '0 auto' }}>変更する</button>
          </form>
        )}
        {message && <div style={{ color: message.includes('失敗') ? 'red' : 'green' }}>{message}</div>}

        {/* ホームに戻るボタン */}
        <button
          className="profile-btn"
          onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/home')}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}

export default Profile;
