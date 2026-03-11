import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'spotify_id', unique: true, nullable: true })
  spotifyId: string;

  @Column({ name: 'youtube_id', nullable: true })
  youtubeId: string;

  @Column({ length: 500 })
  title: string;

  @Column({ length: 500 })
  artist: string;

  @Column({ length: 500, nullable: true })
  album: string;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string;

  @Column({ name: 'preview_url', length: 500, nullable: true })
  previewUrl: string;

  @Column({ length: 100, nullable: true })
  genre: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}