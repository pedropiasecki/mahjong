import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlaylists1782269000000 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE TABLE "playlists" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "description" text,
        "user_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_playlists_users" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

		await queryRunner.query(`
      CREATE TABLE "playlist_musics" (
        "playlist_id" uuid NOT NULL,
        "music_id" uuid NOT NULL,
        PRIMARY KEY ("playlist_id", "music_id"),
        CONSTRAINT "FK_playlist_musics_playlists" FOREIGN KEY ("playlist_id") 
          REFERENCES "playlists"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_playlist_musics_musics" FOREIGN KEY ("music_id") 
          REFERENCES "musics"("id") ON DELETE CASCADE
      )
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "playlist_musics"`);
		await queryRunner.query(`DROP TABLE "playlists"`);
	}
}