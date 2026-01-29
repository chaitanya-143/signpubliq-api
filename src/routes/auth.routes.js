import express from "express";
import { initiateSignup, verifyEmail, signup, login } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/initiate-signup", initiateSignup);
router.post("/verify-email", verifyEmail);
router.post("/signup", signup);
router.post("/login", login);

export default router;
