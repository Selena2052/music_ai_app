import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import {
  ChatHistory,
  UserMood,
  SongStory,
  LyricsExplanation,
} from './ai.entity';
import { UserTasteProfile } from '../users/user-taste.entity';
import { Song } from '../music/song.entity';

@Injectable()
export class AiService {
  constructor(
    private httpService: HttpService,
    private config: ConfigService,

    @InjectRepository(ChatHistory)
    private chatHistoryRepo: Repository<ChatHistory>,

    @InjectRepository(UserMood)
    private userMoodRepo: Repository<UserMood>,

    @InjectRepository(SongStory)
    private songStoryRepo: Repository<SongStory>,

    @InjectRepository(LyricsExplanation)
    private lyricsExplanationRepo: Repository<LyricsExplanation>,

    @InjectRepository(UserTasteProfile)
    private userTasteRepo: Repository<UserTasteProfile>,

    @InjectRepository(Song)
    private songRepo: Repository<Song>,
  ) {}

  private async callGroq(prompt: string): Promise<string> {
    const apiKey = this.config.get('GROQ_API_KEY') ?? '';
    const response = (await firstValueFrom(
      this.httpService.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    )) as any;
    return response.data.choices[0].message.content;
  }

  private async getSongId(spotifyId: string): Promise<string | null> {
    if (!spotifyId) return null;
    const song = await this.songRepo.findOne({ where: { spotifyId } });
    return song?.id ?? null;
  }

  async detectMood(userMessage: string, userId?: string) {
    const prompt = `
      Bạn là chuyên gia âm nhạc và tâm lý học.
      User vừa nói: "${userMessage}"
      
      Hãy phân tích và trả về JSON với format sau:
      {
        "mood": "tên cảm xúc (vui/buồn/năng động/thư giãn/tập trung)",
        "moodScore": số từ 1-10 (1 rất buồn, 10 rất vui),
        "recommendedGenres": ["genre1", "genre2", "genre3"],
        "recommendedBpm": "slow/medium/fast",
        "message": "tin nhắn ngắn bằng tiếng Việt động viên user",
        "searchQuery": "từ khóa tìm kiếm nhạc phù hợp trên Spotify"
      }
      
      Chỉ trả về JSON, không giải thích thêm.
    `;

    const result = await this.callGroq(prompt);
    const cleaned = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Lưu mood vào DB nếu có userId
    if (userId) {
      await this.userMoodRepo.save(
        this.userMoodRepo.create({
          userId,
          mood: parsed.mood,
          contextText: userMessage,
        }),
      );
    }

    return parsed;
  }

  async generateStory(title: string, artist: string, spotifyId?: string) {
    // Check cache
    if (spotifyId) {
      const songId = await this.getSongId(spotifyId);
      if (songId) {
        const cached = await this.songStoryRepo.findOne({ where: { songId } });
        if (cached) return { story: cached.storyText, fromCache: true };
      }
    }

    // Gọi Groq
    const prompt = `
    Bạn là người kể chuyện âm nhạc đầy cảm hứng.
    Hãy kể câu chuyện thú vị về bài hát "${title}" của "${artist}".
    
    Bao gồm:
    - Hoàn cảnh ra đời của bài hát
    - Ý nghĩa sâu xa của lời nhạc
    - Tác động của bài hát đến người nghe và văn hóa
    - Một sự thật thú vị ít người biết
    
    Viết bằng tiếng Việt, khoảng 150-200 từ, 
    giọng văn cuốn hút như đang kể chuyện cho bạn bè nghe.
  `;
    const story = await this.callGroq(prompt);

    // Lưu DB
    if (spotifyId) {
      const songId = await this.getSongId(spotifyId);
      if (songId) {
        await this.songStoryRepo.save(
          this.songStoryRepo.create({ songId, storyText: story }),
        );
      }
    }

    return { story, fromCache: false };
  }

  async getNextVibeTrack(
    currentTitle: string,
    currentArtist: string,
    mood: string,
  ) {
    const prompt = `
      User đang nghe "${currentTitle}" của "${currentArtist}".
      Mood hiện tại: ${mood}
      
      Gợi ý 5 bài hát tiếp theo phù hợp để chuyển tiếp mượt mà.
      Trả về JSON:
      {
        "tracks": [
          {
            "searchQuery": "tên bài + artist để search trên Spotify",
            "reason": "lý do ngắn tại sao bài này phù hợp"
          }
        ]
      }
      
      Chỉ trả về JSON, không giải thích thêm.
    `;

    const result = await this.callGroq(prompt);
    const cleaned = result.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }

