import { AppDataSource } from '@shared/typeorm/data-source';
import AppError from '@shared/errors/AppError';
import CreateGameSessionService from '@modules/games/services/CreateGameSessionService';
import { Race } from '../typeorm/entities/Race';
import { RaceParticipant } from '../typeorm/entities/RaceParticipant';

interface IRequest {
	race_id: string;
	user_id: string;
	duration_seconds: number;
	moves_count: number;
	bonus_points?: number;
}

// NOTA sobre bonus_points: por enquanto é só informativo (aparece nos
// participantes da corrida), a colocação (placement) é só por ORDEM DE
// CHEGADA — quem termina primeiro fica em 1o, independente do bônus
// acumulado. Se no futuro o bônus precisar valer pontos de verdade na
// colocação (ex.: descontar tempo), a fórmula entra aqui.
export default class FinishRaceService {
	public async execute({
		race_id,
		user_id,
		duration_seconds,
		moves_count,
		bonus_points = 0,
	}: IRequest): Promise<RaceParticipant> {
		return AppDataSource.transaction(async manager => {
			const raceRepository = manager.getRepository(Race);
			const participantRepository = manager.getRepository(RaceParticipant);

			const race = await raceRepository.findOne({ where: { id: race_id } });
			if (!race) {
				throw new AppError('Race not found', 404);
			}
			if (race.status !== 'running') {
				throw new AppError('This race is not running');
			}

			const participant = await participantRepository.findOne({
				where: { race_id, user_id },
			});
			if (!participant) {
				throw new AppError('You are not part of this race', 403);
			}
			if (participant.finished_at) {
				throw new AppError('You already finished this race');
			}

			const alreadyFinished = await participantRepository
				.createQueryBuilder('rp')
				.where('rp.race_id = :race_id', { race_id })
				.andWhere('rp.finished_at IS NOT NULL')
				.getCount();

			participant.duration_seconds = duration_seconds;
			participant.moves_count = moves_count;
			participant.bonus_points = bonus_points;
			participant.finished_at = new Date();
			participant.placement = alreadyFinished + 1;
			await participantRepository.save(participant);

			// Reaproveita o mesmo fluxo de histórico/estatísticas do
			// singleplayer — mode='multiplayer' já mantém isso fora do
			// ranking por mapa (que só considera singleplayer).
			const createGameSession = new CreateGameSessionService();
			await createGameSession.execute({
				user_id,
				mode: 'multiplayer',
				map_layout: race.map_layout,
				duration_seconds,
				moves_count,
				result: 'won',
			});

			// Se todo mundo que entrou já terminou, encerra a corrida.
			const totalParticipants = await participantRepository.count({ where: { race_id } });
			const totalFinished = alreadyFinished + 1;
			if (totalFinished >= totalParticipants) {
				race.status = 'finished';
				await raceRepository.save(race);
			}

			return participant;
		});
	}
}