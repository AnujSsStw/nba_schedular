"use node";
import { v } from "convex/values";
import { query, mutation, internalMutation, action } from "./_generated/server";
import { update_sheet } from ".";

export const send = action({
  args: {
    team: v.string(),
  },
  handler: async (ctx, { team }) => {
    await update_sheet(team);
  },
});
