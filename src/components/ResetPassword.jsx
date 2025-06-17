import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import logo from '../assets/logo.jpg';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!email) {
      setError('メールアドレスを入力してください。');
      return;
    }
    try {
      // Firestoreでメールアドレスの存在確認
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError('登録されていないメールアドレスです。');
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setMessage('パスワードリセット用のメールを送信しました。\nメールをご確認ください。');
    } catch (err) {
      if (err.code === 'auth/invalid-email') {
        setError('メールアドレスが正しくありません。');
      } else {
        setError('エラーが発生しました。もう一度お試しください。');
      }
      setMessage('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logo} alt="Sales synergy logo" className="logo" />
        <h2>パスワードリセット</h2>
        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          {message && (
            <div style={{ color: 'green', marginBottom: 8, whiteSpace: 'pre-line', fontSize: '14px' }}>{message}</div>
          )}
          <button type="submit">送信</button>
        </form>
        <div style={{ marginTop: 16 }}>
          <span style={{ color: '#1976d2', cursor: 'pointer' }} onClick={() => navigate('/login')}>
            ログイン画面に戻る
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 