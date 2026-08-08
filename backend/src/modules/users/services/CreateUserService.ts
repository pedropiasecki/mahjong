import AppError from "@shared/errors/AppError";
import User from "../typeorm/entities/User";
import { UsersRepository } from "../typeorm/repositories/UsersRepository";
import { hash } from "bcryptjs";

interface IRequest {
    name: string;
    email: string;
    password: string;
}

export default class CreateUsersService {
    public async execute({ name, email, password }: IRequest): Promise<User>{
        const userRepository = new UsersRepository();

        const emailExists = await userRepository.findByEmail(email);

        if (emailExists){
            throw new AppError("Email address already used");
        }

        const hashedPassword = await hash(password, 8)

        const user = await userRepository.createUser({
            name,
            email,
            password: hashedPassword,
        });

        return user;
    }
}