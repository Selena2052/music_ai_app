'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMusicStore } from "@/stores/musicStore";
import { usePlayerStore } from "@/stores/playerStore";
import { Song, Playlist } from '@/types';
import {
    Heart, Clock, ListMusic, Play, Trash2,
    Plus, Music2, ChevronLeft, Shuffle
} from 'lucide-react';

type Tab = 'liked' | 'playlists' | 'recent';

export default function LibraryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const {
        likedSongs, playlists, recentlyPlayed,
        unlikeSong, createPlaylist, addSongToPlaylist, removeSongFromPlaylist,
        isLiked
    } = useMusicStore();

    const { playSong, currentSong, isPlaying, fetchYoutubeId } = usePlayerStore();

    const [activeTab, setActiveTab] = useState<Tab>('liked');
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    useEffect(() => {
        const playlistId = searchParams.get('playlist');
        if (playlistId) {
            const found = playlists.find(p => p.id === playlistId);
            if (found) {
                setSelectedPlaylist(found);
                setActiveTab('playlists');
            }
        }
    }, [searchParams, playlists]);

    useEffect(() => {
        if (selectedPlaylist) {
            const updated = playlists.find(p => p.id === selectedPlaylist.id);
            if (updated) setSelectedPlaylist(updated);
        }
    }, [playlists]);

    const formatDuration = (ms: number) => {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const formatTotalDuration = (songs: Song[]) => {
        const total = songs.reduce((sum, s) => sum + Number(s.duration_ms), 0);
        const hours = Math.floor(total / 3600000);
        const mins = Math.floor((total % 3600000) / 60000);
        if (hours > 0) return `${hours} giờ ${mins} phút`;
        return `${mins} phút`;
    };

    const handlePlaySong = async (song: Song, queue: Song[]) => {
        playSong(song, queue);
        if (!song.preview_url && !song.youtubeId) {
            await fetchYoutubeId(song);
        }
    };

    const handleShufflePlay = (songs: Song[]) => {
        if (!songs.length) return;
        const shuffled = [...songs].sort(() => Math.random() - 0.5);
        handlePlaySong(shuffled[0], shuffled);
    };

    const handleCreatePlaylist = () => {
        if (!newPlaylistName.trim()) return;
        createPlaylist(newPlaylistName.trim());
        setNewPlaylistName('');
        setShowCreateModal(false);
    };

    const SongRow = ({
        song, index, queue, onRemove
    }: {
        song: Song;
        index: number;
        queue: Song[];
        onRemove?: () => void;
    }) => {
        const isCurrent = currentSong?.spotifyId === song.spotifyId;
        return (
            <div
                className={`song-row ${isCurrent ? 'playing' : ''}`}
                onClick={() => handlePlaySong(song, queue)}
            >
                <div className="song-num">
                    {isCurrent && isPlaying ? (
                        <div className="playing-bars">
                            <div className="bar" /><div className="bar" /><div className="bar" />
                        </div>
                    ) : index + 1}
                </div>
                <div className="song-thumb">
                    {song.image_url ? <img src={song.image_url} alt={song.title} /> : '🎵'}
                </div>
                <div className="song-info">
                    <div className="title">{song.title}</div>
                    <div className="artist">{song.artist} · {song.album}</div>
                </div>
                <div className="song-dur">{formatDuration(song.duration_ms)}</div>
                {onRemove ? (
                    <button
                        className="song-like"
                        style={{ opacity: 1, fontSize: '14px' }}
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        title="Xóa"
                    >
                        <Trash2 size={14} style={{ color: 'var(--text2)' }} />
                    </button>
                ) : (
                    <div className="song-like" style={{ fontSize: '14px' }}>
                        {isLiked(song.spotifyId) ? '❤️' : ''}
                    </div>
                )}
            </div>
        );
    };

    // PLAYLIST DETAIL VIEW
    if (selectedPlaylist) {
    const songs = selectedPlaylist.song || [];
    return (
      <div className="main-content">
        <div className="page-header">
          <button
            onClick={() => { setSelectedPlaylist(null); router.push('/library'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: 'var(--text2)',
              cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s',
              padding: '4px 0',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}
          >
            <ChevronLeft size={18} /> Thư viện
          </button>
        </div>

        <div className="page-content">
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '28px',
            marginBottom: '32px', paddingBottom: '28px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: '160px', height: '160px', flexShrink: 0,
              borderRadius: '16px', overflow: 'hidden',
              background: 'var(--surface2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '52px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            }}>
              {selectedPlaylist.image_url
                ? <img src={selectedPlaylist.image_url} alt={selectedPlaylist.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🎵'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '11px', color: 'var(--text2)', fontWeight: 600,
                letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px'
              }}>
                PLAYLIST
              </div>
              <h1 style={{
                fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px',
                marginBottom: '8px', lineHeight: 1.1
              }}>
                {selectedPlaylist.name}
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
                {songs.length} bài · {songs.length > 0 ? formatTotalDuration(songs) : '—'}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {songs.length > 0 && (
                  <>
                    <button
                      onClick={() => handlePlaySong(songs[0], songs)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '11px 24px', borderRadius: '100px',
                        background: 'white', border: 'none',
                        color: '#0a0a0f', fontWeight: 700, fontSize: '14px',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <Play size={16} fill="#0a0a0f" /> Phát
                    </button>
                    <button
                      onClick={() => handleShufflePlay(songs)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '11px 20px', borderRadius: '100px',
                        background: 'rgba(var(--rgb),0.12)',
                        border: '1px solid rgba(var(--rgb),0.3)',
                        color: 'var(--accent2)', fontWeight: 600, fontSize: '14px',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <Shuffle size={15} /> Ngẫu nhiên
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {songs.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              color: 'var(--text2)', fontSize: '14px',
            }}>
              <Music2 size={40} style={{ opacity: 0.2, marginBottom: '14px' }} />
              <p>Playlist chưa có bài nào</p>
              <p style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>
                Like bài hát trên trang chủ để thêm vào đây
              </p>
            </div>
          ) : (
            <div className="song-list">
              {songs.map((song, i) => (
                <SongRow
                  key={song.spotifyId}
                  song={song}
                  index={i}
                  queue={songs}
                  onRemove={() => removeSongFromPlaylist(selectedPlaylist.id, song.spotifyId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MAIN LIBRARY VIEW
  const tabs = [
    { key: 'liked' as Tab,     icon: <Heart size={15} />,     label: 'Đã thích', count: likedSongs.length },
    { key: 'playlists' as Tab, icon: <ListMusic size={15} />, label: 'Playlist', count: playlists.length },
    { key: 'recent' as Tab,    icon: <Clock size={15} />,     label: 'Gần đây',  count: recentlyPlayed.length },
  ];

   return (
    <div className="main-content">
      <div className="page-header">
        <div className="greeting">
          <h1>Thư viện</h1>
          <p>Nhạc của bạn, mọi lúc mọi nơi</p>
        </div>
      </div>

      <div className="page-content">
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '6px',
          marginBottom: '22px', marginTop: '4px',
          borderBottom: '1px solid var(--border)',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 16px',
                background: 'none', border: 'none',
                borderBottom: activeTab === tab.key
                  ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--text)' : 'var(--text2)',
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: '14px', cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-1px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {tab.icon}
              {tab.label}
              <span style={{
                background: activeTab === tab.key
                  ? 'rgba(var(--rgb),0.2)' : 'var(--surface2)',
                color: activeTab === tab.key ? 'var(--accent2)' : 'var(--text3)',
                fontSize: '11px', fontWeight: 600,
                padding: '1px 7px', borderRadius: '100px',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tab: Đã thích */}
        {activeTab === 'liked' && (
          <>
            {likedSongs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text2)' }}>
                <Heart size={44} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
                  Chưa có bài hát yêu thích
                </p>
                <p style={{ fontSize: '13px', opacity: 0.7 }}>
                  Nhấn ❤️ khi nghe nhạc để lưu vào đây
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  marginBottom: '20px', padding: '18px 22px',
                  background: 'linear-gradient(135deg, rgba(var(--rgb),0.1), rgba(var(--rgb),0.03))',
                  border: '1px solid rgba(var(--rgb),0.15)',
                  borderRadius: '14px',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'var(--grad)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0,
                  }}>❤️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>Bài hát đã thích</div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>
                      {likedSongs.length} bài · {formatTotalDuration(likedSongs)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleShufflePlay(likedSongs)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '9px 18px', borderRadius: '100px',
                      background: 'rgba(var(--rgb),0.15)',
                      border: '1px solid rgba(var(--rgb),0.3)',
                      color: 'var(--accent2)', fontWeight: 600, fontSize: '13px',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <Shuffle size={14} /> Phát ngẫu nhiên
                  </button>
                </div>
                <div className="song-list">
                  {likedSongs.map((song, i) => (
                    <SongRow
                      key={song.spotifyId}
                      song={song} index={i}
                      queue={likedSongs}
                      onRemove={() => unlikeSong(song.spotifyId)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Tab: Playlist */}
        {activeTab === 'playlists' && (
          <>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '14px 16px',
                background: 'var(--surface)',
                border: '1px dashed rgba(var(--rgb),0.3)',
                borderRadius: '12px', color: 'var(--accent2)',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s', marginBottom: '14px',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(var(--rgb),0.08)';
                e.currentTarget.style.borderColor = 'rgba(var(--rgb),0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.borderColor = 'rgba(var(--rgb),0.3)';
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(var(--rgb),0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={18} />
              </div>
              Tạo playlist mới
            </button>

            {playlists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
                <ListMusic size={44} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
                  Chưa có playlist nào
                </p>
                <p style={{ fontSize: '13px', opacity: 0.7 }}>Tạo playlist đầu tiên của bạn</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '14px'
              }}>
                {playlists.map(pl => {
                  const songs = pl.song || [];
                  return (
                    <div
                      key={pl.id}
                      onClick={() => setSelectedPlaylist(pl)}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px', padding: '14px',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--surface2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'rgba(var(--rgb),0.25)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--surface)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <div style={{
                        width: '100%', aspectRatio: '1',
                        borderRadius: '10px', overflow: 'hidden',
                        background: 'var(--surface2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', marginBottom: '12px',
                      }}>
                        {pl.image_url
                          ? <img src={pl.image_url} alt={pl.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '🎵'}
                      </div>
                      <div style={{
                        fontWeight: 600, fontSize: '14px', marginBottom: '3px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {pl.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                        {songs.length} bài
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tab: Gần đây */}
        {activeTab === 'recent' && (
          <>
            {recentlyPlayed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text2)' }}>
                <Clock size={44} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
                  Chưa có lịch sử nghe
                </p>
                <p style={{ fontSize: '13px', opacity: 0.7 }}>
                  Phát nhạc để ghi lại lịch sử
                </p>
              </div>
            ) : (
              <div className="song-list">
                {recentlyPlayed.map((song, i) => (
                  <SongRow
                    key={`${song.spotifyId}-${i}`}
                    song={song} index={i}
                    queue={recentlyPlayed}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal tạo playlist */}
      {showCreateModal && (
        <div className="modal-backdrop show" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Tạo Playlist mới</div>
            <input
              className="modal-input"
              type="text"
              placeholder="Tên playlist..."
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
              autoFocus
            />
            <div className="modal-btns">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleCreatePlaylist}>Tạo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}