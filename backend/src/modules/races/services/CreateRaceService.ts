import crypto from 'crypto';
import { AppDataSource } from '@shared/typeorm/data-source';
import { Race } from '../typeorm/entities/Race';
import { RaceParticipant } from '../typeorm/entities/RaceParticipant';

interface IRequest {
	user_id: string;
	map_layout: string;
}

// A seed não precisa de nenhum algoritmo especial — o engine (stringToSeed
// em rng.js) transforma qualquer string em número via hash. Só precisa ser
// única o bastante pra não repetir corrida sem querer.
function generateSeed(): string {
	return crypto.randomBytes(8).toString('hex');
}

export default class CreateRaceService {
	public async execute({ user_id, map_layout }: IRequest): Promise<Race> {
		return AppDataSource.transaction(async manager => {
			const raceRepository = manager.getRepository(Race);
			const participantRepository = manager.getRepository(RaceParticipant);

			const race = raceRepository.create({
				created_by: user_id,
				map_layout,
				seed: generateSeed(),
				status: 'waiting',
			});
			await raceRepository.save(race);

			// Quem cria a corrida já entra automaticamente como participante.
			const participant = participantRepository.create({
				race_id: race.id,
				user_id,
			});
			await participantRepository.save(participant);

			return race;
		});
	}
}