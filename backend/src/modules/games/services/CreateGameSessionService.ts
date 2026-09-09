import { AppDataSource } from '@shared/typeorm/data-source';
import { Profile } from '@modules/profiles/typeorm/entities/Profile';
import { GameSession, GameMode, GameResult } from '../typeorm/entities/GameSession';

interface IRequest {
	user_id: string;
	mode: GameMode;
	map_layout?: string;
	tileset?: string;
	duration_seconds: number;
	moves_count?: number;
	result: GameResult;
}

// Registra a partida em game_sessions (histórico permanente) e, na
// sequência, atualiza o cache de estatísticas em Profile. As duas escritas
// rodam na mesma transação: ou a partida E o contador são salvos juntos, ou
// nenhum dos dois — evitando um histórico com um jogo a mais/a menos do que
// o profile mostra.
export default class CreateGameSessionService {
	public async execute({
		user_id,
		mode,
		map_layout,
		tileset,
		duration_seconds,
		moves_count = 0,
		result,
	}: IRequest): Promise<GameSession> {
		return AppDataSource.transaction(async (manager) => {
			const gameSessionRepository = manager.getRepository(GameSession);
			const profileRepository = manager.getRepository(Profile);

			const gameSession = gameSessionRepository.create({
				user_id,
				mode,
				duration_seconds,
				moves_count,
				result,
				...(map_layout !== undefined ? { map_layout } : {}),
				...(tileset !== undefined ? { tileset } : {}),
			});

			await gameSessionRepository.save(gameSession);

			const profile = await profileRepository.findOne({ where: { user_id } });

			// Só existe se o cadastro tiver criado o profile corretamente
			// (ver CreateProfileService); se por algum motivo não existir,
			// a partida ainda fica salva no histórico — só o cache que não
			// é atualizado agora.
			//
			// 'abandoned' NÃO mexe em nada aqui — nem games_played, nem
			// wins/losses. Desistir (trocar de mapa no meio, ou sair de uma
			// corrida) não é uma "partida jogada" pras estatísticas; ela
			// ainda fica registrada em game_sessions pro histórico, só não
			// conta pro perfil.
			if (profile && result !== 'abandoned') {
				profile.games_played += 1;

				if (result === 'won') {
					profile.wins += 1;

					if (
						profile.best_time_seconds === null ||
						duration_seconds < profile.best_time_seconds
					) {
						profile.best_time_seconds = duration_seconds;
					}
				} else if (result === 'lost') {
					profile.losses += 1;
				}

				await profileRepository.save(profile);
			}

			return gameSession;
		});
	}
}