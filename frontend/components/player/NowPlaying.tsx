'use client';

import { usePlayerStore } from '@/stores/playerStore';
import { useMusicStore } from '@/stores/musicStore';
import { useAiStore } from '@/stores/aiStore';
import {
    X, Play, Pause, SkipBack, SkipForward,
    Shuffle, Repeat, Repeat1, Sparkles, BookOpen, Lightbulb, Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NowPlaying() {
    const {
        currentSong,
        isPlaying,
        isShuffled,
        repeatMode,
        currentTime,
        duration,
        isNowPlayingOpen,
        pauseSong,
        resumeSong,
        nextSong,
        prevSong,
        setCurrentTime,
        toggleShuffle,
        toggleRepeat,
        toggleNowPlaying,
    } = usePlayerStore();

    const { isLiked, likeSong, unlikeSong } = useMusicStore();

    const {
        currentStory,
        isGeneratingStory,
        currentExplanation,
        isExplaining,
        vibeResults,
        isGettingVibe,
        generateStory,
        explainLyrics,
        getNextVibe,
        currentMood,
    } = useAiStore();

    // tab đang active ở panel phải
    const [activePanel, setActivePanel] = useState<'lyrics' | 'story' | 'explain' | 'vibe'>('lyrics');
    const [lyrics, setLyrics] = useState<string>('');
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

    useEffect(() => {
        if (!currentSong) return;
        setLyrics('');
        setIsLoadingLyrics(true);
        // api
        fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(currentSong.artist)}/${encodeURIComponent(currentSong.title)}`)
            .then(res => res.json())
            .then(data => {
                if (data.lyrics) setLyrics(data.lyrics);
                else setLyrics('');
            })
            .catch(() => setLyrics(''))
            .finally(() => setIsLoadingLyrics(false));
    }, [currentSong?.spotifyId]);

    if (!isNowPlayingOpen || !currentSong) return null;

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const liked = isLiked(currentSong.spotifyId);

    const handleGenerateStory = () => {
        setActivePanel('story');
        generateStory(currentSong.title, currentSong.artist, currentSong.spotifyId);
    };

    const handleExplainLyrics = () => {
        setActivePanel('explain');
        explainLyrics(lyrics, currentSong.title, currentSong.artist, currentSong.spotifyId);
    };

    const handleGetVibe = () => {
        setActivePanel('vibe');
        const mood = currentMood?.mood || 'neutral';
        getNextVibe(currentSong.title, currentSong.artist, mood);
    };

    return (
        // full screen overlay
        <div className="now-playing show">
            {/* background gradient lấy màu từ accent */}
            <div className="np-bg" />

            {/* nút đóng */}
            <button className="np-close" onClick={toggleNowPlaying} title="Đóng">
                <X size={18} />
            </button>

            <div className="np-content">
                {/* ── BÊN TRÁI: ảnh + controls ── */}
                <div className="np-left">
                    {/* ảnh bài hát */}
                    <div className="np-cover">
                        {currentSong.image_url ? (
                            <img
                                src={currentSong.image_url}
                                alt={currentSong.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
                            />
                        ) : (
                            '🎵'
                        )}
                    </div>

                    {/* tên bài + like */}
                    <div className="np-song-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                            <div className="np-title">{currentSong.title}</div>
                            <button
                                onClick={() => liked ? unlikeSong(currentSong.spotifyId) : likeSong(currentSong)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px' }}
                                title={liked ? 'Bỏ thích' : 'Thích'}
                            >
                                {liked ? '❤️' : '🤍'}
                            </button>
                        </div>
                        <div className="np-artist">{currentSong.artist}</div>
                    </div>

                    {/* progress bar */}
                    <div className="np-prog-wrap">
                        <div
                            className="np-prog-bar"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const percent = (e.clientX - rect.left) / rect.width;
                                setCurrentTime(percent * duration);
                            }}
                        >
                            <div className="np-prog-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="np-prog-times">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* controls */}
                    <div className="np-ctrl-row">
                        <button
                            className="np-btn"
                            onClick={toggleShuffle}
                            title="Shuffle"
                            style={{ color: isShuffled ? 'var(--accent2)' : undefined }}
                        >
                            <Shuffle size={20} />
                        </button>
                        <button className="np-btn" onClick={prevSong} title="Bài trước">
                            <SkipBack size={22} />
                        </button>
                        <button className="np-play-btn" onClick={isPlaying ? pauseSong : resumeSong} title={isPlaying ? 'Dừng' : 'Phát'}>
                            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                        </button>
                        <button className="np-btn" onClick={nextSong} title="Bài tiếp">
                            <SkipForward size={22} />
                        </button>
                        <button
                            className="np-btn"
                            onClick={toggleRepeat}
                            title="Lặp lại"
                            style={{ color: repeatMode !== 'none' ? 'var(--accent2)' : undefined }}
                        >
                            {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                        </button>
                    </div>
                </div>

                {/* ── BÊN PHẢI: lyrics + AI ── */}
                <div className="np-right">
                    {/* 3 nút AI action */}
                    <div className="ai-actions">
                        <div
                            className={`ai-action ${activePanel === 'story' ? 'active' : ''}`}
                            onClick={handleGenerateStory}
                        >
                            <Sparkles size={20} />
                            <span>Story Mode</span>
                        </div>
                        <div
                            className={`ai-action ${activePanel === 'explain' ? 'active' : ''}`}
                            onClick={handleExplainLyrics}
                        >
                            <Lightbulb size={20} />
                            <span>Giải thích lyrics</span>
                        </div>
                        <div
                            className={`ai-action ${activePanel === 'vibe' ? 'active' : ''}`}
                            onClick={handleGetVibe}
                        >
                            <Zap size={20} />
                            <span>Vibe tiếp theo</span>
                        </div>
                    </div>

                    {/* content panel thay đổi theo activePanel */}
                    <div className="lyrics-box">

                        {/* LYRICS */}
                        {activePanel === 'lyrics' && (
                            <>
                                <div className="lyrics-label">
                                    <BookOpen size={12} style={{ display: 'inline', marginRight: '6px' }} />
                                    LỜI BÀI HÁT
                                </div>
                                {isLoadingLyrics ? (
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                                        🎵 Đang tải lyrics...
                                    </div>
                                ) : lyrics ? (
                                    <div style={{ fontSize: '14px', lineHeight: '1.9', color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-line' }}>
                                        {lyrics}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                                        <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>🎵</div>
                                        <p>Không tìm thấy lyrics</p>
                                        <p style={{ fontSize: '12px', marginTop: '6px', opacity: 0.7 }}>
                                            Thử Story Mode hoặc Giải thích lyrics AI nhé!
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* STORY MODE */}
                        {activePanel === 'story' && (
                            <>
                                <div className="lyrics-label">
                                    <Sparkles size={12} style={{ display: 'inline', marginRight: '6px' }} />
                                    STORY MODE
                                </div>
                                {isGeneratingStory ? (
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                                        ✨ AI đang kể chuyện...
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '15px', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)' }}>
                                        {currentStory?.story || 'Bấm Story Mode để AI kể câu chuyện về bài hát này!'}
                                    </div>
                                )}
                            </>
                        )}

                        {/* GIẢI THÍCH LYRICS */}
                        {activePanel === 'explain' && (
                            <>
                                <div className="lyrics-label">
                                    <Lightbulb size={12} style={{ display: 'inline', marginRight: '6px' }} />
                                    GIẢI THÍCH LYRICS
                                </div>
                                {isExplaining ? (
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                                        💡 AI đang phân tích...
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '15px', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)' }}>
                                        {currentExplanation?.explanation || 'Bấm Giải thích để AI phân tích ý nghĩa lyrics!'}
                                    </div>
                                )}
                            </>
                        )}

                        {/* VIBE TIẾP THEO */}
                        {activePanel === 'vibe' && (
                            <>
                                <div className="lyrics-label">
                                    <Zap size={12} style={{ display: 'inline', marginRight: '6px' }} />
                                    VIBE TIẾP THEO
                                </div>
                                {isGettingVibe ? (
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                                        🎯 AI đang gợi ý...
                                    </div>
                                ) : vibeResults ? (
                                    <>
                                        {vibeResults.tracks.map((track, i) => (
                                            <div key={i} style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '10px',
                                                padding: '12px',
                                                marginBottom: '10px',
                                            }}>
                                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                                                    🎵 {track.searchQuery}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                                    {track.reason}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                                        Bấm Vibe tiếp theo để AI gợi ý bài phù hợp!
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}