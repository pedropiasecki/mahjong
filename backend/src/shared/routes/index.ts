import gameRouter from "@modules/games/routes/games.routes";
import profileRouter from "@modules/profiles/routes/profile.routes";
import raceRouter from "@modules/races/routes/race.routes";
import rankingRouter from "@modules/rankings/routes/ranking.routes";
import sessionsRouter from "@modules/sessions/routes/sessions.router";
import usersRouter from "@modules/users/routes/user.routes";
import { Router } from "express";

const routes = Router();

routes.use("/users", usersRouter);
routes.use("/sessions", sessionsRouter);
routes.use("/profiles", profileRouter);
routes.use("/games", gameRouter);
routes.use("/ranking", rankingRouter);
routes.use("/races", raceRouter);

routes.get('/', (request, response) => {
    response.json({message: 'Hello Dev!'});
    return;
})

export default routes;