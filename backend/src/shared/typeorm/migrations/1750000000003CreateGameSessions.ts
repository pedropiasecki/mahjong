import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateGameSessions1750000000003 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: 'game_sessions',
				columns: [
					{
						name: 'id',
						type: 'uuid',
						isPrimary: true,
						default: 'uuid_generate_v4()',
					},
					{
						name: 'user_id',
						type: 'uuid',
					},
					{
						name: 'mode',
						type: 'varchar',
						default: "'singleplayer'",
					},
					{
						name: 'map_layout',
						type: 'varchar',
						isNullable: true,
					},
					{
						name: 'tileset',
						type: 'varchar',
						isNullable: true,
					},
					{
						name: 'duration_seconds',
						type: 'int',
					},
					{
						name: 'moves_count',
						type: 'int',
						default: 0,
					},
					{
						name: 'result',
						type: 'varchar',
					},
					{
						name: 'created_at',
						type: 'timestamp',
						default: 'now()',
					},
				],
				foreignKeys: [
					{
						name: 'FK_game_sessions_usuario',
						columnNames: ['user_id'],
						referencedTableName: 'usuarios',
						referencedColumnNames: ['id'],
						onDelete: 'CASCADE',
						onUpdate: 'CASCADE',
					},
				],
			}),
		);

		// Consultas de histórico/ranking sempre filtram por user_id e ordenam
		// por created_at — um índice composto evita table scan conforme a
		// tabela cresce.
		await queryRunner.query(`
			CREATE INDEX IDX_game_sessions_user_created
			ON game_sessions (user_id, created_at DESC)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS IDX_game_sessions_user_created`);
		await queryRunner.dropTable('game_sessions');
	}
}
