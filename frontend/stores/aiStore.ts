import { create } from 'zustand';
import { MoodResult, StoryResult, ExplanationResult, VibeResult, ChatMessage, TasteResult } from '@/types';
import api from '@/lib/axios';

interface AiState {
  // mood
  currentMood: MoodResult | null;
  isDetectingMood: boolean;

  // story
  currentStory: StoryResult | null;
  isGeneratingStory: boolean;

  // lyrics explanation
  currentExplanation: ExplanationResult | null;
  isExplaining: boolean;

  // vibe
  vibeResults: VibeResult | null;
  isGettingVibe: boolean;

  // chat
  chatHistory: ChatMessage[];
  isTyping: boolean;

  // taste
  tasteResult: TasteResult | null;
  isAnalyzing: boolean;

  // actions
  detectMood: (message: string) => Promise<MoodResult | null>;
  generateStory: (title: string, artist: string) => Promise<void>;
  explainLyrics: (lyrics: string, title: string, artist: string) => Promise<void>;
  getNextVibe: (title: string, artist: string, mood: string) => Promise<void>;
  sendChat: (message: string) => Promise<void>;
  analyzeTaste: (history: { title: string; artist: string }[]) => Promise<void>;
  clearChat: () => void;
  loadChatHistory: () => Promise<void>; 
}

export const useAiStore = create<AiState>((set, get) => ({
  currentMood: null,
  isDetectingMood: false,
  currentStory: null,
  isGeneratingStory: false,
  currentExplanation: null,
  isExplaining: false,
  vibeResults: null,
  isGettingVibe: false,
  chatHistory: [],
  isTyping: false,
  tasteResult: null,
  isAnalyzing: false,

  detectMood: async (message) => {
    set({ isDetectingMood: true });
    try {
      const response = await api.post('/ai/mood', { message });
      const mood = response.data as MoodResult;
      set({ currentMood: mood, isDetectingMood: false });
      return mood;
    } catch (error) {
      console.error('Mood detection failed:', error);
      set({ isDetectingMood: false });
      return null;
    }
  },

  generateStory: async (title, artist) => {
    set({ isGeneratingStory: true, currentStory: null });
    try {
      const response = await api.post('/ai/story', { title, artist });
      set({ currentStory: response.data, isGeneratingStory: false });
    } catch (error) {
      console.error('Story generation failed:', error);
      set({ isGeneratingStory: false });
    }
  },

  explainLyrics: async (lyrics, title, artist) => {
    set({ isExplaining: true, currentExplanation: null });
    try {
      const response = await api.post('/ai/explain-lyrics', { lyrics, title, artist });
      set({ currentExplanation: response.data, isExplaining: false });
    } catch (error) {
      console.error('Lyrics explanation failed:', error);
      set({ isExplaining: false });
    }
  },

  getNextVibe: async (title, artist, mood) => {
    set({ isGettingVibe: true, vibeResults: null });
    try {
      const response = await api.post('/ai/vibe-next', { title, artist, mood });
      set({ vibeResults: response.data, isGettingVibe: false });
    } catch (error) {
      console.error('Vibe transition failed:', error);
      set({ isGettingVibe: false });
    }
  },

  sendChat: async (message) => {
    const { chatHistory } = get();

    // thêm tin nhắn user vào history trước
    const userMessage: ChatMessage = { role: 'user', content: message };
    set({
      chatHistory: [...chatHistory, userMessage],
      isTyping: true,
    });

    try {
      const response = await api.post('/ai/chat', {
        message,
        // chuyển history sang format backend cần
        history: chatHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const aiMessage: ChatMessage = {
        role: 'ai',
        content: response.data.reply,
      };

      set((state) => ({
        chatHistory: [...state.chatHistory, aiMessage],
        isTyping: false,
      }));
    } catch (error) {
      console.error('Chat failed:', error);
      set({ isTyping: false });
    }
  },

  analyzeTaste: async (history) => {
    set({ isAnalyzing: true, tasteResult: null });
    try {
      const response = await api.post('/ai/analyze-taste', { history });
      set({ tasteResult: response.data, isAnalyzing: false });
    } catch (error) {
      console.error('Taste analysis failed:', error);
      set({ isAnalyzing: false });
    }
  },

  clearChat: async () => {
  set({ chatHistory: [] });
  try {
    await api.delete('/ai/chat/history');
  } catch (err) {
    console.error('clearChat failed:', err);
  }
},
  loadChatHistory: async () => {
  try {
    const res = await api.get('/ai/chat/history');
    set({ chatHistory: res.data });
  } catch (err) {
    console.error('loadChatHistory failed:', err);
  }
},
}));
