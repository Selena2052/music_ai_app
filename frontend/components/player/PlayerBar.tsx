'use client';

import { usePlayerStore } from '@/stores/playerStore';
import { useMusicStore } from '@/stores/musicStore';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, Sparkles
} from 'lucide-react';
import { useAiStore } from '@/stores/aiStore';

export default function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    isShuffled,
    repeatMode,
    volume,
    currentTime,
    duration,
    pauseSong,
    resumeSong,
    nextSong,
    prevSong,
    setVolume,
    setCurrentTime,
    toggleShuffle,
    toggleRepeat,
    toggleNowPlaying,
  } = usePlayerStore();

  const { isLiked, likeSong, unlikeSong } = useMusicStore();
  const { currentMood } = useAiStore();

  // nếu không có bài đang phát → ẩn player
  if (!currentSong) return null;

  // chuyển milliseconds → mm:ss
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // tính % tiến trình để render thanh progress
  const progressPercent = duration > 0
    ? (currentTime / duration) * 100
    : 0;

  const liked = isLiked(currentSong.spotifyId);

  return (
    <div className="player-bar">
      {/* TRÁI: thông tin bài hát */}
      <div className="pb-track">
        <div className="pb-thumb" onClick={toggleNowPlaying}>
          {currentSong.image_url ? (
            <img
              src={currentSong.image_url}
              alt={currentSong.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
            />
          ) : (
            '🎵'
          )}
        </div>
        <div className="pb-info">
          <div className="title" onClick={toggleNowPlaying}>
            {currentSong.title}
          </div>
          <div className="artist">{currentSong.artist}</div>
        </div>
        {/* nút like */}
        <button
          className="pb-heart"
          onClick={() =>
            liked
              ? unlikeSong(currentSong.spotifyId)
              : likeSong(currentSong)
          }
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          {liked ? '❤️' : '🤍'}
        </button>
      </div>

      {/* GIỮA: controls + progress */}
      <div className="pb-center">
        <div className="pb-btns">
          {/* shuffle */}
          <button className="pb-ctrl" onClick={toggleShuffle} title="Shuffle">
            <Shuffle size={16} />
          </button>

          {/* prev */}
          <button className="pb-ctrl" onClick={prevSong} title="Bài trước">
            <SkipBack size={18} />
          </button>

          {/* play/pause */}
          <button className="pb-play" onClick={isPlaying ? pauseSong : resumeSong} title={isPlaying ? 'Dừng' : 'Phát'}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* next */}
          <button className="pb-ctrl" onClick={nextSong} title="Bài tiếp">
            <SkipForward size={18} />
          </button>

          {/* repeat */}
          <button className="pb-ctrl" onClick={toggleRepeat} title="Lặp lại">
            {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* progress bar */}
        <div className="pb-progress">
          <span>{formatTime(currentTime)}</span>
          <div
            className="pb-track-bar"
            onClick={(e) => {
              // tính vị trí click → seek đến đúng chỗ
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percent = clickX / rect.width;
              setCurrentTime(percent * duration);
            }}
          >
            <div
              className="pb-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* PHẢI: AI + volume */}
      <div className="pb-right">
        {/* nút Hỏi AI + hiển thị mood nếu có */}
        <div className="ai-pill" onClick={toggleNowPlaying}>
          <Sparkles size={14} />
          {currentMood ? currentMood.mood : 'Hỏi AI'}
        </div>

        {/* volume */}
        <div className="vol-wrap">
          <Volume2 size={16} className="vol-icon" />
          <div
            className="vol-bar"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              setVolume(clickX / rect.width);
            }}
          >
            <div
              className="vol-fill"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}