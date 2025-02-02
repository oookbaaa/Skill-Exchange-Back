import { createServer } from "http";
import path from "path";
import { PORT } from "@/config";
import {
  globalErrorHandler,
  globalNotFoundHandler,
} from "@/middlewares/common";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swaggerConfig";

const mongo = require("mongoose");
const db = require("./database/db.json");

mongo
  .connect(db.url)
  .then(console.log("database connected"))
  .catch((err: Error) => {
    console.error("❌ Database connection error:", err.message);
  });
  

export const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of users
 *     responses:
 *       200:
 *         description: Successfully retrieved list
 */

// WebSocket connection for real-time collaboration

// WebSocket connection for real-time collaboration
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("join-session", (sessionId) => {
    socket.join(`session-${sessionId}`);
  });

  socket.on("message", ({ sessionId, message }) => {
    io.to(`session-${sessionId}`).emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

export default app;
