"use node";
import { v } from "convex/values";
import { update_sheet } from ".";
import { internalAction } from "./_generated/server";

export const send = internalAction({
  args: {
    team1: v.string(),
    team2: v.string(),
  },
  handler: async (ctx, { team1, team2 }) => {
    await update_sheet(team1);
    await update_sheet(team2);
    return "Done";
  },
});
