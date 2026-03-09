import { Response } from 'express';
import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class YoutubeService {
  constructor(
    private httpService: HttpService,
    private config: ConfigService,
    @Inject(CACHE_MANAGER) private cache: Cache,    // inject redis cache
  ) {}

  // tìm video YouTube theo tên bài + artist
  // mục đích: lấy videoId để embed player
  async searchVideo(query: string): Promise<string | null> {
    // Check cache - 0 units nếu có 
    const cacheKey = `yt:${query}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) {
      console.log(`Cache HIT: ${query}`);
      return cached;
    }

    // cache miss call api yt (-100 units)
    try {
      console.log(`Cache MISS, calling YouTube API: ${query}`);
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

      const videoId = response.data.items?.[0]?.id?.videoId || null;

      // Lưu vào cache — kể cả null để tránh gọi lại cho bài không có video
      if (videoId) {
        await this.cache.set(cacheKey, videoId);
      }

      return videoId;

    } catch (error) {
      const reason = error?.response?.data?.error?.errors?.[0]?.reason;

      if (reason === 'quotaExceeded') {
        console.error('Youtube quota exceeded!');
      } else {
        console.warn('YouTube search failed:', reason || error.message);
      }
      return null;
    }
  }
}
