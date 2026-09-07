import { AppDataSource } from '@shared/typeorm/data-source';
import AppError from '@shared/errors/AppError';
import { Race } from '../typeorm/entities/Race';

interface IRequest {
	race_id: string;
	user_id: string;
}

export default class StartRaceService {
	public async execute({ race_id, user_id }: IRequest): Promise<Race> {
		const raceRepository = AppDataSource.getRepository(Race);

		const race = await raceRepository.findOne({ where: { id: race_id } });
		if (!race) {
			throw new AppError('Race not found', 404);
		}

		if (race.created_by !== user_id) {
			throw new AppError('Only the race creator can start it', 403);
		}

		if (race.status !== 'waiting') {
			throw new AppError('This race has already started or finished');
		}

		race.status = 'running';
		race.started_at = new Date();
		await raceRepository.save(race);

		return race;
	}
}