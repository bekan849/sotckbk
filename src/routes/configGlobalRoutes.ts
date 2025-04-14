import { Router } from "express";
import {
  getConfigGlobalController,
  setConfigGlobalController,
} from "../controllers/configGlobalController";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get("/", asyncHandler(getConfigGlobalController));

router.post("/", asyncHandler(setConfigGlobalController));

export default router;
