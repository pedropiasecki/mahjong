import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUsuarios1750000000000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
		`);

		await queryRunner.createTable(
			new Table({
				name: "usuarios",
				columns: [
					{
						name: "id",
						type: "uuid",
						isPrimary: true,
						default: "uuid_generate_v4()",
					},
					{
						name: "email",
						type: "varchar",
						isUnique: true,
					},
					{
						name: "password",
						type: "varchar",
					},
					{
						name: "status",
						type: "boolean",
						default: true,
					},
					{
						name: "created_at",
						type: "timestamp",
						default: "now()",
					},
					{
						name: "updated_at",
						type: "timestamp",
						default: "now()",
					},
				],
			}),
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropTable("usuarios");
	}
}