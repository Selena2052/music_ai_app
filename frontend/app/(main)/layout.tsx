'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/layout/Sidebar';
import PlayerBar from '@/components/player/PlayerBar';
import NowPlaying from '@/components/player/NowPlaying';
import dynamic from 'next/dynamic';
import { useMusicStore } from '@/stores/musicStore';
import BottomNav from '@/components/layout/BottomNav';

const AudioPlayer = dynamic(
    () => import('@/components/player/AudioPlayer'),
    { ssr: false } // chỉ chạy trên browser, không chạy trên server
);

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { loadLibrary } = useMusicStore();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadLibrary();
        }
    }, [isAuthenticated]);

    // đợi localStorage load xong mới check auth
    useEffect(() => {
        setHydrated(true);
    }, []);
    // bảo vệ route: chưa đăng nhập → redirect về login
    useEffect(() => {
        if (!isAuthenticated && hydrated) {
            router.push('login');
        }
    }, [isAuthenticated, router, hydrated]);

    if (!hydrated) return null;
    if (!isAuthenticated) return null;

    return (
        <div className='app-layout'>
            {/* Sidebar cố định bên trái */}
            <Sidebar />

            {/* Nội dung chính thay đổi theo từng trang */}
            <main className='main-content'>
                {children}
            </main>

            {/* Player bar cố định ở dưới */}
            <PlayerBar />

            {/* Now Playing full screen, hiện khi toggle */}
            <NowPlaying />
            <AudioPlayer />
             <BottomNav />
        </div>
    );
}