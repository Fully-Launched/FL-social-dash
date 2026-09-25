// Month · Day · Year dropdowns in the video forms: picking a date, the
// 7-day edit-by suggestion, day clamping (Feb 31 → Feb 28), editing an
// existing date, and saving (operator video form).
import { freshDb, makeHarness, checker } from "./harness.mjs";

const db = await freshDb();
const { openPage, settle } = makeHarness(db);
const counts = checker();
const chk = (n, cond, x) => counts.check(n, cond, x);

const OP = "00000000-0000-0000-0000-00000000000a";
const FL = "d44e6fc3-dfea-42dc-902c-54724441040d";
await db.exec(`
  insert into auth.users (id) values ('${OP}');
  insert into social_operators values ('${OP}','Tait','tait@x');
  insert into social_clients (id,name,slug,client_system) values ('${FL}','Fully Launched','test-fully-launched','self-serve');
  insert into social_videos (client_id,title,status,concept_approved_at,post_date) values ('${FL}','Existing','concept_pending',now(),'2027-03-09');
`);
const YEAR = new Date().getFullYear();

const op = await openPage("operator/dashboard.html", OP, "https://fl.test/operator/dashboard.html");
const box = () => op.d.getElementById("videoModalBox");
const wrap = key => box().querySelector(`[data-f="${key}"]`).closest(".date-select");
async function pick(key, m, d, y) {
  const w = wrap(key);
  for (const [part, val] of [["m", m], ["d", d], ["y", y]]) {
    if (val === undefined) continue;
    const s = w.querySelector(`[data-part="${part}"]`);
    s.value = String(val); s.dispatchEvent(new op.w.Event("change"));
  }
  await settle();
  return box().querySelector(`[data-f="${key}"]`).value;
}

op.w.openVideoForm(null); await settle();
chk("no typed date boxes, three dropdowns per date", !box().querySelector('input[type="date"]') && box().querySelectorAll(".date-select").length === 3);
chk("year starts on this year", wrap("postDate").querySelector('[data-part="y"]').value === String(YEAR));
chk("month names in the dropdown", wrap("postDate").querySelector('[data-part="m"]').textContent.includes("October"));
chk("month alone isn't a date yet", (await pick("postDate", "10")) === "");
chk("month + day makes the date (this year)", (await pick("postDate", undefined, "20")) === `${YEAR}-10-20`);
const edit = box().querySelector('[data-f="dueToEdit"]');
chk("edit-by suggested 7 days earlier, shown in its dropdowns", edit.value === `${YEAR}-10-13`
  && wrap("dueToEdit").querySelector('[data-part="m"]').value === "10" && wrap("dueToEdit").querySelector('[data-part="d"]').value === "13");
chk("Feb 31 becomes the last day of February", (await pick("dueToFilm", "02", "31", String(YEAR + 1))) === `${YEAR + 1}-02-28`);
chk("clearing the month clears the date", (await pick("dueToFilm", "")) === "");
await pick("dueToFilm", "10", "05", String(YEAR));
box().querySelector('[data-f="title"]').value = "Dropdown video";
box().querySelector("#vfSave").click(); await settle();
const r = (await db.query("select due_to_film::text f, due_to_edit::text e, post_date::text p from social_videos where title='Dropdown video'")).rows[0];
chk("saved: film, edit and post dates", r && r.f === `${YEAR}-10-05` && r.e === `${YEAR}-10-13` && r.p === `${YEAR}-10-20`, r);

// Editing an existing date: the dropdowns start on it (even a year outside the usual range stays).
const id = (await db.query("select id from social_videos where title='Existing'")).rows[0].id;
op.w.openVideoForm(id); await settle();
const pw = wrap("postDate");
chk("existing date preselected", pw.querySelector('[data-part="m"]').value === "03" && pw.querySelector('[data-part="d"]').value === "09" && pw.querySelector('[data-part="y"]').value === "2027");
await pick("postDate", "04");
box().querySelector("#vfSave").click(); await settle();
chk("changed month saved", (await db.query("select post_date::text p from social_videos where id=$1", [id])).rows[0].p === "2027-04-09");

chk("no page errors", !op.ui.errors.length && !op.ui.alerts.length, [op.ui.errors, op.ui.alerts]);
console.log(`${counts.pass} passed, ${counts.fail} failed`);
process.exit(counts.fail ? 1 : 0);
