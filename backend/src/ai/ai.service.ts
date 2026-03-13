import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { ChatHistory, UserMood } from './ai.entity';

@Injectable()
export class AiService {
  constructor(
    private httpService: HttpService,
    private config: ConfigService,

    @InjectRepository(ChatHistory)
    private chatHistoryRepo: Repository<ChatHistory>,

    @InjectRepository(UserMood)
    private userMoodRepo: Repository<UserMood>,
  ) {}

  private async callGroq(prompt: string): Promise<string> {
    const apiKey = this.config.get('GROQ_API_KEY'); 
    const response = await firstValueFrom(
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
    ) as any;
    return response.data.choices[0].message.content;
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
        })
      );
    }

    return parsed;
  }

  async generateStory(title: string, artist: string) {
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

    return { story: await this.callGroq(prompt) };
  }

  async explainLyrics(lyrics: string, title: string, artist: string) {
    const prompt = `
      Bạn là chuyên gia phân tích âm nhạc.
      Đây là đoạn lyrics từ bài "${title}" của "${artist}":
      
      "${lyrics}"
      
      Hãy giải thích:
      - Ý nghĩa literal (nghĩa đen)
      - Ý nghĩa ẩn dụ (nghĩa bóng)
      - Cảm xúc mà tác giả muốn truyền đạt
      - Liên hệ với hoàn cảnh thực tế của tác giả
      
      Viết bằng tiếng Việt, dễ hiểu, khoảng 100-150 từ.
    `;

    return { explanation: await this.callGroq(prompt) };
  }

  async getNextVibeTrack(currentTitle: string, currentArtist: string, mood: string) {
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
      .map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.content}`)
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

    return history.map(h => ({
      role: h.role as 'user' | 'ai',
      content: h.content,
    }));
  }

  async clearChatHistory(userId: string) {
    await this.chatHistoryRepo.delete({ userId });
    return { ok: true };
  }

  async analyzeUserTaste(listeningHistory: { title: string; artist: string }[]) {
    const historyText = listeningHistory
      .map(s => `${s.title} - ${s.artist}`)
      .join('\n');

    const prompt = `
      Dựa vào lịch sử nghe nhạc này:
      ${historyText}
      
      Hãy phân tích gu âm nhạc và trả về JSON:
      {
        "favoriteGenres": ["genre1", "genre2"],
        "favoriteEras": ["thập niên hoặc năm"],
        "moodPattern": "mô tả ngắn về xu hướng mood",
        "recommendedArtists": ["artist1", "artist2", "artist3"],
        "personalityInsight": "nhận xét thú vị về tính cách qua nhạc",
        "nextRecommendations": ["search query 1", "search query 2", "search query 3"]
      }
      
      Chỉ trả về JSON, không giải thích thêm.
    `;

    const result = await this.callGroq(prompt);
    const cleaned = result.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}