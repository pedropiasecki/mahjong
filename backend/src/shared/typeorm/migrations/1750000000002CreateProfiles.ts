import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateProfiles1750000000002 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: 'profiles',
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
						isUnique: true,
					},
					{
						name: 'display_name',
						type: 'varchar',
						isNullable: true,
					},
					{
						name: 'avatar_url',
						type: 'varchar',
						isNullable: true,
					},
					{
						name: 'bio',
						type: 'text',
						isNullable: true,
					},
					{
						name: 'games_played',
						type: 'int',
						default: 0,
					},
					{
						name: 'wins',
						type: 'int',
						default: 0,
					},
					{
						name: 'losses',
						type: 'int',
						default: 0,
					},
					{
						name: 'best_time_seconds',
						type: 'int',
						isNullable: true,
					},
					{
						name: 'created_at',
						type: 'timestamp',
						default: 'now()',
					},
					{
						name: 'updated_at',
						type: 'timestamp',
						default: 'now()',
					},
				],
				foreignKeys: [
					{
						name: 'FK_profiles_usuario',
						columnNames: ['user_id'],
						referencedTableName: 'usuarios',
						referencedColumnNames: ['id'],
						onDelete: 'CASCADE',
						onUpdate: 'CASCADE',
					},
				],
			}),
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropTable('profiles');
	}
}
