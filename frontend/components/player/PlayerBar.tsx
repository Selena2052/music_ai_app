'use client';

import { useState } from 'react';
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

  const { isLiked, likeSong, unlikeSong, playlists, addSongToPlaylist } = useMusicStore();
  const { currentMood } = useAiStore();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

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

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
            style={{
              background: 'none', border: 'none', color: 'var(--text2)',
              cursor: 'pointer', fontSize: '18px', padding: '4px 6px',
              transition: 'color 0.2s',
            }}
            title="Thêm vào playlist"
          >
            ⋯
          </button>

          {showPlaylistMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 500 }}
                onClick={() => setShowPlaylistMenu(false)}
              />
              <div style={{
                position: 'absolute', bottom: '40px', left: '0',
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                borderRadius: '12px', padding: '6px',
                minWidth: '200px', zIndex: 501,
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: 600, color: 'var(--text2)',
                  letterSpacing: '1px', textTransform: 'uppercase',
                  padding: '6px 10px 8px',
                }}>
                  Thêm vào playlist
                </div>
                {playlists.length === 0 ? (
                  <div style={{ padding: '8px 10px', fontSize: '13px', color: 'var(--text2)' }}>
                    Chưa có playlist nào
                  </div>
                ) : (
                  playlists.map(pl => (
                    <div
                      key={pl.id}
                      onClick={() => { addSongToPlaylist(pl.id, currentSong); setShowPlaylistMenu(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 10px', borderRadius: '8px',
                        cursor: 'pointer', transition: 'background 0.15s', fontSize: '13px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '6px',
                        background: 'var(--surface2)', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', flexShrink: 0,
                      }}>
                        {pl.image_url
                          ? <img src={pl.image_url} alt={pl.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '🎵'}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pl.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '1px' }}>
                          {pl.song?.length || 0} bài
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* GIỮA: controls + progress */}
      <div className="pb-center">
        <div className="pb-btns">
          {/* shuffle */}
          <button
            className="pb-ctrl"
            onClick={toggleShuffle}
            title="Shuffle"
            style={{ color: isShuffled ? 'var(--accent2)' : undefined }}
          >
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
          <button
            className="pb-ctrl"
            onClick={toggleRepeat}
            title="Lặp lại"
            style={{ color: repeatMode !== 'none' ? 'var(--accent2)' : undefined }}
          >
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