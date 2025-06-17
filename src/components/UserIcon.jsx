import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';

function UserIcon() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Firebase Authの状態を監視
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  if (!user) return null; // 未ログイン時は何も表示しない

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {user.photoURL ? (
        <img src={user.photoURL} alt="user" style={{ width: 32, height: 32, borderRadius: '50%' }} />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#eee',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
        }}>
          {user.displayName ? user.displayName[0] : 'U'}
        </div>
      )}
      <span style={{ fontSize: 14 }}>{user.displayName || user.email}</span>
    </div>
  );
}

export default UserIcon;
