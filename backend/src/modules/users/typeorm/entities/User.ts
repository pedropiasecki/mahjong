import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from 'typeorm';

@Entity('usuarios')
export class User {
	@PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
	name: string;

	@Column({ unique: true })
	email: string;

	@Column()
	password: string;

	@Column({ default: true })
	status: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}