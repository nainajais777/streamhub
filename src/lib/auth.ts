import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
    usePlural: true, // humari tables plural hain: users, sessions, accounts
  }),
  advanced: {
    database: {
      generateId: false,   // ye naya add karo
    },
  },
  user: {
    fields: {
      name: "username",      // Better Auth ka "name" -> humara "username"
      image: "avatarUrl",    // Better Auth ka "image" -> humara "avatarUrl"
    },
    additionalFields: {
      role: { type: "string", input: false }, // read-only, khud change nahi kar sakte signup se
      isSuspended: { type: "boolean", input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});