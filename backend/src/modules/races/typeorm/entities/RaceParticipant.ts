import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Unique,
} from 'typeorm';
import { User } from '@modules/users/typeorm/entities/User';
import { Race } from './Race';

// 'racing'    = ainda participando (jogando ou esperando a corrida começar)
// 'finished'  = terminou o tabuleiro (tem placement)
// 'abandoned' = desistiu antes de terminar (nunca tem placement)
export type RaceParticipantStatus = 'racing' | 'finished' | 'abandoned';

// Um jogador só pode entrar em uma corrida uma vez (ver @Unique abaixo).
// finished_at é preenchido tanto ao terminar quanto ao desistir — marca
// quando a participação dessa pessoa nessa corrida acabou, por qualquer
// motivo. duration_seconds/moves_count/placement só existem de verdade
// quando status='finished'.
@Entity('race_participants')
@Unique('UQ_race_participant', ['race_id', 'user_id'])
export class RaceParticipant {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	race_id: string;

	@Column()
	user_id: string;

	@Column({ type: 'varchar', default: 'racing' })
	status: RaceParticipantStatus;

	@Column({ type: 'int', nullable: true })
	duration_seconds: number | null;

	@Column({ type: 'int', nullable: true })
	moves_count: number | null;

	// Pontos acumulados do bônus "3 pares em 10s" (ver COMBO_WINDOW_MS no
	// main.js) — hoje só informativo, ainda não entra na fórmula de
	// colocação (ver nota em FinishRaceService).
	@Column({ type: 'int', default: 0 })
	bonus_points: number;

	// 1 = primeiro a terminar, 2 = segundo, etc. Null enquanto não termina
	// (e sempre null pra quem desistiu).
	@Column({ type: 'int', nullable: true })
	placement: number | null;

	@Column({ type: 'timestamp', nullable: true })
	finished_at: Date | null;

	@CreateDateColumn()
	joined_at: Date;

	@ManyToOne(() => Race)
	@JoinColumn({ name: 'race_id' })
	race: Race;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'user_id' })
	user: User;
}