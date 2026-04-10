import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import * as dynamoose from "dynamoose";
import { createClerkClient } from "@clerk/express";

import courseRouter from "./routes/CourseRoutes";
import clerkUserRouter from "./routes/ClerkUserRoutes";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  dynamoose.aws.ddb.local();
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || ""
});

const app = express();

app.use(express.json());

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(morgan("common"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

app.use(cors());

// Routes
app.get("/", (_, res) => {
  res.send("Hello, World!")
});

app.use("/courses", courseRouter);
app.use("/users/clerk", clerkUserRouter);

// Server
const port = process.env.PORT || 8001;

if (!isProduction) {
  app.listen(port, () => {
    console.log(`Server running at: http://localhost:${port}`)
  })
}