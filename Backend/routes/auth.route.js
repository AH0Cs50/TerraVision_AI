import { Router } from 'express';
import { signup, login, logout, refresh} from '../controller/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { emailValidator } from '../middlewares/emailValidator.middleware.js'

const router = Router();

// PUBLIC ROUTES
router.post("/signup", signup);
router.post("/login", emailValidator, login);
router.post("/refresh", authenticate, refresh);

// PROTECTED ROUTES
router.post("/logout", authenticate, logout);

export default router;