import { readFileSync } from "fs";
import vm from "vm";
// Reuses db.test.mjs's setup code (importing it would run its checks and exit).
const src = readFileSync(new URL("./db.test.mjs", import.meta.url), "utf8");
const setup = src.slice(0, src.indexOf("let pass = 0"));
const helpers = src.slice(src.indexOf("// Run SQL as a given user"), src.indexOf("// ── gate 1 ──"));
const shell = readFileSync(new URL("../dashboards/template/shell.js", import.meta.url), "utf8");

const ctx = {}; vm.createContext(ctx);
vm.runInContext(shell + "\nthis.VIDEO_ACTIONS=VIDEO_ACTIONS; this.videoActionsFor=videoActionsFor; this.videoFromRow=videoFromRow; this.videoFieldsToRow=videoFieldsToRow; this.STATUS_ORDER=STATUS_ORDER;", ctx);

const body = `
const statuses = [...ctx.STATUS_ORDER, "rejected"];
let mismatches = 0, cases = 0;
const who = { client: { "self-serve": [U.cl, C.self], "concierge": [U.clCon, C.con] } };
for (const system of ["self-serve", "concierge"]) {
  const [uid, cid] = who.client[system];
  for (const status of statuses) {
    for (const [key, a] of Object.entries(ctx.VIDEO_ACTIONS)) {
      if (a.role === "operator") continue;
      if (a.role === "editor" && system === "concierge") continue;
      const approved = status === "concept_pending";
      const id = (await db.query("insert into social_videos (client_id,title,status,editor_id,concept_approved_at) values ($1,'t',$2,$3,$4) returning id",
        [cid, status, U.ed, approved ? new Date().toISOString() : null])).rows[0].id;
      const r = a.role === "editor"
        ? await as(U.ed, "select status from social_editor_mark_delivered($1)", [id])
        : await as(uid, "select status from social_client_video_action($1,$2,$3)", [id, key, "a note"]);
      const dbOk = !r.error && r.rows[0].status === a.to;
      const uiOk = ctx.videoActionsFor({ status, conceptApprovedAt: approved ? "x" : null }, a.role, system).includes(key);
      cases++;
      if (dbOk !== uiOk) { mismatches++; console.log("MISMATCH", system, status, key, { dbOk, uiOk, err: r.error }); }
    }
  }
}
for (const approved of [false, true]) for (const status of statuses) {
  const id = (await db.query("insert into social_videos (client_id,title,status,concept_approved_at) values ($1,'t',$2,$3) returning id",
    [C.self, status, approved ? new Date().toISOString() : null])).rows[0].id;
  const r = await as(U.op, "select * from social_operator_approve_concept($1)", [id]);
  const uiOk = ctx.videoActionsFor({ status, conceptApprovedAt: approved ? "x" : null }, "operator", "self-serve").includes("approve_concept_owner");
  cases++;
  if (!r.error !== uiOk) { mismatches++; console.log("MISMATCH operator", status, approved, r.error); }
}
// mapper round trip
const row = (await db.query("select * from social_videos limit 1")).rows[0];
const v = ctx.videoFromRow(row);
const back = ctx.videoFieldsToRow(v);
const writable = Object.keys(back).every(c => c in row) && !("concept_approved_at" in back) && !("id" in back);
console.log(cases + " cases, " + mismatches + " mismatches; mapper round trip " + (writable ? "ok" : "BAD"));
console.log("partial patch:", JSON.stringify(ctx.videoFieldsToRow({ caption: "", dueToFilm: "2026-10-01" })));
process.exit(mismatches || !writable ? 1 : 0);
`;
const AsyncFunction = (async () => {}).constructor;
const migDir = new URL("../supabase/migrations/", import.meta.url).pathname;
const code = setup.replace(/^import .*$/gm, "").replace(/^const MIG = .*$/m, `const MIG = ${JSON.stringify(migDir)};`) + helpers + body;
await new AsyncFunction("PGlite", "readFileSync", "ctx", code)((await import("@electric-sql/pglite")).PGlite, readFileSync, ctx);
