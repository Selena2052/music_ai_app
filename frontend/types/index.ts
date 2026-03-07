// User
export interface User {
    id: string;
    email: string;
    username: string;
    avatar?: string;
}

// Auth
export interface AuthResponse {
    token: string;
    user: User;
}

// Song - Kết hợp data từ Spotify và YouTube
export interface Song {
    spotifyId: string;
    title: string;
    artist: string;
    album: string;
    duration_ms: number;
    image_url: string;
    preview_url: string | null;
    youtubeId?: string | null; 
}

// Playlist
export interface Playlist {
    id: string;
    name: string;
    image_url: string | undefined; // ảnh tùy chỉnh của user
    song_count?: number;
    total_duration?: number;
    song?: Song[];
}

// Mood - Kết quả AI phân tích cảm xúc
export interface MoodResult {
    mood: string; 
    moodScore: number;
    recommendedGenres: string[];
    recommendedBpm: 'slow' | 'medium' | 'fast';
    message: string;        // tin nhắn động viên từ AI
    searchQuery: string;    //từ khóa để search 
}

// AI story
export interface StoryResult {
    story: string;
}

// Lyric Explanation
export interface ExplanationResult {
    explanation: string;
}

// Vibe Transition 
export interface VibeTrack {
    searchQuery: string;
    reason: string;
}

export interface VibeResult {
    tracks: VibeTrack[];
}

// Chat message 
export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

// Chat response
export interface ChatResponse {
    reply: string;
}

// Taste Analysis 
export interface TasteResult {
    favoriteGenres: string[];
    favoriteEras: string[];
    moodPattern: string;
    recommendedArtists: string[];
    personaLityInsights: string;
    nextRecommendations: string[];
}