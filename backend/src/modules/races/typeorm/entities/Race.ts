import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { User } from '@modules/users/typeorm/entities/User';

// 'waiting'  = sala de espera, aceita novos participantes
// 'running'  = já começou, ninguém mais entra
// 'finished' = todos os participantes que entraram já terminaram
export type RaceStatus = 'waiting' | 'running' | 'finished';

// Uma corrida = todos os participantes resolvem o MESMO tabuleiro (mesma
// 'seed', ver engine/rng.js:seedRNG). O tabuleiro em si nunca trafega pela
// rede — cada cliente gera localmente a partir da seed + map_layout, que
// juntos produzem sempre o mesmo resultado (forma E peças).
@Entity('races')
export class Race {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	created_by: string;

	@Column()
	map_layout: string;

	@Column()
	seed: string;

	@Column({ type: 'varchar', default: 'waiting' })
	status: RaceStatus;

	@Column({ type: 'timestamp', nullable: true })
	started_at: Date | null;

	@CreateDateColumn()
	created_at: Date;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'created_by' })
	creator: User;
}