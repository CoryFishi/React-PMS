import mongoose from "mongoose";
import dotenv from "dotenv";
import { buildApp } from "./app.js";

dotenv.config();

const app = buildApp();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("🟢 Database connected");
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`🟢 Server is running on port ${port}`));
  })
  .catch((err) => {
    console.error("🔴 Database not connected:", err);
    process.exit(1);
  });
