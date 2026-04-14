import path from "node:path";

import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, ".env")
});

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import serverless from "serverless-http"
import { clerkMiddleware, createClerkClient } from '@clerk/express';

import {
  courseRouter,
  clerkUserRouter,
  transactionRouter,
  userCourseProgressRouter,
} from "./routes";
import seed from "./seed/seedDynamodb";

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
app.use("/users/course-progress", userCourseProgressRouter);

// Server
const port = process.env.PORT || 8001;

if (!isProduction) {
  app.listen(port, () => {
    console.log(`Server running at: http://localhost:${port}`)
  })
}

// AWS production
const serverlessApp = serverless(app);
export const handler = async (event: any, context: any) => {
  if (event.action === "seed") {
    await (seed);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data seeded successfully" })
    };
  }
  return serverlessApp(event, context);
};
