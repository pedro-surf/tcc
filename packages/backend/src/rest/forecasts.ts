// src/modules/user/routes.ts
import { Router } from "express";
import { createCrud } from "./utils/crud";

const router = Router();
const crud = createCrud("spotForecast");

router.get("/:id", crud.getOne);
router.post("/", crud.create);

export default router;