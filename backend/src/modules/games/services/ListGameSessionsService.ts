import { AppDataSource } from '@shared/typeorm/data-source';
import { GameSession } from '../typeorm/entities/GameSession';

interface IRequest {
	user_id: string;
	limit?: number;
}

export default class ListGameSessionsService {
	public async execute({ user_id, limit = 20 }: IRequest): Promise<GameSession[]> {
		const gameSessionRepository = AppDataSource.getRepository(GameSession);

		const sessions = await gameSessionRepository.find({
			where: { user_id },
			order: { created_at: 'DESC' },
			take: limit,
		});

		return sessions;
	}
}