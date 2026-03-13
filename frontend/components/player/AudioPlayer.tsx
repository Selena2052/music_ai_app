'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function AudioPlayer() {
  const ytPlayerRef = useRef<any>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const ytDivId = 'yt-player-container'; // ID cố định, không dùng ref
  const ytReadyRef = useRef(false);

  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    setCurrentTime,
    setDuration,
    nextSong,
    pauseSong,
  } = usePlayerStore();

  const currentSongRef = useRef(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const getSource = () => {
    const song = currentSongRef.current;
    if (song?.preview_url) return 'preview';
    if (song?.youtubeId) return 'youtube';
    return null;
  };

  // tạo div cho YouTube bên ngoài React tree
  useEffect(() => {
    let container = document.getElementById(ytDivId);
    if (!container) {
      container = document.createElement('div');
      container.id = ytDivId;
      container.style.display = 'none';
      document.body.appendChild(container); // append vào body, không vào React tree
    }

    // load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        initYoutubePlayer();
      };
    } else if (window.YT.Player && !ytPlayerRef.current) {
      // YT API đã load rồi (hot reload)
      initYoutubePlayer();
    }

    return () => {
      // cleanup khi unmount
      const el = document.getElementById(ytDivId);
      if (el) el.innerHTML = '';
      ytReadyRef.current = false;
    };
  }, []);

  const initYoutubePlayer = () => {
  if (ytPlayerRef.current) return;
  const container = document.getElementById(ytDivId);
  if (!container) return;

  ytPlayerRef.current = new window.YT.Player(ytDivId, {
    height: '0',
    width: '0',
    playerVars: { autoplay: 1, controls: 0, rel: 0 },
    events: {
      onReady: (e: any) => {
        e.target.setVolume(volume * 100);
        ytReadyRef.current = true;

        // YouTube vừa ready - kiểm tra có bài đang chờ phát không
        const song = currentSongRef.current;
        const state = usePlayerStore.getState();
        if (song?.youtubeId && state.isPlaying) {
          // small delay để tránh autoplay policy block
          setTimeout(() => {
            ytPlayerRef.current?.loadVideoById(song.youtubeId);
          }, 300);
        }
      },
      onStateChange: (e: any) => {
        if (e.data === 0) nextSong();
      },
      onError: () => {
        nextSong();
      },
    },
  });
};

  // phát khi đổi bài
  useEffect(() => {
    if (!currentSong) return;
    const source = getSource();

    if (!source) {
      return;
    }
    //
    if (source === 'preview') {
      // dừng YouTube nếu đang phát
      ytPlayerRef.current?.stopVideo?.();

      if (!htmlAudioRef.current) {
        htmlAudioRef.current = new Audio();
        htmlAudioRef.current.addEventListener('ended', nextSong);
        htmlAudioRef.current.addEventListener('timeupdate', () => {
          setCurrentTime((htmlAudioRef.current!.currentTime) * 1000);
        });
        htmlAudioRef.current.addEventListener('loadedmetadata', () => {
          setDuration((htmlAudioRef.current!.duration) * 1000);
        });
        htmlAudioRef.current.addEventListener('error', (e) => {
          console.warn('Audio error:', e);
          nextSong();
        });
      }

      htmlAudioRef.current.src = currentSong.preview_url!;
      htmlAudioRef.current.volume = volume;
      // isPlaying đã là true khi playSong() được gọi → phát luôn
      htmlAudioRef.current.play().catch((err) => {
        console.warn('Preview play failed:', err);
      });

    } else if (source === 'youtube') {
      // dừng HTML audio nếu đang phát
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.currentTime = 0;
      }

      if (!ytReadyRef.current) {
        return;
      }

      ytPlayerRef.current.loadVideoById(currentSong.youtubeId);
    }
  }, [currentSong?.spotifyId, currentSong?.youtubeId]);

  // play / pause
  useEffect(() => {
    const source = getSource();
    if (!source) return;

    if (source === 'preview' && htmlAudioRef.current?.src) {
      if (isPlaying) htmlAudioRef.current.play().catch(console.warn);
      else htmlAudioRef.current.pause();
    } else if (source === 'youtube' && ytReadyRef.current) {
      if (isPlaying) ytPlayerRef.current?.playVideo?.();
      else ytPlayerRef.current?.pauseVideo?.();
    }
  }, [isPlaying]);

  // volume
  useEffect(() => {
    if (htmlAudioRef.current) htmlAudioRef.current.volume = volume;
    ytPlayerRef.current?.setVolume?.(volume * 100);
  }, [volume]);

  // seek
  useEffect(() => {
    const source = getSource();
    if (source === 'preview' && htmlAudioRef.current) {
      const diff = Math.abs(htmlAudioRef.current.currentTime * 1000 - currentTime);
      if (diff > 2000) htmlAudioRef.current.currentTime = currentTime / 1000;
    } else if (source === 'youtube' && ytPlayerRef.current) {
      const diff = Math.abs((ytPlayerRef.current.getCurrentTime?.() || 0) * 1000 - currentTime);
      if (diff > 2000) ytPlayerRef.current.seekTo?.(currentTime / 1000);
    }
  }, [currentTime]);

  // update progress YouTube
  useEffect(() => {
  const interval = setInterval(() => {
    if (!ytPlayerRef.current) return;
    const { currentSong } = usePlayerStore.getState();
    if (!currentSong?.youtubeId) return;
    if (ytPlayerRef.current.getPlayerState?.() === 1) {
      setCurrentTime(ytPlayerRef.current.getCurrentTime() * 1000);
      setDuration(ytPlayerRef.current.getDuration() * 1000);
    }
  }, 1000);
  return () => clearInterval(interval);
}, []);

  // không render gì vào React tree
  return null;
}