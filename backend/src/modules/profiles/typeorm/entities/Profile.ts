import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToOne,
	JoinColumn,
} from 'typeorm';
import { User } from '@modules/users/typeorm/entities/User';

// Perfil "público" do jogador — separado do User (que cuida só de login/senha).
// games_played / wins / losses / best_time_seconds são um CACHE calculado a
// partir de GameSession sempre que uma partida é registrada. Se algum dia os
// números ficarem inconsistentes, dá pra recalcular tudo agregando a tabela
// game_sessions — por isso o histórico completo nunca é jogado fora.
@Entity('profiles')
export class Profile {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true })
	user_id: string;

	@Column({ nullable: true })
	display_name: string;

	@Column({ nullable: true })
	avatar_url: string;

	@Column({ type: 'text', nullable: true })
	bio: string;

	@Column({ default: 0 })
	games_played: number;

	@Column({ default: 0 })
	wins: number;

	@Column({ default: 0 })
	losses: number;

	// Menor tempo (em segundos) entre as partidas vencidas. Null até a
	// primeira vitória.
	@Column({ type: 'int', nullable: true })
	best_time_seconds: number;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;

	@OneToOne(() => User)
	@JoinColumn({ name: 'user_id' })
	user: User;
}