'use client' 

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useMusicStore } from "@/stores/musicStore";
import { useAiStore } from "@/stores/aiStore";
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

const MOOD_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#f97316'];
const MOOD_EMOJI: Record<string, string> = {
    vui: '😊', buồn: '😢', 'năng động': '💪',
    'thư giãn': '😌', 'tập trung': '🎯',
};

const GENRE_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#6b7280'];

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { likedSongs, playlists, recentlyPlayed } = useMusicStore();
    const { tasteResult, isAnalyzing, analyzeTaste } = useAiStore();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // state db
    const [stats, setStats] = useState({ totalSongs: 0, totalLiked: 0, totalPlaylists: 0 });
    const [topArtists, setTopArtists] = useState<{ artist: string; count: number }[]>([]);
    const [moodStats, setMoodStats] = useState<{ mood: string; pct: number }[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState(user?.username || '');
    const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
    const [avatarTab, setAvatarTab] = useState<'url' | 'upload'>('url');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await api.patch('/auth/profile', {
                username: editUsername,
                avatar: editAvatar,
            });
            // cập nhật lại authStore
            useAuthStore.getState().updateUser({
                username: res.data.username,
                avatar: res.data.avatar,
            });
            setIsEditing(false);
        } catch {
            alert('Lưu thất bại, thử lại nhé!');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                // load song state profile
                const profileRes = await api.get('/ai/taste-profile');
                if (profileRes.data) useAiStore.setState({ tasteResult: profileRes.data});
            } catch {};

            try {
                // load listening stats
                const statsRes = await api.get('/library/stats');
                setStats(statsRes.data);
            } catch {};

            try {
                // load top artists
                const artistRes = await api.get('/library/top-artists');
                setTopArtists(artistRes.data);
            } catch {};

            try {
                // load mood stats
                const moodRes = await api.get('/ai/mood-stats')
                setMoodStats(moodRes.data);
            } catch {};
        };
        load();
    }, []);

    const handleAnalyzeTaste = () => {
        const history = recentlyPlayed.slice(0, 20).map(s => ({
            title: s.title, artist: s.artist,
        }));
        if (!history.length) { alert('Hãy nghe thêm nhạc để AI phân tích'); return; }
        analyzeTaste(history);
    };

    const genres: { name: string; pct: number; color: string }[] = tasteResult?.favoriteGenres?.length
        ? tasteResult.favoriteGenres.slice(0, 5).map((g, i) => ({
            name: g,
            pct: Math.round(60 - i * 10),
            color: GENRE_COLORS[i] as string,
        }))
        : [];

    const avatarLetter = user?.username?.charAt(0).toUpperCase() || 'U';
    const estHours = Math.round((stats.totalSongs * 3.5) / 60 * 10) / 10;

    return (
    <div className="main-content">
      <div className="page-content" style={{ paddingTop: '24px' }}>

        {/* ── HERO ── */}
<div style={{ display: 'flex', alignItems: 'flex-end', gap: '28px', marginBottom: '28px' }}>
  
  {/* Avatar */}
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <div style={{
      width: '120px', height: '120px', borderRadius: '50%',
      background: user?.avatar ? 'transparent' : 'linear-gradient(135deg, #a855f7, #ec4899)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '48px', fontWeight: 700, color: 'white',
      boxShadow: '0 8px 32px rgba(168,85,247,0.4)',
      overflow: 'hidden',
    }}>
      {user?.avatar
        ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : avatarLetter}
    </div>
    {isEditing && (
      <button
        onClick={() => setAvatarTab(avatarTab === 'url' ? 'upload' : 'url')}
        style={{
          position: 'absolute', bottom: '4px', right: '4px',
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--border)',
          cursor: 'pointer', fontSize: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ✏️
      </button>
    )}
  </div>

  <div style={{ flex: 1 }}>
    <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
      HỒ SƠ CÁ NHÂN
    </div>

    {isEditing ? (
      <input
        value={editUsername}
        onChange={e => setEditUsername(e.target.value)}
        placeholder="Tên hiển thị..." 
        style={{
          fontSize: '28px', fontWeight: 800, background: 'none',
          border: 'none', borderBottom: '2px solid var(--accent)',
          color: 'var(--text)', outline: 'none', width: '100%',
          marginBottom: '12px', paddingBottom: '4px',
        }}
      />
    ) : (
      <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.5px' }}>
        {user?.username}
      </h1>
    )}

    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text2)', marginBottom: '12px' }}>
      <span><strong style={{ color: 'var(--text)', fontSize: '16px' }}>{likedSongs.length}</strong> bài hát</span>
      <span><strong style={{ color: 'var(--text)', fontSize: '16px' }}>{playlists.length}</strong> playlist</span>
      <span><strong style={{ color: 'var(--text)', fontSize: '16px' }}>{stats.totalSongs}</strong> lượt nghe</span>
    </div>

    {/* Avatar URL input khi đang edit */}
    {isEditing && (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Ảnh đại diện</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={() => setAvatarTab('url')}
            style={{
              padding: '4px 12px', borderRadius: '100px', fontSize: '12px',
              background: avatarTab === 'url' ? 'rgba(168,85,247,0.15)' : 'var(--surface)',
              border: `1px solid ${avatarTab === 'url' ? 'rgba(168,85,247,0.4)' : 'var(--border)'}`,
              color: avatarTab === 'url' ? '#a855f7' : 'var(--text2)', cursor: 'pointer',
            }}
          >🔗 URL</button>
          <button
            onClick={() => setAvatarTab('upload')}
            style={{
              padding: '4px 12px', borderRadius: '100px', fontSize: '12px',
              background: avatarTab === 'upload' ? 'rgba(168,85,247,0.15)' : 'var(--surface)',
              border: `1px solid ${avatarTab === 'upload' ? 'rgba(168,85,247,0.4)' : 'var(--border)'}`,
              color: avatarTab === 'upload' ? '#a855f7' : 'var(--text2)', cursor: 'pointer',
            }}
          >📁 Upload</button>
        </div>
        {avatarTab === 'url' ? (
          <input
            className="modal-input"
            type="text"
            placeholder="Dán link ảnh..."
            value={editAvatar}
            onChange={e => setEditAvatar(e.target.value)}
          />
        ) : (
          <input
            className="modal-input"
            type="file"
            accept="image/*"
            title="Upload ảnh đại diện" 
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = ev => setEditAvatar(ev.target?.result as string);
                reader.readAsDataURL(file);
              }
            }}
          />
        )}
      </div>
    )}
  </div>

  {/* Action buttons */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {isEditing ? (
      <>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          style={{
            padding: '8px 16px', borderRadius: '100px',
            background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
            color: '#a855f7', fontSize: '13px', cursor: 'pointer',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {isSaving ? 'Đang lưu...' : '✓ Lưu'}
        </button>
        <button
          onClick={() => { setIsEditing(false); setEditUsername(user?.username || ''); setEditAvatar(user?.avatar || ''); }}
          style={{
            padding: '8px 16px', borderRadius: '100px',
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text2)', fontSize: '13px', cursor: 'pointer',
          }}
        >
          Hủy
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            padding: '8px 16px', borderRadius: '100px',
            background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
            color: '#a855f7', fontSize: '13px', cursor: 'pointer',
          }}
        >
          ✏️ Chỉnh sửa
        </button>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            padding: '8px 16px', borderRadius: '100px',
            background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.3)',
            color: '#ff5c5c', fontSize: '13px', cursor: 'pointer',
          }}
        >
          Đăng xuất
        </button>
      </>
    )}
  </div>
