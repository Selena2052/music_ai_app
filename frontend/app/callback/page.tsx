'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlayerStore } from '@/stores/playerStore';

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSpotifyToken } = usePlayerStore();

  useEffect(() => {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');

    if (accessToken) {
      setSpotifyToken(accessToken);

      // tự động refresh trước khi hết hạn 60 giây
      const expiresMs = (Number(expiresIn) - 60) * 1000;
      setTimeout(async () => {
        if (!refreshToken) return;
        try {
          const res = await fetch(
            `http://localhost:3001/api/auth/spotify/refresh?refresh_token=${refreshToken}`
          );
          const data = await res.json();
          if (data.access_token) setSpotifyToken(data.access_token);
        } catch (err) {
          console.error('Refresh token failed:', err);
        }
      }, expiresMs);
    }

    // redirect về home
    router.push('/home');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎵</div>
        <div style={{ fontSize: '16px' }}>Đang kết nối Spotify...</div>
      </div>
    </div>
  );
}

// useSearchParams cần Suspense wrapper trong NextJS
export default function CallbackPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0a0a0f', minHeight: '100vh' }} />}>
      <CallbackContent />
    </Suspense>
  );
}