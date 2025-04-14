import { Router, Request, Response, NextFunction } from 'express';
import { login } from '../controllers/authController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();

router.post('/login', asyncHandler(login));

export default router;
