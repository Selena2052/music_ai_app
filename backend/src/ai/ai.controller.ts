import { Controller, Post, Get, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('mood')
  detectMood(@Request() req, @Body('message') message: string) {
    return this.aiService.detectMood(message, req.user.userId);
  }

  @Post('story')
  generateStory(
    @Body('title') title: string,
    @Body('artist') artist: string,
    @Body('spotifyId') spotifyId?: string,

  ) {
    return this.aiService.generateStory(title, artist, spotifyId);
  }

  @Post('explain-lyrics')
  explainLyrics(
    @Body('lyrics') lyrics: string,
    @Body('title') title: string,
    @Body('artist') artist: string,
    @Body('spotifyId') spotifyId?: string,
  ) {
    return this.aiService.explainLyrics(lyrics, title, artist, spotifyId);
  }

  @Post('vibe-next')
  getNextVibeTrack(
    @Body('title') title: string,
    @Body('artist') artist: string,
    @Body('mood') mood: string,
  ) {
    return this.aiService.getNextVibeTrack(title, artist, mood);
  }

  @Post('chat')
  chat(
    @Request() req,
    @Body('message') message: string,
    @Body('history') history: { role: string; content: string }[],
  ) {
    return this.aiService.chat(message, history || [], req.user.userId);
  }

  @Get('chat/history')
  getChatHistory(@Request() req) {
    return this.aiService.getChatHistory(req.user.userId);
  }

  @Delete('chat/history')
  clearChatHistory(@Request() req) {
    return this.aiService.clearChatHistory(req.user.userId);
  }

  @Post('analyze-taste')
  analyzeUserTaste(
    @Request() req,
    @Body('history') history: { title: string; artist: string }[]
  ) {
    return this.aiService.analyzeUserTaste(history, req.user.userId);
  }

  @Get('taste-profile')
  getTasteProfile(@Request() req) {
    return this.aiService.getTasteProfile(req.user.userId);
  }

  @Get('mood-stats')
  getMoodStats(@Request() req) {
    return this.aiService.getMoodStats(req.user.userId);
  }
}