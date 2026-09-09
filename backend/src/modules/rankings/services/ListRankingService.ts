import { In } from 'typeorm';
import { AppDataSource } from '@shared/typeorm/data-source';
import { GameSession } from '@modules/games/typeorm/entities/GameSession';
import { Profile } from '@modules/profiles/typeorm/entities/Profile';

interface IRequest {
	map_layout?: string;
	limit?: number;
}

export interface RankingEntry {
	position: number;
	user_id: string;
	display_name: string | null;
	avatar_url: string | null;
	best_time_seconds: number;
}

// Ranking por MELHOR TEMPO DE VITÓRIA, agrupado por jogador. Filtrar por
// mapa é o padrão esperado — comparar tempos entre mapas diferentes não
// seria justo (tamanhos/dificuldades diferentes). Sem 'map_layout', cai
// num ranking "geral" que mistura todos os mapas mesmo assim, então o
// front-end deveria sempre mandar o mapa quando fizer sentido.
//
// Implementação simples de propósito: busca todos os jogadores rankeados
// (sem paginação no banco) e corta em memória. Para o tamanho de base de
// usuários que esse projeto tem hoje isso é suficiente e muito mais fácil
// de manter correto do que subqueries de posição; se a tabela crescer
// muito, dá pra revisar com paginação real no banco.
export default class ListRankingService {
	public async execute({ map_layout, limit }: IRequest): Promise<RankingEntry[]> {
		const gameSessionRepository = AppDataSource.getRepository(GameSession);

		const query = gameSessionRepository
			.createQueryBuilder('gs')
			.select('gs.user_id', 'user_id')
			.addSelect('MIN(gs.duration_seconds)', 'best_time_seconds')
			.where('gs.result = :result', { result: 'won' })
			.andWhere('gs.mode = :mode', { mode: 'singleplayer' })
			.groupBy('gs.user_id')
			.orderBy('best_time_seconds', 'ASC');

		if (map_layout) {
			query.andWhere('gs.map_layout = :map_layout', { map_layout });
		}

		if (limit) {
			query.limit(limit);
		}

		const rows = await query.getRawMany<{ user_id: string; best_time_seconds: string }>();

		if (rows.length === 0) {
			return [];
		}

		const profileRepository = AppDataSource.getRepository(Profile);
		const profiles = await profileRepository.find({
			where: { user_id: In(rows.map(row => row.user_id)) },
		});
		const profileByUserId = new Map(profiles.map(profile => [profile.user_id, profile]));

		return rows.map((row, index) => {
			const profile = profileByUserId.get(row.user_id);
			return {
				position: index + 1,
				user_id: row.user_id,
				display_name: profile?.display_name ?? null,
				avatar_url: profile?.avatar_url ?? null,
				best_time_seconds: Number(row.best_time_seconds),
			};
		});
	}
}