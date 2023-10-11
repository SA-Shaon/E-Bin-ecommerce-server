import { comparePassword, hashPassword } from "../helpers/auth.js";
import User from "../medels/user.js";
import jwt from "jsonwebtoken";
/*
  Things to fix before saving user to db:
    add validation
    check if email is taken
    hash password
*/
export const register = async (req, res) => {
  try {
    // 1. destructure name, email, password, from req.body
    const { name, email, password, role } = req.body;
    if (!name.trim()) {
      return res.json({ error: "Name is required" });
    }
    if (!email) {
      return res.json({ error: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.json({ error: "Password must be at least 6 digit long" });
    }
    // 2. check if email is taken
    const existUser = await User.findOne({ email: email });
    if (existUser) {
      return res.json({ error: "Email is already taken" });
    }
    // 3. hash password
    const hashedPassword = await hashPassword(password);
    // 4. register user
    const user = await new User({
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
    }).save();
    // 6. create signed jwt
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // 5. send response
    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      },
      token,
    });
  } catch (err) {
    console.log(err);
  }
};
export const login = async (req, res) => {
  try {
    // 1. destructure name, email, password, from req.body
    const { email, password } = req.body;
    if (!email) {
      return res.json({ error: "Please Input Email!" });
    }
    if (!password || password.length < 6) {
      return res.json({ error: "Password must be at least 6 digit long" });
    }
    // 2. check if email is taken
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({ error: "User not found!" });
    }
    // 3. hash password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({ error: "wrong password!" });
    }
    // 6. create signed jwt
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // 5. send response
    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      },
      token,
    });
  } catch (err) {
    console.log(err);
  }
};

export const secret = async (req, res) => {
  res.json({ currentUser: req.user });
};
