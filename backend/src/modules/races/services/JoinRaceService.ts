import { AppDataSource } from '@shared/typeorm/data-source';
import AppError from '@shared/errors/AppError';
import { Race } from '../typeorm/entities/Race';
import { RaceParticipant } from '../typeorm/entities/RaceParticipant';

interface IRequest {
	race_id: string;
	user_id: string;
}

export default class JoinRaceService {
	public async execute({ race_id, user_id }: IRequest): Promise<RaceParticipant> {
		const raceRepository = AppDataSource.getRepository(Race);
		const participantRepository = AppDataSource.getRepository(RaceParticipant);

		const race = await raceRepository.findOne({ where: { id: race_id } });
		if (!race) {
			throw new AppError('Race not found', 404);
		}

		if (race.status !== 'waiting') {
			throw new AppError('This race has already started or finished');
		}

		const alreadyJoined = await participantRepository.findOne({
			where: { race_id, user_id },
		});
		if (alreadyJoined) {
			throw new AppError('You already joined this race');
		}

		const participant = participantRepository.create({ race_id, user_id });
		await participantRepository.save(participant);

		return participant;
	}
}