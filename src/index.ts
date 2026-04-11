import path from "node:path";

import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import { clerkMiddleware, createClerkClient } from '@clerk/express';

import courseRouter from "./routes/CourseRoutes";
import clerkUserRouter from "./routes/ClerkUserRoutes";
import transactionRouter from "./routes/TransactionRoutes";

dotenv.config({
  path: path.resolve(__dirname, ".env")
});

const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  dynamoose.aws.ddb.local();
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!
});

const app = express();

app.use(express.json());

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(morgan("common"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors());

app.use(clerkMiddleware());

// Routes
app.get("/", (_, res) => {
  res.send("Hello, World!")
});

app.use("/courses", courseRouter);
app.use("/users/clerk", clerkUserRouter);
app.use("/transactions", transactionRouter);

// Server
const port = process.env.PORT || 8001;

if (!isProduction) {
  app.listen(port, () => {
    console.log(`Server running at: http://localhost:${port}`)
  })
}