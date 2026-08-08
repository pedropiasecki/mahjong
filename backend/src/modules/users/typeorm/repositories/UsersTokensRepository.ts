import { AppDataSource } from "@shared/typeorm/data-source";
import { Repository } from "typeorm";
import UserToken from "../entities/UserToken";

export default class UserTokensRepository {
    private ormRepository: Repository<UserToken>;

    constructor() {
        this.ormRepository = AppDataSource.getRepository(UserToken);
    }

    public async findByToken(token: string): Promise<UserToken | null>{
        const userToken = await this.ormRepository.findOne({ where: {token} });
        return userToken;
    }

    public async generate(user_id: string): Promise<UserToken> {
        const userToken = this.ormRepository.create({ user_id });
        await this.ormRepository.save(userToken);
        return userToken;
    }
}