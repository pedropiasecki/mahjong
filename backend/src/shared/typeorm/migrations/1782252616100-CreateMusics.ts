import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMusics1782252616100 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE TABLE "musics" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "duration" integer NOT NULL,
        "genre" varchar NOT NULL,
        "release_date" date NOT NULL,
        "language" varchar NOT NULL,
        "author_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "musics"`);
	}
}