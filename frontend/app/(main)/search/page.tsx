'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useMusicStore } from '@/stores/musicStore';
import { Search, Loader2 } from 'lucide-react';
import { Song } from '@/types';

const QUICK_TAGS = [
  '🔥 Trending', '💜 V-Pop', '🎸 Rock',
  '🎹 Piano', '😌 Lofi', '💪 Workout',
  '🌙 Chill', '🎉 Party',
];

export default function SearchPage() {
  const { playSong, currentSong, isPlaying, fetchYoutubeId } = usePlayerStore();
  const {
    searchResults,
    isSearching,
    searchSongs,
    isLiked,
    likeSong,
    unlikeSong,
    playlists,
    addSongToPlaylist,
    addToRecentlyPlayed,
  } = useMusicStore();

  const [query, setQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    song: Song; x: number; y: number;
  } | null>(null);

  // ref để focus input khi vào trang
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input khi vào trang
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchSongs(query.trim());
      }
    }, 500);

    // cleanup: hủy timer cũ nếu user tiếp tục gõ
    return () => clearTimeout(timer);
  }, [query]);

  const handlePlay = async (song: Song) => {
    playSong(song, searchResults);
    addToRecentlyPlayed(song);

    if (!song.preview_url && !song.youtubeId) {
        await fetchYoutubeId(song);
    }
  };

  // Xóa emoji trước khi search
  const handleQuickTag = (tag: string) => {
    const cleanQuery = tag.replace(/^\S+\s/, '');
    setQuery(cleanQuery);
    inputRef.current?.focus();
  };

  const formatDuration = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const hasQuery = query.trim().length > 0;
  const hasResults = searchResults.length > 0;
  const isEmpty = hasQuery && !isSearching && !hasResults;

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="greeting">
          <h1>Tìm kiếm</h1>
          <p>Tìm bài hát, nghệ sĩ, album...</p>
        </div>
      </div>

      <div className="page-content">

        {/* ── SEARCH BAR ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '14px 18px',
          marginBottom: '20px',
          transition: 'border-color 0.2s',
        }}>
          {/* icon loading khi đang search */}
          {isSearching
            ? <Loader2 size={20} style={{ opacity: 0.4, flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            : <Search size={20} style={{ opacity: 0.4, flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            type="text"
            placeholder="Nhập tên bài hát, nghệ sĩ..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            // bấm Escape xóa query, focus lại input
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setQuery('');
                inputRef.current?.focus();
              }
            }}
            style={{
              flex: 1, background: 'none', border: 'none',
              outline: 'none', fontSize: '16px', color: 'var(--text)',
            }}
          />
          {/* nút X để xóa query nhanh */}
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text2)', cursor: 'pointer',
                fontSize: '18px', lineHeight: 1, padding: '0 2px',
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* QUICK TAGS */}
        {!hasQuery && (
          <div style={{ marginBottom: '28px' }}>
            <div className="sec-title">✦ Khám phá nhanh</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleQuickTag(tag)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(var(--rgb),0.12)';
                    e.currentTarget.style.borderColor = 'rgba(var(--rgb),0.4)';
                    e.currentTarget.style.color = 'var(--accent2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text)';
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KẾT QUẢ TÌM KIẾM */}
        {hasResults && (
          <>
            <div className="sec-title">
              🔍 Kết quả cho "{query}"
              <span style={{
                fontSize: '13px', color: 'var(--text2)',
                fontWeight: 400, marginLeft: '8px',
              }}>
                {searchResults.length} bài
              </span>
            </div>

            <div className="song-list">
              {searchResults.map((song, i) => {
                const isCurrent = currentSong?.spotifyId === song.spotifyId;
                const liked = isLiked(song.spotifyId);

                return (
                  <div
                    key={song.spotifyId}
                    className={`song-row ${isCurrent ? 'playing' : ''}`}
                    onClick={() => handlePlay(song)}
                  >
                    {/* số thứ tự / animation bars khi đang phát */}
                    <div className="song-num">
                      {isCurrent && isPlaying ? (
                        <div className="playing-bars">
                          <div className="bar" />
                          <div className="bar" />
                          <div className="bar" />
                        </div>
                      ) : i + 1}
                    </div>

                    {/* ảnh album */}
                    <div className="song-thumb">
                      {song.image_url
                        ? <img src={song.image_url} alt={song.title} />
                        : '🎵'}
                    </div>

                    {/* tên bài + nghệ sĩ */}
                    <div className="song-info">
                      <div className="title">{song.title}</div>
                      <div className="artist">{song.artist} · {song.album}</div>
                    </div>

                    {/* thời lượng */}
                    <div className="song-dur">{formatDuration(song.duration_ms)}</div>

                    {/* nút like */}
                    <button
                      className={`song-like ${liked ? 'liked' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        liked ? unlikeSong(song.spotifyId) : likeSong(song);
                      }}
                    >
                      {liked ? '❤️' : '🤍'}
                    </button>

                    {/* nút thêm vào playlist */}
                    <button
                      className="song-like"
                      style={{ fontSize: '18px', color: 'var(--text2)' }}
                      onClick={e => {
                        e.stopPropagation();
                        setContextMenu({ song, x: e.clientX, y: e.clientY });
                      }}
                    >
                      ...
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TRỐNG */}
        {isEmpty && (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--text2)',
          }}>
            <Search size={44} style={{ opacity: 0.15, marginBottom: '16px' }} />
            <p style={{
              fontSize: '16px', fontWeight: 600,
              color: 'var(--text)', marginBottom: '6px',
            }}>
              Không tìm thấy "{query}"
            </p>
            <p style={{ fontSize: '13px' }}>Thử tên khác hoặc tìm bằng tiếng Anh nhé</p>
          </div>
        )}

        {/* PLACEHOLDER */}
        {!hasQuery && !hasResults && (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: 'var(--text2)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>🎵</div>
            <p style={{ fontSize: '14px' }}>Gõ tên bài hát hoặc chọn tag ở trên</p>
          </div>
        )}

      </div>

      {/* ── CONTEXT MENU thêm vào playlist ── */}
      {contextMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 500 }}
          onClick={() => setContextMenu(null)}
        >
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: Math.min(contextMenu.x, window.innerWidth - 220),
              background: 'var(--surface)',
              border: '1px solid var(--border2)',
              borderRadius: '12px',
              padding: '6px',
              minWidth: '200px',
              zIndex: 501,
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
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
            ) : playlists.map(pl => (
              <div
                key={pl.id}
                onClick={() => {
                  addSongToPlaylist(pl.id, contextMenu.song);
                  setContextMenu(null);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '8px',
                  cursor: 'pointer', transition: 'background 0.15s',
                  fontSize: '13px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '6px',
                  background: 'var(--surface2)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                }}>
                  {pl.image_url
                    ? <img src={pl.image_url} alt={pl.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🎵'}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{pl.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '1px' }}>
                    {pl.song?.length || 0} bài
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}