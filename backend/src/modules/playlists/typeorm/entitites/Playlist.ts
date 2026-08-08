import Music from "@modules/musics/typeorm/entities/Music";
import User from "@modules/users/typeorm/entities/User";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn } from "typeorm";

@Entity("playlists")
export class Playlist {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    title: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToMany(() => Music)
    @JoinTable({
        name: "playlist_musics",
        joinColumn: { name: "playlist_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "music_id", referencedColumnName: "id" }
    })
    musics: Music[];

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}