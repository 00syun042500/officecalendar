import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import './LoginForm.css'; // ← CSS 適用
import logo from '../assets/logo.jpg';

function LoginForm({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home'); // ホーム画面に遷移
    } catch (error) {
      // Firebaseのエラーコードで分岐
      if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found') {
        setErrorMsg('メールアドレスが正しくありません。');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMsg('パスワードが正しくありません。');
      } else if (error.code === 'auth/invalid-credential') {
        setErrorMsg('メールアドレス・パスワードが正しくありません。');
      } else {
        setErrorMsg('ログインに失敗しました。');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1976d2', letterSpacing: '0.08em', marginBottom: 12, textAlign: 'center', fontFamily: 'Segoe UI, sans-serif', lineHeight: 1.3 }}>
          社内向け<br />社内施設予約管理システム
        </div>
        <img src={logo} alt="Sales synergy logo" className="logo" />
        <h2>ログイン</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorMsg && <div style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</div>}
          <button type="submit">ログイン</button>
        </form>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Link 
            to="/reset-password" 
            style={{ 
              color: '#666', 
              textDecoration: 'none',
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginBottom: 4
            }}
          >
            パスワードをお忘れですか？
          </Link>
          <p style={{ margin: 0 }}>
            アカウントをお持ちでない方は{' '}
            <span
              style={{ color: 'blue', cursor: 'pointer' }}
              onClick={() => navigate('/signup')}
            >
              新規登録
            </span>
          </p>
        </div>
        <div className="text-center mt-4">
          <Link to="/admin/login" className="text-blue-500 hover:underline">
            管理者の方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
