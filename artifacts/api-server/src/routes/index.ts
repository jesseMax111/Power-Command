import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import notificationsRouter from "./notifications";
import statisticsRouter from "./statistics";
import savedLocationsRouter from "./savedLocations";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(reportsRouter);
router.use(notificationsRouter);
router.use(statisticsRouter);
router.use(savedLocationsRouter);

export default router;