</div>

        {/* ── AI INSIGHT ── */}
        {tasteResult ? (
          <div style={{
            padding: '20px 24px', borderRadius: '16px', marginBottom: '20px',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.08))',
            border: '1px solid rgba(168,85,247,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>✦ Nhận xét từ AI</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: '100px',
                  background: 'rgba(168,85,247,0.15)', color: 'var(--accent2)',
                  border: '1px solid rgba(168,85,247,0.25)',
                }}>
                  Được cập nhật hôm nay
                </span>
                <button
                  onClick={handleAnalyzeTaste}
                  disabled={isAnalyzing}
                  style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '100px',
                    background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
                    color: '#a855f7', cursor: 'pointer', opacity: isAnalyzing ? 0.6 : 1,
                  }}
                >
                  {isAnalyzing ? '...' : 'Phân tích lại'}
                </button>
              </div>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text)', marginBottom: '14px' }}>
              "{tasteResult.moodPattern}"
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tasteResult.favoriteGenres.slice(0, 3).map((g, i) => (
                <span key={i} style={{
                  padding: '4px 14px', borderRadius: '100px', fontSize: '13px',
                  background: (['rgba(168,85,247,0.15)', 'rgba(236,72,153,0.15)', 'rgba(59,130,246,0.15)'][i] as string),
                  color: (['#a855f7', '#ec4899', '#60a5fa'][i] as string),
                  border: `1px solid ${['rgba(168,85,247,0.3)', 'rgba(236,72,153,0.3)', 'rgba(59,130,246,0.3)'][i] as string}`,
                }}>{g}</span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '20px 24px', borderRadius: '16px', marginBottom: '20px',
            background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>✦ Chưa có phân tích AI</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Nghe thêm nhạc rồi để AI phân tích gu của bạn</div>
            </div>
            <button
              onClick={handleAnalyzeTaste}
              disabled={isAnalyzing}
              style={{
                padding: '8px 18px', borderRadius: '100px',
                background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
                color: '#a855f7', fontSize: '13px', cursor: 'pointer',
                opacity: isAnalyzing ? 0.6 : 1,
              }}
            >
              {isAnalyzing ? '✨ Đang phân tích...' : 'Phân tích ngay'}
            </button>
          </div>
        )}

        {/* ── STATS 4 cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: '⏱', label: 'Giờ nghe ước tính', value: `${estHours}h` },
            { icon: '🎵', label: 'Lượt nghe', value: stats.totalSongs },
            { icon: '📋', label: 'Playlist', value: playlists.length },
            { icon: '❤️', label: 'Bài đã thích', value: likedSongs.length },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '18px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: '14px',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '10px' }}>{s.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── ROW: GENRES + TOP ARTISTS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

          {/* Genres — chỉ hiện nếu có tasteResult */}
          <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>🎵 Thể loại yêu thích</div>
            {genres.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {genres.map((g, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 500 }}>{g.name}</span>
                      <span style={{ color: 'var(--text2)' }}>{g.pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface2)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${g.pct}%`, background: g.color, borderRadius: '100px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text2)', textAlign: 'center', padding: '30px 0' }}>
                Bấm "Phân tích ngay" để xem thể loại yêu thích
              </div>
            )}
          </div>

          {/* Top Artists — từ DB */}
          <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>📈 Nghệ sĩ nghe nhiều nhất</div>
            {topArtists.length > 0 ? topArtists.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '10px 0',
                borderBottom: i < topArtists.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text2)', width: '20px' }}>{i + 1}</div>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: ['#a855f7', '#ec4899', '#f97316', '#22c55e'][i],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: 700, color: 'white',
                }}>
                  {a.artist.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{a.artist}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{a.count} lượt phát</div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: '13px', color: 'var(--text2)', textAlign: 'center', padding: '30px 0' }}>
                Nghe nhạc để xem nghệ sĩ yêu thích
              </div>
            )}
          </div>
        </div>

        {/* ── MOOD STATS — từ DB ── */}
        <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', marginBottom: '24px' }}>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>❤️ Phân tích tâm trạng</div>
          {moodStats.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                {moodStats.map((m, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span>{MOOD_EMOJI[m.mood] || '🎵'} {m.mood}</span>
                      <span style={{ color: 'var(--text2)' }}>{m.pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface2)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${m.pct}%`, background: MOOD_COLORS[i], borderRadius: '100px' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                padding: '12px', borderRadius: '10px',
                background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)',
                fontSize: '13px', lineHeight: '1.6', color: 'var(--text)',
              }}>
                ✦ Mood phổ biến nhất của bạn là <strong>{moodStats[0]?.mood}</strong> ({moodStats[0]?.pct}%)
              </div>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text2)', textAlign: 'center', padding: '30px 0' }}>
              Dùng tính năng detect mood ở trang chủ để xem phân tích tâm trạng
            </div>
          )}
        </div>

      </div>

      {/* Modal logout */}
      {showLogoutConfirm && (
        <div className="modal-backdrop show" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Đăng xuất?</div>
            <p style={{ fontSize: '14px', color: 'var(--text2)', margin: '0 0 20px' }}>
              Bạn có chắc muốn đăng xuất không?
            </p>
            <div className="modal-btns">
              <button className="btn btn-ghost" onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
              <button
                className="btn btn-primary"
                style={{ background: '#ff5c5c' }}
                onClick={() => { logout(); router.push('/login'); }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}