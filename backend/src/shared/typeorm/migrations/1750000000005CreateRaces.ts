import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRaces1750000000005 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: 'races',
				columns: [
					{
						name: 'id',
						type: 'uuid',
						isPrimary: true,
						default: 'uuid_generate_v4()',
					},
					{
						name: 'created_by',
						type: 'uuid',
					},
					{
						name: 'map_layout',
						type: 'varchar',
					},
					{
						name: 'seed',
						type: 'varchar',
					},
					{
						name: 'status',
						type: 'varchar',
						default: "'waiting'",
					},
					{
						name: 'started_at',
						type: 'timestamp',
						isNullable: true,
					},
					{
						name: 'created_at',
						type: 'timestamp',
						default: 'now()',
					},
				],
				foreignKeys: [
					{
						name: 'FK_races_creator',
						columnNames: ['created_by'],
						referencedTableName: 'usuarios',
						referencedColumnNames: ['id'],
						onDelete: 'CASCADE',
						onUpdate: 'CASCADE',
					},
				],
			}),
		);

		await queryRunner.createTable(
			new Table({
				name: 'race_participants',
				columns: [
					{
						name: 'id',
						type: 'uuid',
						isPrimary: true,
						default: 'uuid_generate_v4()',
					},
					{
						name: 'race_id',
						type: 'uuid',
					},
					{
						name: 'user_id',
						type: 'uuid',
					},
					{
						name: 'duration_seconds',
						type: 'int',
						isNullable: true,
					},
					{
						name: 'moves_count',
						type: 'int',
						isNullable: true,
					},
					{
						name: 'bonus_points',
						type: 'int',
						default: 0,
					},
					{
						name: 'placement',
						type: 'int',
						isNullable: true,
					},
					{
						name: 'finished_at',
						type: 'timestamp',
						isNullable: true,
					},
					{
						name: 'joined_at',
						type: 'timestamp',
						default: 'now()',
					},
				],
				foreignKeys: [
					{
						name: 'FK_race_participants_race',
						columnNames: ['race_id'],
						referencedTableName: 'races',
						referencedColumnNames: ['id'],
						onDelete: 'CASCADE',
						onUpdate: 'CASCADE',
					},
					{
						name: 'FK_race_participants_user',
						columnNames: ['user_id'],
						referencedTableName: 'usuarios',
						referencedColumnNames: ['id'],
						onDelete: 'CASCADE',
						onUpdate: 'CASCADE',
					},
				],
				uniques: [
					{
						name: 'UQ_race_participant',
						columnNames: ['race_id', 'user_id'],
					},
				],
			}),
		);

		// A sala de espera e o placar ao vivo sempre filtram por race_id — e
		// listar corridas abertas sempre filtra por status.
		await queryRunner.query(`
			CREATE INDEX IDX_race_participants_race ON race_participants (race_id)
		`);
		await queryRunner.query(`
			CREATE INDEX IDX_races_status ON races (status)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS IDX_races_status`);
		await queryRunner.query(`DROP INDEX IF EXISTS IDX_race_participants_race`);
		await queryRunner.dropTable('race_participants');
		await queryRunner.dropTable('races');
	}
}
