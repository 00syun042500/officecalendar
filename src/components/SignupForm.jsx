import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './LoginForm.css'; // ← 同じCSS使い回す
import logo from '../assets/logo.jpg';
import { useNavigate } from 'react-router-dom';

function SignupForm({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!username) {
      alert('ユーザー名を入力してください');
      return;
    }
    if (password !== passwordConfirm) {
      alert('パスワードが一致しません');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Firestoreにユーザー情報を追加（uidをドキュメントIDにする！）
      await setDoc(doc(db, 'users', user.uid), {
        name: username,
        email: email,
        role: 'ビギナー'
      });
      alert('ユーザー登録成功！');
      navigate('/home');
    } catch (error) {
      alert('登録失敗：' + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1976d2', letterSpacing: '0.08em', marginBottom: 12, textAlign: 'center', fontFamily: 'Segoe UI, sans-serif', lineHeight: 1.3 }}>
          社内向け<br />社内施設予約管理システム
        </div>
        <img src={logo} alt="Sales synergy logo" className="logo" />
        <h2>新規登録</h2>
        <input
          type="text"
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="パスワード（6文字以上）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="パスワード（確認用）"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
        <button onClick={handleSignup}>登録</button>
        <p style={{ marginTop: '10px' }}>
          すでにアカウントをお持ちですか？{' '}
          <span
            style={{ color: 'blue', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            ログイン
          </span>
        </p>
      </div>
    </div>
  );
}

export default SignupForm;
