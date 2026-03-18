import {
  Controller, Get, Post, Delete, Body, Param,
  UseGuards, Request, Patch
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LibraryService } from './library.service';

@Controller('library')
@UseGuards(AuthGuard('jwt'))
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get('liked')
  getLikedSongs(@Request() req) {
    return this.libraryService.getLikedSongs(req.user.userId);
  }

  @Post('liked')
  likeSong(@Request() req, @Body() songData: any) {
    return this.libraryService.likeSong(req.user.userId, songData);
  }

  @Delete('liked/:spotifyId')
  unlikeSong(@Request() req, @Param('spotifyId') spotifyId: string) {
    return this.libraryService.unlikeSong(req.user.userId, spotifyId);
  }

  @Get('playlists')
  getPlaylists(@Request() req) {
    return this.libraryService.getPlaylists(req.user.userId);
  }

  @Post('playlists')
  createPlaylist(@Request() req, @Body('name') name: string) {
    return this.libraryService.createPlaylist(req.user.userId, name);
  }

  @Patch('playlists/:id/image')
  updatePlaylistImage(
    @Request() req,
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.libraryService.updatePlaylistImage(id, req.user.userId, imageUrl);
  }

  @Delete('playlists/:id')
  deletePlaylist(@Request() req, @Param('id') id: string) {
    return this.libraryService.deletePlaylist(id, req.user.userId);
  }

  @Get('playlists/:id/songs')
  getPlaylistSongs(@Param('id') id: string) {
    return this.libraryService.getPlaylistSongs(id);
  }

  @Post('playlists/:id/songs')
  addSongToPlaylist(@Param('id') id: string, @Body() songData: any) {
    return this.libraryService.addSongToPlaylist(id, songData);
  }

  @Delete('playlists/:id/songs/:spotifyId')
  removeSongFromPlaylist(
    @Param('id') id: string,
    @Param('spotifyId') spotifyId: string,
  ) {
    return this.libraryService.removeSongFromPlaylist(id, spotifyId);
  }

  @Get('history')
  getHistory(@Request() req) {
    return this.libraryService.getListeningHistory(req.user.userId);
  }

  @Post('history')
  addToHistory(@Request() req, @Body() songData: any) {
    return this.libraryService.addToHistory(req.user.userId, songData);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.libraryService.getStats(req.user.userId);
  }

  @Get('top-artists')
  getTopArtists(@Request() req) {
    return this.libraryService.getTopArtists(req.user.userId);
  }
}