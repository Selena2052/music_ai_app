import {
  Entity, Column, PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('user_taste_profiles')
export class UserTasteProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // unique: mỗi user chỉ có 1 profile
  @Column({ name: 'user_id', nullable: true, unique: true })
  userId: string;

  @Column({ name: 'favorite_genres', type: 'jsonb', default: [] })
  favoriteGenres: string[];

  @Column({ name: 'favorite_artists', type: 'jsonb', default: [] })
  favoriteArtists: string[];

  @Column({ name: 'bpm_range', type: 'jsonb', default: { min: 60, max: 180 } })
  bpmRange: { min: number; max: number };

  @Column({ name: 'mood_patterns', type: 'jsonb', default: {} })
  moodPatterns: Record<string, any>;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}