import { Author } from "@modules/authors/typeorm/entities/Author";
import Music from "@modules/musics/typeorm/entities/Music";
import { Playlist } from "@modules/playlists/typeorm/entitites/Playlist";
import User from "@modules/users/typeorm/entities/User";
import path from "path";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5433, // 5432 caso n estiver postgres instalado
    username: "postgres",
    password: "docker",
    database: "apimusicas",
    synchronize: false,
    logging: true,
    entities: [Music, Author, User, Playlist],
    migrations: [path.join("src", "shared", "typeorm", "migrations", "*.ts")]
});