import { create } from 'zustand';
import { Song, Playlist } from '@/types';
import api from '@/lib/axios';

interface MusicState {
  searchResults: Song[];
  isSearching: boolean;
  likedSongs: Song[];
  playlists: Playlist[];
  recentlyPlayed: Song[];
  isLoaded: boolean;

  loadLibrary: () => Promise<void>;
  searchSongs: (query: string) => Promise<void>;
  likeSong: (song: Song) => Promise<void>;
  unlikeSong: (spotifyId: string) => Promise<void>;
  isLiked: (spotifyId: string) => boolean;
  addToRecentlyPlayed: (song: Song) => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, spotifyId: string) => Promise<void>;
  updatePlaylistImage: (playlistId: string, imageUrl: string) => Promise<void>;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  searchResults: [],
  isSearching: false,
  likedSongs: [],
  playlists: [],
  recentlyPlayed: [],
  isLoaded: false,

  loadLibrary: async () => {
    if (get().isLoaded) return;
    try {
      const [likedRes, playlistsRes, historyRes] = await Promise.all([
        api.get('/library/liked'),
        api.get('/library/playlists'),
        api.get('/library/history'),
      ]);
      set({
        likedSongs: likedRes.data,
        playlists: playlistsRes.data,
        recentlyPlayed: historyRes.data,
        isLoaded: true,
      });
    } catch (err) {
      console.error('loadLibrary failed:', err);
    }
  },

  searchSongs: async (query) => {
    if (!query.trim()) { set({ searchResults: [] }); return; }
    set({ isSearching: true });
    try {
      const res = await api.get('/music/search', { params: { q: query } });
      set({ searchResults: res.data, isSearching: false });
    } catch {
      set({ isSearching: false });
    }
  },

  likeSong: async (song) => {
    set(state => ({
      likedSongs: [song, ...state.likedSongs.filter(s => s.spotifyId !== song.spotifyId)]
    }));
    try {
      await api.post('/library/liked', {
        spotifyId: song.spotifyId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        durationMs: song.duration_ms,
        imageUrl: song.image_url,
        previewUrl: song.preview_url,
        youtubeId: song.youtubeId,
      });
    } catch {
      set(state => ({ likedSongs: state.likedSongs.filter(s => s.spotifyId !== song.spotifyId) }));
    }
  },

  unlikeSong: async (spotifyId) => {
    set(state => ({ likedSongs: state.likedSongs.filter(s => s.spotifyId !== spotifyId) }));
    try {
      await api.delete(`/library/liked/${spotifyId}`);
    } catch {
      const res = await api.get('/library/liked');
      set({ likedSongs: res.data });
    }
  },

  isLiked: (spotifyId) => {
    return get().likedSongs.some(s => s.spotifyId === spotifyId);
  },

  addToRecentlyPlayed: async (song) => {
    set(state => {
      const filtered = state.recentlyPlayed.filter(s => s.spotifyId !== song.spotifyId);
      return { recentlyPlayed: [song, ...filtered].slice(0, 30) };
    });
    try {
      await api.post('/library/history', {
        spotifyId: song.spotifyId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        durationMs: song.duration_ms,
        imageUrl: song.image_url,
        previewUrl: song.preview_url,
        youtubeId: song.youtubeId,
      });
    } catch (err) {
      console.error('addToHistory failed:', err);
    }
  },

  createPlaylist: async (name) => {
    try {
      const res = await api.post('/library/playlists', { name });
      set(state => ({ playlists: [...state.playlists, res.data] }));
    } catch (err) {
      console.error('createPlaylist failed:', err);
    }
  },

  addSongToPlaylist: async (playlistId, song) => {
    set(state => ({
      playlists: state.playlists.map(pl => {
        if (pl.id !== playlistId) return pl;
        const alreadyExists = pl.song?.some(s => s.spotifyId === song.spotifyId);
        if (alreadyExists) return pl;
        const updatedSongs = [song, ...(pl.song || [])];
        return { ...pl, song: updatedSongs, song_count: updatedSongs.length, image_url: pl.image_url || song.image_url };
      }),
    }));
    try {
      await api.post(`/library/playlists/${playlistId}/songs`, {
        spotifyId: song.spotifyId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        durationMs: song.duration_ms,
        imageUrl: song.image_url,
        previewUrl: song.preview_url,
        youtubeId: song.youtubeId,
      });
    } catch {
      const res = await api.get('/library/playlists');
      set({ playlists: res.data });
    }
  },

  removeSongFromPlaylist: async (playlistId, spotifyId) => {
    set(state => ({
      playlists: state.playlists.map(pl => {
        if (pl.id !== playlistId) return pl;
        const updatedSongs = pl.song?.filter(s => s.spotifyId !== spotifyId) || [];
        return { ...pl, song: updatedSongs, song_count: updatedSongs.length };
      }),
    }));
    try {
      await api.delete(`/library/playlists/${playlistId}/songs/${spotifyId}`);
    } catch {
      const res = await api.get('/library/playlists');
      set({ playlists: res.data });
    }
  },

  updatePlaylistImage: async (playlistId, imageUrl) => {
    set(state => ({
      playlists: state.playlists.map(pl =>
        pl.id === playlistId ? { ...pl, image_url: imageUrl } : pl
      ),
    }));
    try {
      await api.patch(`/library/playlists/${playlistId}/image`, { imageUrl });
    } catch (err) {
      console.error('updatePlaylistImage failed:', err);
    }
  },
}));