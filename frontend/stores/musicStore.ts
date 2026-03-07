import { create } from 'zustand';
import { Song, Playlist } from '@/types';
import api from '@/lib/axios';

interface MusicState {
  // state
  searchResults: Song[];
  isSearching: boolean;
  likedSongs: Song[];
  playlists: Playlist[];
  recentlyPlayed: Song[];

  // actions
  searchSongs: (query: string) => Promise<void>;
  likeSong: (song: Song) => void;
  unlikeSong: (spotifyId: string) => void;
  isLiked: (spotifyId: string) => boolean;
  addToRecentlyPlayed: (song: Song) => void;
  createPlaylist: (name: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, spotifyId: string) => void;
  updatePlaylistImage: (playlistId: string, imageUrl: string) => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  searchResults: [],
  isSearching: false,
  likedSongs: [],
  playlists: [],
  recentlyPlayed: [],

  searchSongs: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ isSearching: true });

    try {
      const response = await api.get('/music/search', {
        params: { q: query },
      });
      set({ searchResults: response.data, isSearching: false });
    } catch (error) {
      console.error('Search failed:', error);
      set({ isSearching: false });
    }
  },

  likeSong: (song) => {
    const { likedSongs } = get();
    // tránh like trùng
    const alreadyLiked = likedSongs.some(
      (s) => s.spotifyId === song.spotifyId
    );
    if (alreadyLiked) return;
    set({ likedSongs: [song, ...likedSongs] });
  },

  unlikeSong: (spotifyId) => {
    set((state) => ({
      likedSongs: state.likedSongs.filter(
        (s) => s.spotifyId !== spotifyId
      ),
    }));
  },

  // helper để check bài đã like chưa
  isLiked: (spotifyId) => {
    return get().likedSongs.some((s) => s.spotifyId === spotifyId);
  },

  addToRecentlyPlayed: (song) => {
    set((state) => {
      // xóa nếu đã có trong danh sách
      const filtered = state.recentlyPlayed.filter(
        (s) => s.spotifyId !== song.spotifyId
      );
      // thêm vào đầu, giữ tối đa 20 bài
      return { recentlyPlayed: [song, ...filtered].slice(0, 20) };
    });
  },

  createPlaylist: (name) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      image_url: undefined,
      song: [],
      song_count: 0,
    };
    set((state) => ({
      playlists: [...state.playlists, newPlaylist],
    }));
  },

  addSongToPlaylist: (playlistId, song) => {
    set((state) => ({
      playlists: state.playlists.map((pl) => {
        if (pl.id !== playlistId) return pl;

        const alreadyExists = pl.song?.some(
          (s) => s.spotifyId === song.spotifyId
        );
        if (alreadyExists) return pl;

        const updatedSongs = [song, ...(pl.song || [])];
        return {
          ...pl,
          songs: updatedSongs,
          song_count: updatedSongs.length,
          // bài mới nhất → ảnh mặc định của playlist
          image_url: pl.image_url || song.image_url,
        };
      }),
    }));
  },

  removeSongFromPlaylist: (playlistId, spotifyId) => {
    set((state) => ({
      playlists: state.playlists.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const updatedSongs = pl.song?.filter(
          (s) => s.spotifyId !== spotifyId
        );
        return {
          ...pl,
          songs: updatedSongs,
          song_count: updatedSongs?.length || 0,
        };
      }),
    }));
  },

  updatePlaylistImage: (playlistId, imageUrl) => {
    set((state) => ({
      playlists: state.playlists.map((pl) =>
        pl.id === playlistId ? { ...pl, image_url: imageUrl } : pl
      ),
    }));
  },
}));