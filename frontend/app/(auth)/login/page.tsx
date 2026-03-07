'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false); 
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { email, username, password }
        : { email, password };
      const response = await api.post(endpoint, payload);
      login(response.data.user, response.data.token);
      router.push('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',       
        borderRadius: '24px',
        padding: '40px',
        width: '400px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)', 
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', 
            height: '56px',
            borderRadius: '16px',
            background: 'var(--grad)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '26px',
            margin: '0 auto 12px',
          }}>🎵</div>
          <div style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 800, 
            fontSize: '24px',
            background: 'var(--grad)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>MusicAI</div>
          <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '4px' }}> 
            {isRegister ? 'Tạo tài khoản mới' : 'Chào mừng trở lại'}
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className="modal-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {isRegister && (
            <input
              className="modal-input"
              type="text"
              placeholder="Tên người dùng"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
          <input
            className="modal-input"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          {error && (
            <div style={{ fontSize: '13px', color: '#ff5c5c', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>
          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text2)' }}>
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            {' '}
            <span
              onClick={() => { setIsRegister(!isRegister); setError(''); }} 
              style={{ color: 'var(--accent2)', cursor: 'pointer', fontWeight: 500 }}
            >
              {isRegister ? 'Đăng nhập' : 'Đăng ký'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}