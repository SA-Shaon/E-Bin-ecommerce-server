import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRouters from "./routes/auth.js";
import categoryRouters from "./routes/category.js";
import productRouters from "./routes/product.js";
import morgan from "morgan";
import cors from "cors";

const app = express();
dotenv.config();

// Database
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "E-Bin",
  })
  .then(() => console.log("db connect"))
  .catch((err) => console.log("DB ERROR => ", err));

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

// router middleware
app.use("/api", authRouters);
app.use("/api", categoryRouters);
app.use("/api", productRouters);

// Listener
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`listening from port: ${port}`);
});
