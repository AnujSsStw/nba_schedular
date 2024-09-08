import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const create_nba_schedule = internalAction({
  args: {
    year: v.number(),
  },
  handler: async (ctx, { year }) => {
    const URL = `https://data.nba.com/data/10s/v2015/json/mobile_teams/nba/${year}/league/00_full_schedule.json`;

    const res = await fetch(URL);
    const data = await res.json();

    const games: Array<{
      date: string;
      home: string;
      visitor: string;
    }> = data.lscd.reduce((acc, month) => {
      const monthGames = month.mscd.g.map((game) => {
        return {
          date: game.gdte,
          home: game.h.ta,
          visitor: game.v.ta,
        };
      });
      return acc.concat(monthGames);
    }, []);

    console.log(games.length);

    for (const game of games) {
      const date = new Date(game.date);
      await ctx.scheduler.runAt(date, internal.update_sheets.send, {
        team1: game.home,
        team2: game.visitor,
      });
    }
    return "Scheduled";
  },
});
