import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
    usePlural: true, 
  }),
  advanced: {
    database: {
      generateId: false,   
    },
  },
  user: {
    fields: {
      name: "username",     
      image: "avatarUrl",    
    },
    additionalFields: {
      role: { type: "string", input: false }, 
      isSuspended: { type: "boolean", input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});