  // CHAT với lưu DB
  async chat(
    message: string,
    history: { role: string; content: string }[],
    userId?: string,
  ) {
    console.log('Chat userId:', userId);
    const historyText = history
      .map((h) => `${h.role === 'user' ? 'User' : 'AI'}: ${h.content}`)
      .join('\n');

    const prompt = `
      Bạn là AI chuyên về âm nhạc, tên là MusicAI.
      Bạn am hiểu mọi thể loại nhạc, có thể gợi ý nhạc theo mood,
      kể chuyện về nghệ sĩ, giải thích lyrics và nhiều hơn nữa.
      Luôn trả lời bằng tiếng Việt, thân thiện như bạn bè.
      
      Lịch sử hội thoại:
      ${historyText}
      
      User: ${message}
      AI:
    `;

    const reply = await this.callGroq(prompt);

    // Lưu cả 2 message vào DB
    if (userId) {
      await this.chatHistoryRepo.save([
        this.chatHistoryRepo.create({ userId, role: 'user', content: message }),
        this.chatHistoryRepo.create({ userId, role: 'ai', content: reply }),
      ]);
    }

    return { reply };
  }

  // Lấy chat history từ DB
  async getChatHistory(userId: string) {
    const history = await this.chatHistoryRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
      take: 50, // lấy 50 tin nhắn gần nhất
    });

    return history.map((h) => ({
      role: h.role as 'user' | 'ai',
      content: h.content,
    }));
  }

  async clearChatHistory(userId: string) {
    await this.chatHistoryRepo.delete({ userId });
    return { ok: true };
  }

  async analyzeUserTaste(
    listeningHistory: { title: string; artist: string }[],
    userId?: string,
  ) {
    const result = await this.callGroq(prompt());
    const cleaned = result.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (userId) {
      const existing = await this.userTasteRepo.findOne({ where: { userId } });
      if (existing) {
        await this.userTasteRepo.update(existing.id, {
          favoriteGenres: parsed.favoriteGenres,
          favoriteArtists: parsed.recommendedArtists,
          moodPatterns: { pattern: parsed.moodPattern },
        });
      } else {
        await this.userTasteRepo.save(
          this.userTasteRepo.create({
            userId,
            favoriteGenres: parsed.favoriteGenres,
            favoriteArtists: parsed.recommendedArtists,
            moodPatterns: { pattern: parsed.moodPattern },
          }),
        );
      }
    }

    return parsed;
  }

  async explainLyrics(lyrics: string, title: string, artist: string, spotifyId?: string) {
  if (spotifyId) {
    const songId = await this.getSongId(spotifyId);
    if (songId) {
      const cached = await this.lyricsExplanationRepo.findOne({ where: { songId } });
      if (cached) return { explanation: cached.explanation, fromCache: true };
    }
  }

  const prompt = `
    Bạn là chuyên gia phân tích âm nhạc.
    Đây là đoạn lyrics từ bài "${title}" của "${artist}":
    "${lyrics}"
    
    Hãy giải thích:
    - Ý nghĩa literal (nghĩa đen)
    - Ý nghĩa ẩn dụ (nghĩa bóng)
    - Cảm xúc mà tác giả muốn truyền đạt
    
    Viết bằng tiếng Việt, dễ hiểu, khoảng 100-150 từ.
  `;
  const explanation = await this.callGroq(prompt);

  if (spotifyId) {
    const songId = await this.getSongId(spotifyId);
    if (songId) {
      await this.lyricsExplanationRepo.save(
        this.lyricsExplanationRepo.create({ songId, explanation })
      );
    }
  }

  return { explanation, fromCache: false };
}

  async getTasteProfile(userId: string) {
    const profile = await this.userTasteRepo.findOne({ where: { userId } });
    if (!profile) return null;
    return {
      favoriteGenres: profile.favoriteGenres,
      recommendedArtists: profile.favoriteArtists,
      moodPattern: (profile.moodPatterns as any)?.pattern ?? '',
    };
  }

  async getMoodStats(userId: string) {
    const moods = await this.userMoodRepo.find({
      where: {userId},
      order: {createdAt: 'DESC'},
      take: 100,
    });

    if (!moods.length) return [];

    // Đếm số lần xuất hiện mood 
    const moodMap: Record<string, number> = {};
    moods.forEach(m => {
      moodMap[m.mood] = (moodMap[m.mood] || 0) + 1;
    });
    
    const total = moods.length;
    return Object.entries(moodMap)
      .sort((a, b) => b[1] = a[1])
      .slice(0, 4)
      .map(([mood, count]) => ({
        mood,
        pct: Math.round((count / total) * 100),
      }));
  }
}
