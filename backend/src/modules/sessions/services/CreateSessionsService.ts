import { AppDataSource } from "@shared/typeorm/data-source";
import AppError from "@shared/errors/AppError";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import authConfig from "@config/auth";
import { User } from "@modules/users/typeorm/entities/User";

interface IRequest {
    email: string;
    password: string;
}

interface IResponse {
    user: User;
    token: string;
}

export default class CreateSessionsService {
    public async execute({ email, password }: IRequest): Promise<IResponse>{
        const userRepository = AppDataSource.getRepository(User);

        const user = await userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new AppError("Incorrect email/password", 401);
        }

        const passwordConfirmed = await compare(password, user.password);

        if (!passwordConfirmed) {
            throw new AppError("Incorrect email/password", 401);
        }

        const token = sign({}, authConfig.jwt.secret, {
            subject: user.id,
            expiresIn: '1d',
        });

        return { user, token };
    }
}