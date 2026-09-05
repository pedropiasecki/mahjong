import { AppDataSource } from "@shared/typeorm/data-source";
import AppError from "@shared/errors/AppError";
import { hash } from "bcryptjs";
import { User } from "../typeorm/entities/User";

interface IRequest {
    name: string;
	email: string;
	password: string;
}

export default class CreateUserService {
	public async execute({
        name,
		email,
		password,
	}: IRequest): Promise<User> {

		const userRepository = AppDataSource.getRepository(User);

		const userExists = await userRepository.findOne({
			where: { email },
		});

		if (userExists) {
			throw new AppError("Email already in use");
		}

        const nameExists = await userRepository.findOne({
			where: { name },
		});

		if (nameExists) {
			throw new AppError("Name already in use");
		}

		const hashedPassword = await hash(password, 10);

		const user = userRepository.create({
			name,
			email,
			password: hashedPassword,
			status: true,
		});

		await userRepository.save(user);

		return user;
	}
}