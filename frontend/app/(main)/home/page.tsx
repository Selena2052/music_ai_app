'use client';


import { useState, useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useMusicStore } from '@/stores/musicStore';
import { useAiStore } from '@/stores/aiStore';
import { useAuthStore } from '@/stores/authStore';
import { Search, Palette } from 'lucide-react';
import { Song } from '@/types';


const MOODS = [
  { emoji: '😊', label: 'Vui vẻ', query: 'happy upbeat' },
  { emoji: '😢', label: 'Buồn', query: 'sad emotional' },
  { emoji: '😌', label: 'Thư giãn', query: 'chill relax' },
  { emoji: '💪', label: 'Năng lượng', query: 'energy workout' },
  { emoji: '💭', label: 'Suy tư', query: 'thoughtful indie' },
  { emoji: '🎉', label: 'Party', query: 'party dance' },
];

const THEMES = [
  { name: 'dragon',   accent: '#dc2626', rgb: '220,38,38',   accent2: '#f97316' }, // đỏ lửa rồng
  { name: 'poison',   accent: '#7c3aed', rgb: '124,58,237',  accent2: '#4ade80' }, // tím độc
  { name: 'ice',      accent: '#0ea5e9', rgb: '14,165,233',  accent2: '#e0f2fe' }, // băng
  { name: 'gold',     accent: '#d97706', rgb: '217,119,6',   accent2: '#fde68a' }, // vàng hoàng gia
  { name: 'shadow',   accent: '#6b21a8', rgb: '107,33,168',  accent2: '#c084fc' }, // bóng tối
  { name: 'forest',   accent: '#15803d', rgb: '21,128,61',   accent2: '#86efac' }, // rừng
  { name: 'blood',    accent: '#9f1239', rgb: '159,18,57',   accent2: '#fb7185' }, // máu
  { name: 'storm',    accent: '#1d4ed8', rgb: '29,78,216',   accent2: '#93c5fd' }, // sấm sét
  { name: 'void',     accent: '#1e1b4b', rgb: '30,27,75',    accent2: '#818cf8' }, // hư vô
  { name: 'lava',     accent: '#c2410c', rgb: '194,65,12',   accent2: '#fbbf24' }, // dung nham
];

