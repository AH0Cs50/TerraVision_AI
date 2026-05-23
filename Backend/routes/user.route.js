import { Router } from "express";
import { authenticate } from "./../middlewares/auth.middleware.js";
import {
  getUser,
  updateUser,
  deleteUser,
  sendVerificationEmail,
  verifyEmail,
  getEmailStatus,
} from "../controller/user.controller.js";

const router = Router();

router.get("/:id", authenticate, getUser);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);
router.post("/email", authenticate, sendVerificationEmail);
router.get("/email/verify", verifyEmail);
router.get("/email", authenticate, getEmailStatus);

export default router;
