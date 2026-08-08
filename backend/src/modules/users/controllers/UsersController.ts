import { NextFunction, Request, Response } from "express";
import ListUserService from "../services/ListUserService";
import CreateUsersService from "../services/CreateUserService";

export default class UsersController {
    public async index(req: Request, res: Response, next: NextFunction){
        try {
            const service = new ListUserService();
            const users = await service.execute();
            console.log(req.user.id);
            return res.status(200).json(users);
        } catch (err) {
            next(err);
        }
    }

    public async create(req: Request, res: Response, next: NextFunction){
        try {
            const { name, email, password} = req.body;
            const service = new CreateUsersService();
            const user = await service.execute({name, email, password});

            return res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }
}