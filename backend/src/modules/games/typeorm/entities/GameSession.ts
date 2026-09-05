import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { User } from '@modules/users/typeorm/entities/User';

// Hoje só existe 'singleplayer'. 'multiplayer' já fica reservado para quando
// o modo corrida sair do papel — nesse modo, várias GameSession (uma por
// jogador) podem compartilhar um match_id futuro para agrupar o resultado de
// uma mesma corrida (ainda não implementado).
export type GameMode = 'singleplayer' | 'multiplayer';
export type GameResult = 'won' | 'abandoned';

// Um registro por partida jogada até o fim (ou abandonada). É a fonte de
// verdade do histórico — os contadores agregados ficam em Profile, mas
// sempre podem ser recalculados a partir daqui.
@Entity('game_sessions')
export class GameSession {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	user_id: string;

	@Column({ type: 'varchar', default: 'singleplayer' })
	mode: GameMode;

	// Ex.: 'turtle', 'lines', 'checker', 'rings'... (ver engine/random-layout/)
	@Column({ nullable: true })
	map_layout: string;

	@Column({ nullable: true })
	tileset: string;

	@Column({ type: 'int' })
	duration_seconds: number;

	@Column({ type: 'int', default: 0 })
	moves_count: number;

	@Column({ type: 'varchar' })
	result: GameResult;

	@CreateDateColumn()
	created_at: Date;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'user_id' })
	user: User;
}