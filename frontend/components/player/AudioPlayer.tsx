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

  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    setCurrentTime,
    setDuration,
    nextSong,
  } = usePlayerStore();

  const getSource = () => {
    if (currentSong?.preview_url) return 'preview';
    if (currentSong?.youtubeId) return 'youtube';
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
      window.onYouTubeIframeAPIReady = () => initYoutubePlayer();
    }

    return () => {
      // cleanup khi unmount
      const el = document.getElementById(ytDivId);
      if (el) el.innerHTML = '';
    };
  }, []);

  const initYoutubePlayer = () => {
    const container = document.getElementById(ytDivId);
    if (!container || ytPlayerRef.current) return;

    ytPlayerRef.current = new window.YT.Player(ytDivId, {
      height: '0',
      width: '0',
      playerVars: { autoplay: 1, controls: 0, rel: 0 },
      events: {
        onReady: (e: any) => e.target.setVolume(volume * 100),
        onStateChange: (e: any) => {
          if (e.data === 0) nextSong();
        },
      },
    });
  };

  // phát khi đổi bài
  useEffect(() => {
    if (!currentSong) return;
    const source = getSource();

console.log('🎵 currentSong:', currentSong.title);
  console.log('🔗 preview_url:', currentSong.preview_url);
  console.log('📺 youtubeId:', currentSong.youtubeId);
  console.log('🎯 source:', source);

    if (source === 'preview') {
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
      }

      htmlAudioRef.current.src = currentSong.preview_url!;
      htmlAudioRef.current.volume = volume;
      htmlAudioRef.current.play().catch(console.warn);

    } else if (source === 'youtube') {
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.currentTime = 0;
      }

      if (!ytPlayerRef.current) {
        if (window.YT?.Player) {
          initYoutubePlayer();
          setTimeout(() => ytPlayerRef.current?.loadVideoById(currentSong.youtubeId), 500);
        } else {
          window.onYouTubeIframeAPIReady = () => {
            initYoutubePlayer();
            setTimeout(() => ytPlayerRef.current?.loadVideoById(currentSong.youtubeId), 500);
          };
        }
        return;
      }
      ytPlayerRef.current.loadVideoById(currentSong.youtubeId);
    }
  }, [currentSong?.spotifyId]);

  // play / pause
  useEffect(() => {
    const source = getSource();
    if (source === 'preview') {
      if (isPlaying) htmlAudioRef.current?.play().catch(console.warn);
      else htmlAudioRef.current?.pause();
    } else if (source === 'youtube') {
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
      if (getSource() !== 'youtube' || !ytPlayerRef.current) return;
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