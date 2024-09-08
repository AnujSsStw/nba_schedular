"use node";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetCell,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { nba_teams } from "./map";

export async function update_sheet(team: string) {
  // Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
  const serviceAccountAuth = new JWT({
    // env var values here are copied from service account credentials generated by google
    // see "Authentication" section in docs for more info
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL as string,
    key: process.env.GOOGLE_PRIVATE_KEY as string,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(
    process.env.GOOGLE_SPREADSHEET_ID as string,
    serviceAccountAuth
  );

  if (!team) {
    console.error("Please provide a team name");
    process.exit(1);
  }

  await doc.loadInfo(); // loads document properties and worksheets

  const assists = doc.sheetsByTitle["Assists"];
  const points = doc.sheetsByTitle["Points"];
  const rebounds = doc.sheetsByTitle["Rebounds"];
  const t = doc.sheetsByTitle[nba_teams[team]];

  let assist_number = await get_number(assists, team);

  let points_number = await get_number(points, team);

  let rebounds_number = await get_number(rebounds, team);

  const team_arr: Team = {
    Points: [],
    Rebounds: [],
    Assists: [],
  };
  try {
    console.log(t.title);

    // Load Points
    await t.loadCells("F:F");
    await t.loadCells("Q:Q");
    // Load Rebounds
    await t.loadCells("I:I");
    await t.loadCells("R:R");
    // Load Assists
    await t.loadCells("J:J");
    await t.loadCells("S:S");

    for (let i = 2; i < t.cellStats.loaded; i++) {
      const cell_f = t.getCellByA1(`F${i}`); // pts
      const cell_i = t.getCellByA1(`I${i}`); // reb
      const cell_j = t.getCellByA1(`J${i}`); // ast

      if (cell_f.value !== 0 && !cell_f.value) {
        console.log("Break at Points", cell_f.columnIndex, cell_f.rowIndex);
        break;
      }
      team_arr.Assists.push(cell_j);
      team_arr.Points.push(cell_f);
      team_arr.Rebounds.push(cell_i);
    }

    if (!team_arr.Points || !team_arr.Rebounds || !team_arr.Assists) {
      console.table(team_arr);
      throw new Error("Error loading cells at teams");
    }

    editCell(
      team_arr,
      {
        Points: points_number,
        Rebounds: rebounds_number,
        Assists: assist_number,
      },
      { Points: "Q", Rebounds: "R", Assists: "S" },
      t
    );
    await t.saveUpdatedCells(); // save all updates in one call
  } catch (error) {
    console.error(error);

    console.error("Error loading cells at teams");
  }
}

async function get_number(
  sheet: GoogleSpreadsheetWorksheet,
  team: string
): Promise<number> {
  let res: number = 0;

  try {
    await sheet.loadCells("B2:B31");
    await sheet.loadCells("M2:M31");

    for (let i = 2; i < 32; i++) {
      (nba_teams[team] as string).includes(
        sheet.getCellByA1(`B${i}`).value as string
      ) && (res = sheet.getCellByA1(`M${i}`).value as number);
    }

    if (res * 100 < 0) {
      res = 1 + Math.abs(res);
    } else {
      res = res * 100;
    }
    console.log(sheet.title, res);
  } catch (error) {
    console.error("Error loading cells at ", sheet.title);
  }
  return res;
}

function editCell(
  obj: Team,
  values: {
    Points: number;
    Rebounds: number;
    Assists: number;
  },
  cell_ids: {
    Points: string;
    Rebounds: string;
    Assists: string;
  },
  t: GoogleSpreadsheetWorksheet
) {
  for (let i = 0; i < obj.Points.length - 1; i++) {
    const cell_p = t.getCellByA1(`${cell_ids.Points}${i + 2}`); // or A1 style notation
    const cell_r = t.getCellByA1(`${cell_ids.Rebounds}${i + 2}`); // or A1 style notation
    const cell_a = t.getCellByA1(`${cell_ids.Assists}${i + 2}`); // or A1 style notation
    cell_p.value = values.Points * (obj.Points[i].value as number);
    cell_r.value = values.Rebounds * (obj.Rebounds[i].value as number);
    cell_a.value = values.Assists * (obj.Assists[i].value as number);
  }
}

type Team = {
  Points: GoogleSpreadsheetCell[];
  Rebounds: GoogleSpreadsheetCell[];
  Assists: GoogleSpreadsheetCell[];
};
