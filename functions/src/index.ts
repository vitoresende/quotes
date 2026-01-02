import { onRequest } from "firebase-functions/v2/https";
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

export const api = onRequest(app);
