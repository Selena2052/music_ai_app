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
    const apiKey = this.config.get('YOUTUBE_API_KEY');

    const response = await firstValueFrom(
      this.httpService.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: apiKey,
          q: query,
          part: 'snippet',
          type: 'video',
          videoCategoryId: '10', // category 10 = Music
          maxResults: 1,
        },
      }),
    ) as any;

    const items = response.data.items;
    if (!items || items.length === 0) return null;

    // trả về videoId để frontend dùng embed YouTube player
    return items[0].id.videoId;
  }
}