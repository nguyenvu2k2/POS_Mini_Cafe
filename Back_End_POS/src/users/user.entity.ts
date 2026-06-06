import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  role_id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  password_hash!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
