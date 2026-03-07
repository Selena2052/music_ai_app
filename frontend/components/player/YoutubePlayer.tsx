'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YoutubePlayer() {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    setCurrentTime,
    setDuration,
    nextSong,
  } = usePlayerStore();

  // load YouTube IFrame API 1 lần duy nhất
  useEffect(() => {
    if (window.YT) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };
  }, []);

  const initPlayer = () => {
    if (!containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
      },
      events: {
        onReady: (e: any) => {
          e.target.setVolume(volume * 100);
        },
        onStateChange: (e: any) => {
          // 0 = ended → phát bài tiếp
          if (e.data === 0) nextSong();
        },
      },
    });
  };

  // load bài mới khi currentSong thay đổi
  useEffect(() => {
    if (!currentSong?.youtubeId) return;

    if (!playerRef.current) {
      // API chưa load xong → đợi rồi init
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
        setTimeout(() => {
          playerRef.current?.loadVideoById(currentSong.youtubeId);
        }, 500);
      };
      return;
    }

    playerRef.current.loadVideoById(currentSong.youtubeId);
  }, [currentSong?.youtubeId]);

  // play / pause
  useEffect(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  // volume
  useEffect(() => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(volume * 100);
  }, [volume]);

  // cập nhật currentTime mỗi giây
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current) return;
      const state = playerRef.current.getPlayerState?.();
      if (state === 1) { // 1 = playing
        const current = playerRef.current.getCurrentTime() * 1000;
        const total = playerRef.current.getDuration() * 1000;
        setCurrentTime(current);
        setDuration(total);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // seek khi user kéo progress bar
  useEffect(() => {
    if (!playerRef.current) return;
    const playerTime = playerRef.current.getCurrentTime?.() * 1000;
    // chỉ seek nếu chênh lệch > 2 giây (tránh loop)
    if (Math.abs(playerTime - currentTime) > 2000) {
      playerRef.current.seekTo(currentTime / 1000);
    }
  }, [currentTime]);

  // ẩn hoàn toàn, chỉ là audio engine
  return <div ref={containerRef} style={{ display: 'none' }} />;
}