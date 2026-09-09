import { AppDataSource } from '@shared/typeorm/data-source';
import { Race } from '../typeorm/entities/Race';
import { RaceParticipant } from '../typeorm/entities/RaceParticipant';

interface IRequest {
	status?: 'waiting' | 'running' | 'finished';
	limit?: number;
}

export interface RaceListItem {
	id: string;
	map_layout: string;
	status: string;
	created_by: string;
	created_at: Date;
	participant_count: number;
}

// Lista para a tela de "salas abertas" — por padrão só mostra as que ainda
// aceitam gente (status='waiting'), mais recentes primeiro.
export default class ListRacesService {
	public async execute({ status = 'waiting', limit = 20 }: IRequest): Promise<RaceListItem[]> {
		const raceRepository = AppDataSource.getRepository(Race);
		const participantRepository = AppDataSource.getRepository(RaceParticipant);

		const races = await raceRepository.find({
			where: { status },
			order: { created_at: 'DESC' },
			take: limit,
		});

		if (races.length === 0) {
			return [];
		}

		const counts = await participantRepository
			.createQueryBuilder('rp')
			.select('rp.race_id', 'race_id')
			.addSelect('COUNT(*)', 'count')
			.where('rp.race_id IN (:...raceIds)', { raceIds: races.map(r => r.id) })
			.groupBy('rp.race_id')
			.getRawMany<{ race_id: string; count: string }>();
		const countByRaceId = new Map(counts.map(c => [c.race_id, Number(c.count)]));

		return races.map(race => ({
			id: race.id,
			map_layout: race.map_layout,
			status: race.status,
			created_by: race.created_by,
			created_at: race.created_at,
			participant_count: countByRaceId.get(race.id) ?? 0,
		}));
	}
}