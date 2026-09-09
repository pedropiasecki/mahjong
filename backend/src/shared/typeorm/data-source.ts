import { User } from "@modules/users/typeorm/entities/User";
import { Profile } from "@modules/profiles/typeorm/entities/Profile";
import { GameSession } from "@modules/games/typeorm/entities/GameSession";
import path from "path";
import { DataSource } from "typeorm";
import { Race } from "@modules/races/typeorm/entities/Race";
import { RaceParticipant } from "@modules/races/typeorm/entities/RaceParticipant";


export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5433, // 5432 caso n estiver postgres instalado
    username: "postgres",
    password: "docker",
    database: "mahjong_db",
    synchronize: false,
    logging: true,
    entities: [User, Profile, GameSession, Race, RaceParticipant],
    migrations: [path.join("src", "shared", "typeorm", "migrations", "*.ts")]
});