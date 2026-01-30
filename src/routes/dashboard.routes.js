import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";

const router = express.Router();

// Protected route to get dashboard summary
// The verifyJWT middleware ensures only logged-in users can access this
router.get("/summary/:userId",verifyJWT, getDashboardSummary);

export default router;
