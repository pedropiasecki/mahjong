import { Author } from "@modules/authors/typeorm/entities/Author";
import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";

@Entity('musics')
export default class Music {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('int')
    duration: number;

    @Column()
    genre: string;

    @Column('date')
    release_date: Date;

    @Column()
    language: string;

    @ManyToOne(() => Author, (author) => author.musics, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author: Author;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}