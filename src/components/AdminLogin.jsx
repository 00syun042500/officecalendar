import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './LoginForm.css';
import logo from '../assets/logo.jpg';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Firestoreから権限を取得
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setErrorMsg('ユーザー情報が見つかりません');
        return;
      }
      const userData = querySnapshot.docs[0].data();
      console.log('userRole:', JSON.stringify(userData.role)); // ←デバッグ用
      const userRole = (userData.role || '').replace(/\\s/g, '').replace(/　/g, '').trim();
      if (userRole === 'オーナー' || userRole === 'マネージャー') {
        navigate('/admin/dashboard');
      } else {
        alert('ログイン権限がありません');
        // ログイン状態を解除
        auth.signOut();
      }
    } catch (error) {
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
    <div
      className="login-container"
      style={{
        backgroundImage: "url('/admin-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="login-box">
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1976d2', letterSpacing: '0.08em', marginBottom: 12, textAlign: 'center', fontFamily: 'Segoe UI, sans-serif', lineHeight: 1.3 }}>
          管理者専用<br />社内施設予約管理システム
        </div>
        <img src={logo} alt="Sales synergy logo" className="logo" />
        <h2>管理者ログイン</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {errorMsg && <div style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</div>}
          <button type="submit">ログイン</button>
        </form>
        <div style={{ marginTop: 16, color: '#888', fontSize: 14 }}>※管理者以外はご利用できません</div>
        <div className="text-center mt-4">
          <Link to="/login" className="text-blue-500 hover:underline">
            一般ユーザーの方はこちら
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 