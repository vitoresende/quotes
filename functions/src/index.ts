import * as functions from "firebase-functions";
import * as trpcExpress from "@trpc/server/adapters/express";
import express from "express";
import cors from "cors";
import { appRouter } from "./routers";
import { createContext } from "./context";

const app = express();

app.use(cors({ origin: true }));

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export const api = functions.https.onRequest(app);
