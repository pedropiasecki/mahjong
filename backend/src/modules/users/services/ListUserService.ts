import { AppDataSource } from "@shared/typeorm/data-source";
import { User } from "../typeorm/entities/User";

export default class ListUserService {
	public async execute(): Promise<User[]> {

		const userRepository = AppDataSource.getRepository(User);

		const users = await userRepository.find({
			order: {
				id: "ASC",
			},
		});

		return users;
	}
}