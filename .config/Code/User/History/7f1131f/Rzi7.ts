import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import os from "os";
import { sendSuccessMessage } from "./src/utils";
import personRoutes from "./routes/persons";
import dheetoRoutes from "./routes/dheeto"



dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
drizzle(process.env.DB_FILE_NAME!);

app.get("/", (_, res) => sendSuccessMessage(res, "hello from backend"));
app.use("/", personRoutes);
app.use("/", dheetoRoutes);
// app.use("/", personRoutes);
// app.use("/", personRoutes);



const port = process.env.PORT || 3000;  
app.listen(port, () => {
  const ip = Object.values(os.networkInterfaces())
    .flat()
    .find((net) => net?.family === "IPv4" && !net.internal)?.address;
  console.log(`dheeto-backend running on http://${ip || "localhost"}:${port}`);
});


