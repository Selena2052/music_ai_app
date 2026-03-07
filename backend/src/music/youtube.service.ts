import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class YoutubeService {
  constructor(
    private httpService: HttpService,
    private config: ConfigService,
  ) {}

  // tìm video YouTube theo tên bài + artist
  // mục đích: lấy videoId để embed player
  async searchVideo(query: string): Promise<string | null> {
    try {
      const response = await this.httpService.axiosRef.get(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            key: this.config.get('YOUTUBE_API_KEY'),
            q: query,
            part: 'snippet',
            type: 'video',
            videoCategoryId: '10',
            maxResults: 1,
          },
        }
      );
      return response.data.items?.[0]?.id?.videoId || null;

    } catch (error) {
      // quota hết hoặc lỗi bất kỳ → return null, KHÔNG crash
      console.warn('YouTube search skipped:', error?.response?.data?.error?.reason || error.message);
      return null;
    }
  }
}
