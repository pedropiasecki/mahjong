import { User } from "@modules/users/typeorm/entities/User";
import path from "path";
import { DataSource } from "typeorm";


export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5433, // 5432 caso n estiver postgres instalado
    username: "postgres",
    password: "docker",
    database: "mahjong_db",
    synchronize: false,
    logging: true,
    entities: [User],
    migrations: [path.join("src", "shared", "typeorm", "migrations", "*.ts")]
});