import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRankingIndexToGameSessions1750000000004 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		// O ranking sempre filtra por (result, mode, map_layout) e agrega o
		// MIN(duration_seconds) — um índice composto nessas colunas evita
		// table scan conforme game_sessions cresce.
		await queryRunner.query(`
			CREATE INDEX IDX_game_sessions_ranking
			ON game_sessions (result, mode, map_layout, duration_seconds)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS IDX_game_sessions_ranking`);
	}
}