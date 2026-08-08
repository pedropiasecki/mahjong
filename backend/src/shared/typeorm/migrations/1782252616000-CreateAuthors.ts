import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthors1782252616000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
          CREATE TABLE "authors" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "name" varchar NOT NULL,
            "artistic_name" varchar NOT NULL,
            "nationality" varchar NOT NULL,
            "birth_date" date NOT NULL,
            "about" text NOT NULL,
            "created_at" timestamp NOT NULL DEFAULT now(),
            "updated_at" timestamp NOT NULL DEFAULT now()
          )
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "authors"`);
	}
}