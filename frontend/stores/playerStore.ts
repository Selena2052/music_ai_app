import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song } from '@/types';
import api from '@/lib/axios';
import { useIsFetching } from '@tanstack/react-query';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  volume: number;
  currentTime: number;
  duration: number;
  isNowPlayingOpen: boolean;

  isFetchingYoutube: boolean;
  fetchYoutubeId: (song: Song) => Promise<string | null>;

  // actions
  playSong: (song: Song, queue?: Song[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleNowPlaying: () => void;
  addToQueue: (song: Song) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      isPlaying: false,
      isShuffled: false,
      repeatMode: "none",
      volume: 0.7,
      currentTime: 0,
      duration: 0,
      isNowPlayingOpen: false,

      isFetchingYoutube: false,

      playSong: (song, queue = []) =>
        set({
          currentSong: song,
          queue: queue.length > 0 ? queue : [song],
          isPlaying: true,
          currentTime: 0,
        }),

      pauseSong: () => set({ isPlaying: false }),
      resumeSong: () => set({ isPlaying: true }),

      nextSong: () => {
        const { currentSong, queue, isShuffled, repeatMode } = get();
        if (!currentSong || queue.length === 0) return;
        const currentIndex = queue.findIndex(
          (s) => s.spotifyId === currentSong.spotifyId,
        );
        if (repeatMode === "one") {
          set({ currentTime: 0, isPlaying: true });
          return;
        }
        let nextIndex = isShuffled
          ? Math.floor(Math.random() * queue.length)
          : currentIndex + 1;
        if (nextIndex >= queue.length) {
          nextIndex = 0;
        }
        const nextSong = queue[nextIndex];
        set({ currentSong: queue[nextIndex], currentTime: 0, isPlaying: true });
        if (!nextSong.preview_url && !nextSong.youtubeId) {
          get().fetchYoutubeId(nextSong);
        }
      },

      prevSong: () => {
        const { currentSong, queue, currentTime } = get();
        if (!currentSong || queue.length === 0) return;
        if (currentTime > 3000) {
          set({ currentTime: 0 });
          return;
        }
        const currentIndex = queue.findIndex(
          (s) => s.spotifyId === currentSong.spotifyId,
        );

        const prevIndex =
          currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
        const prev = queue[prevIndex];

        set({ currentSong: prev, currentTime: 0, isPlaying: true });
        if (!prev.preview_url && !prev.youtubeId) get().fetchYoutubeId(prev);
      },

      setVolume: (volume) => set({ volume }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),
      toggleRepeat: () =>
        set((s) => ({
          repeatMode:
            s.repeatMode === "none"
              ? "all"
              : s.repeatMode === "all"
                ? "one"
                : "none",
        })),
      toggleNowPlaying: () =>
        set((s) => ({ isNowPlayingOpen: !s.isNowPlayingOpen })),
      addToQueue: (song) => set((s) => ({ queue: [...s.queue, song] })),

      fetchYoutubeId: async (song) => {
        // Đã có rồi thì dùng luôn
        if (song.youtubeId) return song.youtubeId;

        set({ isFetchingYoutube: true });
        try {
          const res = await api.get(`/music/${song.spotifyId}/youtube`, {
            params: { title: song.title, artist: song.artist },
          });
          const youtubeId = res.data || null;

          // Cập nhật lại currentSong và queue với youtubeId mới
          set((state) => ({
            isFetchingYoutube: false,
            currentSong:
              state.currentSong?.spotifyId === song.spotifyId
                ? { ...state.currentSong, youtubeId }
                : state.currentSong,
            queue: state.queue.map((s) =>
              s.spotifyId === song.spotifyId ? { ...s, youtubeId } : s,
            ),
          }));
          return youtubeId;
        } catch {
          set({ isFetchingYoutube: false });
          return null;
        }
      },
    }),
    {
      name: "player-storage",
      partialize: (state) => ({
        volume: state.volume,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
      }),
    },
  ),
);