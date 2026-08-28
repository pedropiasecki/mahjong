import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserTokens1750000000001 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: 'user_tokens',
				columns: [
					{
						name: 'id',
						type: 'uuid',
						isPrimary: true,
						default: 'uuid_generate_v4()',
					},
					{
						name: 'token',
						type: 'uuid',
						isUnique: true,
						default: 'uuid_generate_v4()',
					},
					{
						name: 'user_id',
						type: 'uuid',
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
						name: 'FK_user_tokens_usuario',
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
		await queryRunner.dropTable('user_tokens');
	}
}