export default function HomePage() {
  const { user } = useAuthStore();
  const { playSong, currentSong, isPlaying, fetchYoutubeId } = usePlayerStore();
  const { searchResults, isSearching, searchSongs, isLiked, likeSong, unlikeSong, addToRecentlyPlayed } = useMusicStore();
  const { currentMood, detectMood } = useAiStore();

  const [activeMood, setActiveMood] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTheme, setShowTheme] = useState(false);
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [moodMessage, setMoodMessage] = useState('');
  const [isLoadingMood, setIsLoadingMood] = useState(false);

  // random theme khi load trang
  useEffect(() => {
    const random = THEMES[Math.floor(Math.random() * THEMES.length)];
    applyTheme(random);
  }, []);

  // search với debounce 500ms
  // tránh gọi API mỗi lần gõ 1 chữ
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchSongs(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const applyTheme = (theme: typeof THEMES[0]) => {
    const r = document.documentElement;
    r.style.setProperty('--accent', theme.accent);
    r.style.setProperty('--rgb', theme.rgb);
    r.style.setProperty('--accent2', theme.accent2);
    r.style.setProperty('--grad', `linear-gradient(135deg,${theme.accent},${theme.accent2})`);
    setActiveTheme(theme);
    setShowTheme(false);
  };

  const handleMoodClick = async (index: number, mood: typeof MOODS[0]) => {
    if (isLoadingMood) return; // chặn spam click
    setIsLoadingMood(true);
    setActiveMood(index);
    setMoodMessage('');   //reset message cũ

    try {
      // gọi AI với label mood
      const result = await detectMood(mood.label);
      
      console.log('AI reuslt: ', result);

      if(result) {
        // hiện message động viên AI trả về
        setMoodMessage(result.message);
        // search nhạc bằng query AI đề xuất
        await searchSongs(result.searchQuery);
      } else {
        // nếu AI lỗi thì fallback về query cứng như cũ
        await searchSongs(mood.query);
      }
    }  finally {
      setIsLoadingMood(false);
    }
  };

  const handlePlaySong = async (song: Song) => {
    // playSong trước để UI response ngay (hiện loading state)
    playSong(song, searchResults.length > 0 ? searchResults : [song]);
    addToRecentlyPlayed(song);

    // Nếu không có preview_url thì cần youtubeId
    if (!song.preview_url && !song.youtubeId) {
      await fetchYoutubeId(song);
      // AudioPlayer sẽ tự detect youtubeId mới qua currentSong update
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng ☀️';
    if (hour < 18) return 'Chào buổi chiều 🌤️';
    return 'Chào buổi tối 🌙';
  };

  return (
    <div className="main-content">
      {/* HEADER */}
      <div className="page-header">
        <div className="greeting">
          <h1>{getGreeting()}</h1>
          <p>
            {currentMood
              ? `Mood hiện tại: ${currentMood.mood}`
              : 'Cảm xúc của bạn hôm nay thế nào?'}
          </p>
        </div>
        <div className="header-right">
          {/* Search */}
          <div className="search-bar">
            <Search size={15} style={{ opacity: 0.4, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Tìm bài hát, nghệ sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <span style={{ fontSize: '12px', color: 'var(--text2)', flexShrink: 0 }}>...</span>
            )}
          </div>

          {/* Theme button */}
          <div className="theme-btn" onClick={() => setShowTheme(!showTheme)}>
            <Palette size={16} />
          </div>

          {/* Avatar */}
          <div className="header-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* THEME POPUP */}
      {showTheme && (
        <div className="theme-popup show" style={{ position: 'absolute', top: '68px', right: '12px', zIndex: 300 }}>
          <div className="theme-popup-title">CHỌN THEME</div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <div
                key={t.name}
                className={`theme-opt ${activeTheme.name === t.name ? 'active' : ''}`}
                style={{ background: `linear-gradient(135deg,${t.accent},${t.accent2})` }}
                onClick={() => applyTheme(t)}
              />
            ))}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="page-content">

        {/* MOOD CHIPS */}
        <div className="sec-title" style={{ marginTop: '14px' }}>✨ Chọn tâm trạng</div>
        <div className="mood-chips">
          {MOODS.map((mood, i) => (
            <div
              key={i}
              className={`chip ${activeMood === i ? 'active' : ''}`}
              onClick={() => handleMoodClick(i, mood)}
            >
              {mood.emoji} {mood.label}
            </div>
          ))}
        </div>

        {/* AI mood message */}
        {moodMessage && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            background: 'rgba(var(--rgb),0.1)',
            border: '1px solid rgba(var(--rgb),0.2)',
            borderRadius: '12px',
            fontSize: '14px',
            color: 'var(--accent2)',
          }}>
            ✦ {moodMessage}
          </div>
        )}

        {/* SEARCH RESULTS hoặc STORY CARD */}
        {searchResults.length > 0 ? (
          <>
            <div className="sec-title">
              🔍 Kết quả tìm kiếm
              <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 400, marginLeft: '8px' }}>
                {searchResults.length} bài
              </span>
            </div>
            <div className="song-list">
              {searchResults.map((song, i) => {
                const isCurrentSong = currentSong?.spotifyId === song.spotifyId;
                const liked = isLiked(song.spotifyId);
                return (
                  <div
                    key={song.spotifyId}
                    className={`song-row ${isCurrentSong ? 'playing' : ''}`}
                    onClick={() => handlePlaySong(song)}
                  >
                    {/* số thứ tự hoặc animation bars */}
                    <div className="song-num">
                      {isCurrentSong && isPlaying ? (
                        <div className="playing-bars">
                          <div className="bar" />
                          <div className="bar" />
                          <div className="bar" />
                        </div>
                      ) : (
                        i + 1
                      )}
                    </div>

                    {/* thumbnail */}
                    <div className="song-thumb">
                      {song.image_url ? (
                        <img src={song.image_url} alt={song.title} />
                      ) : '🎵'}
                    </div>

                    {/* tên bài + nghệ sĩ */}
                    <div className="song-info">
                      <div className="title">{song.title}</div>
                      <div className="artist">{song.artist} · {song.album}</div>
                    </div>

                    {/* duration */}
                    <div className="song-dur">{formatDuration(song.duration_ms)}</div>

                    {/* like button */}
                    <button
                      className={`song-like ${liked ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        liked ? unlikeSong(song.spotifyId) : likeSong(song);
                      }}
                      title={liked ? 'Bỏ thích' : 'Thích'}
                    >
                      {liked ? '❤️' : '🤍'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* STORY CARD - hiện khi không search */}
            {currentSong && (
              <>
                <div className="sec-title">✦ AI Story Mode</div>
                <div className="story-card">
                  <button className="story-btn">Xem Story</button>
                  <div className="story-badge">✦ ĐANG PHÁT</div>
                  <div className="story-title">{currentSong.title}</div>
                  <div className="story-sub">Câu chuyện đằng sau bài hát bạn đang nghe</div>
                  <div className="story-secs">
                    <div className="story-sec"><div className="story-sec-lbl">NGHỆ SĨ</div>{currentSong.artist}</div>
                    <div className="story-sec"><div className="story-sec-lbl">ALBUM</div>{currentSong.album}</div>
                    <div className="story-sec"><div className="story-sec-lbl">THỜI LƯỢNG</div>{formatDuration(currentSong.duration_ms)}</div>
                  </div>
                </div>
              </>
            )}

            {/* REC GRID */}
            <div className="sec-title">✦ Khám phá</div>
            <div className="rec-grid">
              {[
                { title: 'Chill Vibes', sub: 'Thư giãn sau ngày dài', query: 'chill lofi', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80' },
                { title: 'Năng lượng', sub: 'Bùng cháy hết mình', query: 'energy workout', img: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&q=80' },
                { title: 'Tạo AI Playlist', sub: 'Để AI tạo playlist theo mood', query: '', img: '' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rec-card"
                  onClick={() => item.query && searchSongs(item.query)}
                  style={!item.img ? { background: 'rgba(var(--rgb),0.12)' } : {}}
                >
                  {item.img ? (
                    <img src={item.img} alt={item.title} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '34px', opacity: 0.4 }}>✦</div>
                  )}
                  <div className="rec-ov">
                    <div className="rec-title">{item.title}</div>
                    <div className="rec-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}