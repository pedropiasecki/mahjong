import gameRouter from "@modules/games/routes/games.routes";
import profileRouter from "@modules/profiles/routes/profile.routes";
import sessionsRouter from "@modules/sessions/routes/sessions.router";
import usersRouter from "@modules/users/routes/user.routes";
import { Router } from "express";

const routes = Router();

routes.use("/users", usersRouter);
routes.use("/sessions", sessionsRouter);
routes.use("/profiles", profileRouter);
routes.use("/games", gameRouter);

routes.get('/', (request, response) => {
    response.json({message: 'Hello Dev!'});
    return;
})

export default routes;