import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusToRaceParticipants1750000000006 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.addColumn(
			'race_participants',
			new TableColumn({
				name: 'status',
				type: 'varchar',
				default: "'racing'",
			}),
		);

		// Linhas que já existiam antes dessa coluna existir: quem já tinha
		// finished_at preenchido terminou de verdade (status='finished');
		// o resto continua 'racing' (valor padrão da coluna nova).
		await queryRunner.query(`
			UPDATE race_participants
			SET status = 'finished'
			WHERE finished_at IS NOT NULL
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropColumn('race_participants', 'status');
	}
}