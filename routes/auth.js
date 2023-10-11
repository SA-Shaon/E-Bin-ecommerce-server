import express from "express";
// import from controller
import { register, login, secret } from "../controllers/auth.js";
import { requireSignin, isAdmin } from "../middlewares/requireSignin.js";

const router = express.Router();

// routes
router.post("/register", register);
router.post("/login", login);
router.get("/auth-check", requireSignin, (req, res) => {
  res.json({ ok: true });
});
router.get("/admin-check", requireSignin, isAdmin, (req, res) => {
  res.json({ ok: true });
});

// testing
router.get("/secret", requireSignin, isAdmin, secret);

export default router;
