import { AppDataSource } from "@shared/typeorm/data-source";
import User from "../entities/User";
import { Repository } from "typeorm";

export class UsersRepository {
    private ormRepository: Repository<User>;

    constructor () {
        this.ormRepository = AppDataSource.getRepository(User);
    }
    
    public async findAll(): Promise<User[]> {
        return this.ormRepository.find();
    }

    public async findByName(name: string): Promise<User | null> {
        return this.ormRepository.findOne( { where: { name } });
    }

    public async findById(id: string): Promise<User | null> {
        return this.ormRepository.findOne( { where: { id } });
    }

    public async findByEmail(email: string): Promise<User | null> {
        return this.ormRepository.findOne( { where: { email } });
    }

    public async createUser(userData: Partial<User>): Promise<User>{
        const user = this.ormRepository.create(userData);
        await this.ormRepository.save(user)
        return user;
    }

    public async save(user: User): Promise<User> {
        return await this.ormRepository.save(user);
    }
}