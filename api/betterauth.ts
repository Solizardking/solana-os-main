import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth";

// Vercel serverless catch-all for /api/betterauth/*
// vercel.json routes: /api/betterauth/(.*) → this function
export default toNodeHandler(auth);
