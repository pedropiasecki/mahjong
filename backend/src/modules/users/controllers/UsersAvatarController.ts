import { NextFunction, Request, Response } from "express";
import UpdateUserAvatarService from "../services/UpdateUserAvatarService";

export default class UsersAvatarController {
    public async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const updateAvatar = new UpdateUserAvatarService();
            const user = await updateAvatar.execute({
                user_id: req.user.id,
                avatarFileName: req.file?.filename as string
            });
            return res.json(user);
        } catch (err) {
            next(err);
        }
    }
}