import Music from "@modules/musics/typeorm/entities/Music";
import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany} from "typeorm";

@Entity("authors")
export class Author {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    name: string;

    @Column({ name: "artistic_name", type: "varchar" })
    artisticName: string;

    @Column({ type: "varchar" })
    nationality: string;

    @Column({ name: "birth_date", type: "date" })
    birthDate: Date;

    @Column({ type: "text" })
    about: string;

    @OneToMany(() => Music, (music) => music.author)
    musics: Music[];

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}