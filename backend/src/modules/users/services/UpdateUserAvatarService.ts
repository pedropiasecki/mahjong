import AppError from "@shared/errors/AppError";
import { UsersRepository } from "../typeorm/repositories/UsersRepository";
import fs from 'fs';
import path from "path";
import uploadConfig from "@config/upload";
import User from "../typeorm/entities/User";

interface IRequest {
    user_id: string;
    avatarFileName: string;
}

export default class UpdateUserAvatarService {
    public async execute( { user_id, avatarFileName }: IRequest): Promise<User> {
        const userRepository = new UsersRepository();

        const user = await userRepository.findById(user_id);
        if (!user) {
            throw new AppError("User not found.");
        }

        if (user.avatar) {
            const userAvatarFilePath = path.join(uploadConfig.directory, user.avatar);
            try {
                const userAvatarFileExists = await fs.promises.stat(userAvatarFilePath)

                if (userAvatarFileExists) {
                    await fs.promises.unlink(userAvatarFilePath)
                }
            } catch (err) {}   
        }

        user.avatar = avatarFileName;
        await userRepository.createUser(user);

        return user;
    }
}