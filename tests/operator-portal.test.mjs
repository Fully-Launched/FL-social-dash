// The operator in the client portal: clicks the client's own buttons for
// them and edits videos, all recorded as the operator.
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
    ('${FL}','Approve me','concept_pending',now()),
    ('${FL}','Change me','concept_pending',now()),
    ('${FL}','Deny me','concept_pending',now()),
    ('${FL}','Hidden concept','concept_pending',null),
    ('${FL}','Film me','to_film',null),
    ('${FL}','Final ok','client_review',null),
    ('${FL}','Final redo','client_review',null),
    ('${FL}','Edit me','to_film',null),
    ('${DAD}','Dad final','client_review',null),
    ('${DAD}','Dad filmed','filmed',null);
`);

const open = slug => openPage("clients/portal.html", OP, "https://fl.test/clients/" + slug);
const card = (p, t) => Array.from(p.d.querySelectorAll(".card")).find(c => (c.querySelector("[data-open]") || {}).textContent === t);
const btn = (el, text) => el && Array.from(el.querySelectorAll("button")).find(b => b.textContent.trim().startsWith(text));
const row = async t => (await db.query("select status, note, concept_approved_at, title, hook, post_date from social_videos where title=$1", [t])).rows[0];

let p = await open("test-fully-launched");
chk("gate-1 concept still hidden from portal", !card(p, "Hidden concept"));

const steps = [
  ["Approve me", "Approve", null, "to_film"],
  ["Change me", "Request changes", "Shorter hook", "concept_pending"],
  ["Deny me", "Deny", "Not on brand", "rejected"],
  ["Film me", "I've uploaded my footage", null, "ready_to_edit"],
  ["Final ok", "Approve — ready to post", null, "ready_to_post"],
  ["Final redo", "Request revisions", "Louder music", "with_editor"],
];
for (const [t, label, note, want] of steps) {
  const b = btn(card(p, t), label);
  chk(`${t}: "${label}" shows for operator`, !!b);
  if (!b) continue;
  if (note) p.ui.prompts.push(note);
  b.click(); await settle();
  const r = await row(t);
  chk(`${t}: now ${want}`, r.status === want, r);
  if (note) chk(`${t}: note saved`, r.note === note, r.note);
}
chk("request changes sends concept back to owner", (await row("Change me")).concept_approved_at === null);

// Edit form
btn(card(p, "Edit me"), "✏️ Edit").click(); await settle();
const box = p.d.getElementById("videoModalBox");
box.querySelector('[data-f="title"]').value = "Edited title";
box.querySelector('[data-f="hook"]').value = "New hook";
box.querySelector('[data-f="postDate"]').value = "2026-10-15";
box.querySelector("#portalEditSave").click(); await settle();
const e = await row("Edited title");
chk("edit saved", e && e.hook === "New hook" && e.post_date === "2026-10-15" && e.status === "to_film", e);
chk("edited card shows new title", !!card(p, "Edited title"));

chk("no alerts or page errors (FL)", !p.ui.alerts.length && !p.ui.errors.length, [p.ui.alerts, p.ui.errors]);

// Concierge: only the final-review buttons, no filming ones.
p = await open("dad-co");
chk("concierge: approve final shows", !!btn(card(p, "Dad final"), "Approve — ready to post"));
chk("concierge: no footage button", !btn(card(p, "Dad filmed"), "I've uploaded"));
chk("concierge: edit shows", !!btn(card(p, "Dad filmed"), "✏️ Edit"));

const log = (await db.query("select action, changed_by_role from social_status_audit_log where action <> 'created'")).rows;
chk("audit log: all by operator, none as client", log.length >= 7 && log.every(r => r.changed_by_role === "operator" && r.action === "direct_update"), log);

console.log(`${counts.pass} passed, ${counts.fail} failed`);
process.exit(counts.fail ? 1 : 0);
