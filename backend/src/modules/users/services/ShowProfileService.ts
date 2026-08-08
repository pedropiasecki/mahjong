import { AppDataSource } from "@shared/typeorm/data-source";
import User from "../typeorm/entities/User";
import AppError from "@shared/errors/AppError";

interface IRequest {
    user_id: string;
}

export default class ShowProfileService {
    public async execute({ user_id }: IRequest): Promise<User> {
        const userRepository = AppDataSource.getRepository(User);

        const user = await userRepository.findOne({ where: { id: user_id }});
        if (!user) {
            throw new AppError("User not found.");
        }

        return user;
    }
}