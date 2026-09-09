import { AppDataSource } from '@shared/typeorm/data-source';
import AppError from '@shared/errors/AppError';
import CreateGameSessionService from '@modules/games/services/CreateGameSessionService';
import { Race } from '../typeorm/entities/Race';
import { RaceParticipant } from '../typeorm/entities/RaceParticipant';

interface IRequest {
	race_id: string;
	user_id: string;
	moves_count?: number;
}

// Desistir funciona tanto na sala de espera (status='waiting', antes de
// jogar) quanto no meio da corrida (status='running'). Diferente de
// terminar, quem desiste NUNCA recebe placement — só sai da disputa.
export default class AbandonRaceService {
	public async execute({ race_id, user_id, moves_count = 0 }: IRequest): Promise<RaceParticipant> {
		return AppDataSource.transaction(async manager => {
			const raceRepository = manager.getRepository(Race);
			const participantRepository = manager.getRepository(RaceParticipant);

			const race = await raceRepository.findOne({ where: { id: race_id } });
			if (!race) {
				throw new AppError('Race not found', 404);
			}
			if (race.status === 'finished') {
				throw new AppError('This race has already finished');
			}

			const participant = await participantRepository.findOne({
				where: { race_id, user_id },
			});
			if (!participant) {
				throw new AppError('You are not part of this race', 403);
			}
			if (participant.status !== 'racing') {
				throw new AppError('You already finished or left this race');
			}

			const durationSeconds = race.started_at
				? Math.max(0, Math.floor((Date.now() - race.started_at.getTime()) / 1000))
				: 0;

			participant.status = 'abandoned';
			participant.finished_at = new Date();
			participant.duration_seconds = durationSeconds;
			participant.moves_count = moves_count;
			await participantRepository.save(participant);

			// Só entra no histórico se a corrida já tinha começado de fato —
			// desistir ainda na sala de espera não é uma "partida jogada".
			if (race.started_at) {
				const createGameSession = new CreateGameSessionService();
				await createGameSession.execute({
					user_id,
					mode: 'multiplayer',
					map_layout: race.map_layout,
					duration_seconds: durationSeconds,
					moves_count,
					result: 'abandoned',
				});
			}

			// Se todo mundo que entrou já terminou ou desistiu, encerra a
			// corrida (mesma regra usada em FinishRaceService).
			const stillRacing = await participantRepository
				.createQueryBuilder('rp')
				.where('rp.race_id = :race_id', { race_id })
				.andWhere("rp.status = 'racing'")
				.getCount();

			if (stillRacing === 0 && race.status === 'running') {
				race.status = 'finished';
				await raceRepository.save(race);
			}

			return participant;
		});
	}
}