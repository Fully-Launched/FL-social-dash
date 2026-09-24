// The operator's "Approve for client" buttons: stand-ins for the client's
// own Approve on a concept (after gate 1) and on a finished video.
import { freshDb, makeHarness, checker } from "./harness.mjs";

const db = await freshDb();
const { openPage, settle } = makeHarness(db);
const counts = checker();
const chk = (n, cond, x) => counts.check(n, cond, x);

const OP = "00000000-0000-0000-0000-00000000000a";
const FL = "d44e6fc3-dfea-42dc-902c-54724441040d";
const DAD = "d44e6fc3-dfea-42dc-902c-54724441040e";
await db.exec(`
  insert into auth.users values ('${OP}');
  insert into social_operators values ('${OP}','Tait','tait@x');
  insert into social_clients (id,name,slug,client_system) values
    ('${FL}','Fully Launched','test-fully-launched','self-serve'),
    ('${DAD}','Dad Co','dad-co','concierge');
  insert into social_videos (client_id,title,status,concept_approved_at) values
    ('${FL}','Owner-approved concept','concept_pending',now()),
    ('${FL}','Unapproved concept','concept_pending',null),
    ('${FL}','Finished video','client_review',null),
    ('${DAD}','Concierge finished video','client_review',null);
`);

const op = await openPage("operator/dashboard.html", OP, "https://fl.test/operator/dashboard.html");
const row = t => Array.from(op.d.querySelectorAll("#clientWaitingList .row, #ideasList .row"))
  .find(r => (r.querySelector("b.video-card") || {}).textContent === t);
const btn = r => r && Array.from(r.querySelectorAll("button")).find(b => b.textContent.trim() === "Approve for client");
const statusOf = async t => (await db.query("select status from social_videos where title=$1", [t])).rows[0].status;

chk("no button before owner approves the concept", row("Unapproved concept") && !btn(row("Unapproved concept")));

for (const [t, want] of [["Owner-approved concept", "to_film"], ["Finished video", "ready_to_post"], ["Concierge finished video", "ready_to_post"]]) {
  const b = btn(row(t));
  chk(`${t}: button shows in Waiting on client`, !!b);
  if (!b) continue;
  b.click(); await settle();
  chk(`${t}: now ${want}`, (await statusOf(t)) === want, await statusOf(t));
}
chk("asked to confirm each time", op.ui.confirms.length === 3 && op.ui.confirms[0].includes("Fully Launched"), op.ui.confirms);
const log = (await db.query("select action, changed_by_role from social_status_audit_log where action <> 'created'")).rows;
chk("audit log says the operator did it", log.length === 3 && log.every(r => r.action === "direct_update" && r.changed_by_role === "operator"), log);
chk("no alerts or page errors", !op.ui.alerts.length && !op.ui.errors.length, [op.ui.alerts, op.ui.errors]);

console.log(`${counts.pass} passed, ${counts.fail} failed`);
process.exit(counts.fail ? 1 : 0);
