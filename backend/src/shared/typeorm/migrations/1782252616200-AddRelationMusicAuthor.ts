import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationMusicAuthor1782252616200 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
          ALTER TABLE "musics"
          ADD CONSTRAINT "FK_musics_authors"
          FOREIGN KEY ("author_id")
          REFERENCES "authors"("id")
          ON DELETE CASCADE
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
          ALTER TABLE "musics"
          DROP CONSTRAINT "FK_musics_authors"
        `);
	}
}