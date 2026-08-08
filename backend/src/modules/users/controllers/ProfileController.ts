import { NextFunction, Request, response, Response } from "express";
import ShowProfileService from "../services/ShowProfileService";
import UpdateProfileService from "../services/UpdateProfileService";

export default class ProfileController {
    public async show(req: Request, res: Response, next: NextFunction): Promise<Response>{
        try {
            const showProfile = new ShowProfileService();
            const user_id = req.user.id;
            const user = await showProfile.execute({ user_id });
            return res.json(user);
        } catch (err) {
            next(err);
            return res;
        }
    }

    public async update(req: Request, res: Response, next: NextFunction): Promise<Response> {
        try {
            const user_id = req.user.id;
            const { name, email, password, old_password } = req.body;
            const updateProfile = new UpdateProfileService();
            const user = await updateProfile.execute({
                user_id,
                name,
                email,
                password,
                old_password
            });
            return res.json(user);
        } catch (err) {
            next(err);
            return res;
        }
    }
}