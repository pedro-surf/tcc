// src/modules/user/routes.ts
import { Router } from "express";
import { createCrud } from "../utils/crud";

const router = Router();
const userCrud = createCrud("user");

router.get("/", userCrud.getAll);
router.get("/:id", userCrud.getOne);
router.post("/", userCrud.create);
router.patch("/:id", userCrud.update);
router.delete("/:id", userCrud.delete);

export default router;