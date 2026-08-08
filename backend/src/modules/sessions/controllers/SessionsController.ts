import { NextFunction, Request, Response } from "express";
import CreateSessionsService from "../services/CreateSessionsService";

export default class SessionsController {
    public async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            const service = new CreateSessionsService();
            const result = await service.execute({ email, password, });

            return res.json(result);
        } catch (err) {
            next(err);
        }
    }
}