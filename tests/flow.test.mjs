// Tait's flow, end to end, for Fully Launched with 30 posts over 30 days —
// clicking the real buttons on the real built pages.
//   node tests/flow.test.mjs 1   smooth path
//   node tests/flow.test.mjs 2   client rejects / requests changes / sends finals back
//   node tests/flow.test.mjs 3   operator sends edits back; editor pastes a bad link once
import { freshDb, makeHarness, checker } from "./harness.mjs";

const RUN = Number(process.argv[2] || 1);
const V = {
  1: { reject: [], change: [], opRev: [], clientRev: [], post: 30, badLink: false },
  2: { reject: [28, 29], change: [25, 26, 27], opRev: [], clientRev: [4, 5], post: 10, badLink: false },
  3: { reject: [], change: [0], opRev: [1, 2, 3], clientRev: [6], post: 15, badLink: true },
}[RUN];
console.log(`Run ${RUN}:`, JSON.stringify(V));

const db = await freshDb();
const { openPage, settle } = makeHarness(db);
const counts = checker();
const chk = (n, cond, x) => counts.check(n, cond, x);

const U = { op: "00000000-0000-0000-0000-00000000000a", ed: "00000000-0000-0000-0000-00000000000b", cl: "00000000-0000-0000-0000-00000000000d" };
const FL = "d44e6fc3-dfea-42dc-902c-54724441040d";
await db.exec(`
  insert into auth.users values ('${U.op}'),('${U.ed}'),('${U.cl}');
  insert into social_operators values ('${U.op}','Tait','tait@x');
  insert into social_editors (id,name,email) values ('${U.ed}','Morgan','m@x');
  insert into social_clients (id,name,slug,client_system,plan_window_start,plan_window_end) values ('${FL}','Fully Launched','test-fully-launched','self-serve','2026-10-01','2026-10-31');
  insert into social_client_users (id,client_id,email) values ('${U.cl}','${FL}','fl@x');
  insert into social_drive_folder_links (client_id, root, footage_uploads, final_edits, brand_voice)
    values ('${FL}','https://drive/fl','https://drive/fl-footage','https://drive/fl-final','https://drive/fl-voice');
`);

const BASE = "https://fl.test";
const OP = () => openPage("operator/dashboard.html", U.op, BASE + "/operator/dashboard.html");
const CL = () => openPage("clients/portal.html", U.cl, BASE + "/clients/test-fully-launched");
const ED = () => openPage("editor/dashboard.html", U.ed, BASE + "/editor/dashboard.html", {});

const iso = d => d.toISOString().slice(0, 10);
const day = n => iso(new Date(Date.UTC(2026, 9, 1 + n)));      // Oct 1 + n
const title = i => `Post ${String(i + 1).padStart(2, "0")} — idea ${i + 1}`;
const plan = Array.from({ length: 30 }, (_, i) => ({
  title: title(i), platform: ["instagram", "tiktok"], hook: `Hook ${i + 1}`, overview: `Overview ${i + 1}`,
  body: `Talking points ${i + 1}`, filmingDirection: `Film it like this: ${i + 1}`, caption: `Caption ${i + 1}`,
  dueToFilm: day(i - 10), dueToEdit: day(i - 7), postDate: day(i),
}));

const $ = (p, s) => p.d.querySelector(s);
const $$ = (p, s) => Array.from(p.d.querySelectorAll(s));
const btn = (root, text) => root && Array.from(root.querySelectorAll("button")).find(b => b.textContent.trim().startsWith(text));
async function click(el, what) { if (!el) throw new Error("not found: " + what); el.click(); await settle(); }
const portalCard = (p, listSel, t) => $$(p, listSel + " .card").find(c => (c.querySelector("[data-open]") || {}).textContent === t);
const opRow = (p, listSel, t) => $$(p, listSel + " .row").find(r => (r.querySelector("b.video-card") || {}).textContent === t);
const idOf = async t => (await db.query("select id from social_videos where title=$1", [t])).rows[0].id;
const statusOf = async t => (await db.query("select status, note, concept_approved_at, final_cut_url from social_videos where title=$1", [t])).rows[0];
const allPages = [];
const track = p => { allPages.push(p); return p; };

const idx = Array.from({ length: 30 }, (_, i) => i);
const kept = idx.filter(i => !V.reject.includes(i));

// ── 1. Operator plans 30 posts with Claude and bulk-adds them ──
let op = track(await OP());
await click($(op, "#bulkAddBtn"), "bulk add");
chk("bulk add defaults to Fully Launched", $(op, "#bkClient").value === FL);
$(op, "#bkText").value = "Here you go:\n```json\n" + JSON.stringify(plan, null, 2) + "\n```";
$(op, "#bkText").dispatchEvent(new op.w.Event("input"));
chk("preview shows 30", $(op, "#bkPreview").textContent.includes("30 concept(s) ready"), $(op, "#bkPreview").textContent.slice(0, 80));
chk("preview shows edit date", $(op, "#bkPreview").textContent.includes("edit " + day(-7)));
await click($(op, "#bkSave"), "bulk save");
let rows = (await db.query("select title, status, due_to_film, due_to_edit, post_date, filming_instructions, concept_approved_at from social_videos order by title")).rows;
chk("30 videos created", rows.length === 30, rows.length);
chk("each has film/edit/post dates", rows.every((r, i) => r.due_to_film === day(i - 10) && r.due_to_edit === day(i - 7) && r.post_date === day(i)), rows[0]);
chk("each has filming instructions", rows.every(r => r.filming_instructions && r.filming_instructions.startsWith("Film it like this")));
chk("all pending, none visible to client", rows.every(r => r.status === "concept_pending" && !r.concept_approved_at));

// ── 2. Client can't see them before the operator approves ──
let cl = track(await CL());
chk("client sees nothing to approve yet", $(cl, "#videoTabs").textContent.includes("Needs your approval (0)"), $(cl, "#videoTabs").textContent);

// ── 3. Operator approves all 30 ──
op = track(await OP());
chk("30 concepts await approval", $$(op, "#conceptsList .row").length === 30, $$(op, "#conceptsList .row").length);
await click(btn($(op, "#approveAllWrap"), "Approve all 30"), "approve all");
chk("all 30 approved", (await db.query("select count(*)::int n from social_videos where concept_approved_at is not null")).rows[0].n === 30);

// ── 4. Client reviews the 30 ideas ──
cl = track(await CL());
chk("client tab shows 30 to approve", $(cl, "#videoTabs").textContent.includes("Needs your approval (30)"), $(cl, "#videoTabs").textContent);
const c0 = portalCard(cl, "#listConcepts", title(0));
chk("idea card shows what to say + how to film", c0 && c0.textContent.includes("Talking points 1") && c0.textContent.includes("Film it like this: 1"));
for (const i of idx) {
  const card = portalCard(cl, "#listConcepts", title(i));
  if (V.reject.includes(i)) { cl.ui.prompts.push("Not for us"); await click(btn(card, "Deny"), "deny " + i); }
  else if (V.change.includes(i)) { cl.ui.prompts.push("Make it funnier " + i); await click(btn(card, "Request changes"), "change " + i); }
  else await click(btn(card, "Approve"), "approve " + i);
}
for (const i of V.reject) chk(`#${i} rejected`, (await statusOf(title(i))).status === "rejected");
for (const i of V.change) { const s = await statusOf(title(i)); chk(`#${i} back with owner`, s.status === "concept_pending" && !s.concept_approved_at && s.note === "Make it funnier " + i, s); }

// ── 5. Operator rewrites the ones with requested changes and re-approves ──
if (V.change.length) {
  op = track(await OP());
  for (const i of V.change) {
    const row = opRow(op, "#conceptsList", title(i));
    chk(`#${i} shows client's note to operator`, row && row.textContent.includes("Make it funnier " + i));
    op.w.openVideoForm(await idOf(title(i))); await settle();
    $(op, '[data-f="hook"]').value = "Funnier hook " + i;
    $(op, '[data-f="note"]').value = "";
    await click($(op, "#vfSave"), "save rewrite");
    await click(btn(opRow(op, "#conceptsList", title(i)), "Approve concept"), "reapprove " + i);
  }
  cl = track(await CL());
  for (const i of V.change) {
    const card = portalCard(cl, "#listConcepts", title(i));
    chk(`client sees rewrite #${i}`, card && card.textContent.includes("Funnier hook " + i));
    await click(btn(card, "Approve"), "approve rewrite " + i);
  }
}

// ── 6. Client films and uploads ──
cl = track(await CL());
chk(`To film shows ${kept.length}`, $(cl, "#videoTabs").textContent.includes(`To film (${kept.length})`), $(cl, "#videoTabs").textContent);
const f0 = portalCard(cl, "#listToFilm", title(kept[0]));
chk("upload link is on the card", f0 && !!f0.querySelector('a[href="https://drive/fl-footage"]'));
chk("file naming hint on the card", f0 && f0.textContent.includes("Name your files starting with"));
for (const i of kept) await click(btn(portalCard(cl, "#listToFilm", title(i)), "I've uploaded my footage"), "uploaded " + i);
chk("all uploaded → ready to edit", (await db.query("select count(*)::int n from social_videos where status='ready_to_edit'")).rows[0].n === kept.length);
chk(`In progress shows ${kept.length}`, $(cl, "#videoTabs").textContent.includes(`In progress (${kept.length})`), $(cl, "#videoTabs").textContent);

// ── 7. Operator sends each to the editor ──
op = track(await OP());
chk(`${kept.length} ready for an editor`, $$(op, "#toEditorList .row").length === kept.length);
for (const i of kept) {
  // The first one goes through the popup, which sits over the video's own
  // row: each has a picker, and the popup's must be the one that counts.
  if (i === kept[0]) {
    await click(opRow(op, "#toEditorList", title(i)).querySelector("b.video-card"), "open popup " + i);
    const box = $(op, "#videoModalBox .modal-actions");
    box.querySelector("select").value = U.ed;
    await click(btn(box, "Send to editor"), "send from popup " + i);
    chk("popup picker sends to the editor", !op.ui.alerts.length, op.ui.alerts);
    continue;
  }
  const row = opRow(op, "#toEditorList", title(i));
  row.querySelector("select").value = U.ed;
  await click(btn(row, "Send to editor"), "send " + i);
}
chk("all with editor", (await db.query("select count(*)::int n from social_videos where status='with_editor' and editor_id=$1", [U.ed])).rows[0].n === kept.length);

// ── 8. Editor edits and finishes each ──
async function editorFinish(list, suffix) {
  const ed = track(await ED());
  for (const i of list) {
    const card = $$(ed, "#queueList .card").find(c => c.querySelector("[data-open]").textContent === title(i));
    if (!card) throw new Error("editor can't find " + title(i));
    await click(btn(card, "Finished"), "finish " + i + suffix);
  }
  return ed;
}
let ed = track(await ED());
chk(`editor queue has ${kept.length}`, $$(ed, "#queueList .card").length === kept.length);
const e0 = $$(ed, "#queueList .card")[0];
chk("editor sees footage + upload links + instructions", e0.querySelector('a[href="https://drive/fl-footage"]') && e0.querySelector('a[href="https://drive/fl-final"]') && e0.textContent.includes("Hook"));
chk("editor told to name the file after the video", e0.textContent.includes("name it " + e0.querySelector("[data-open]").textContent));
if (V.badLink) {
  // Editor clicks Finished but hasn't uploaded yet: says no, nothing moves.
  const t = e0.querySelector("[data-open]").textContent;
  ed.w.confirm = m => { ed.ui.confirms.push(m); return false; };
  await click(btn(e0, "Finished"), "not uploaded yet");
  ed.w.confirm = m => { ed.ui.confirms.push(m); return true; };
  chk("not uploaded yet: still with editor", (await statusOf(t)).status === "with_editor");
}
const edF = await editorFinish(kept, "");
chk("Finished asks about the Final edits folder, no link prompt", edF.ui.confirms.length === kept.length && edF.ui.confirms[0].includes("Final edits folder") && !edF.ui.promptsShown.length, [edF.ui.confirms[0], edF.ui.promptsShown]);
chk("all delivered, no link needed", (await db.query("select count(*)::int n from social_videos where status='in_review' and final_cut_url is null")).rows[0].n === kept.length);

// ── 9. Operator reviews edits ──
op = track(await OP());
const r0 = opRow(op, "#editsList", title(kept[0]));
chk("operator's Watch opens the Final edits folder", r0 && !!r0.querySelector('a[href="https://drive/fl-final"]'));
for (const i of kept) {
  const row = opRow(op, "#editsList", title(i));
  if (V.opRev.includes(i)) { op.ui.prompts.push("Tighten the intro " + i); await click(btn(row, "Request revisions"), "op rev " + i); }
  else await click(btn(row, "Approve edit"), "approve edit " + i);
}
if (V.opRev.length) {
  ed = track(await ED());
  for (const i of V.opRev) {
    const card = $$(ed, "#queueList .card").find(c => c.querySelector("[data-open]").textContent === title(i));
    chk(`editor sees operator's note #${i}`, card && card.textContent.includes("Tighten the intro " + i));
  }
  await editorFinish(V.opRev, "-v2");
  op = track(await OP());
  for (const i of V.opRev) await click(btn(opRow(op, "#editsList", title(i)), "Approve edit"), "approve v2 " + i);
}

// ── 10. Client final approval ──
cl = track(await CL());
chk(`client has ${kept.length} finished videos to approve`, $$(cl, "#listReview .card").length === kept.length, $$(cl, "#listReview .card").length);
const fr = portalCard(cl, "#listReview", title(kept[0]));
chk("client can watch the finished video", fr && !!fr.querySelector('a[href="https://drive/fl-final"]'));
for (const i of kept) {
  const card = portalCard(cl, "#listReview", title(i));
  if (V.clientRev.includes(i)) { cl.ui.prompts.push("Use the other take " + i); await click(btn(card, "Request revisions"), "client rev " + i); }
  else await click(btn(card, "Approve — ready to post"), "final approve " + i);
}
if (V.clientRev.length) {
  await editorFinish(V.clientRev, "-v3");
  op = track(await OP());
  for (const i of V.clientRev) await click(btn(opRow(op, "#editsList", title(i)), "Approve edit"), "approve v3 " + i);
  cl = track(await CL());
  for (const i of V.clientRev) await click(btn(portalCard(cl, "#listReview", title(i)), "Approve — ready to post"), "final v3 " + i);
}
chk("all kept videos ready to post", (await db.query("select count(*)::int n from social_videos where status='ready_to_post'")).rows[0].n === kept.length);

// ── 11. Operator posts ──
op = track(await OP());
chk(`Ready to Post lists ${kept.length}`, $$(op, "#postList > .card").length === kept.length, $$(op, "#postList > .card").length);
const postCard0 = $$(op, "#postList > .card")[0];
chk("Ready to Post shows caption + finished video", postCard0.textContent.includes("Caption") && !!postCard0.querySelector('a[href="https://drive/fl-final"]'));
chk("Ready to Post is in post-date order", postCard0.textContent.includes(title(kept[0])));
for (let n = 0; n < V.post; n++) await click(btn($$(op, "#postList > .card")[0], "Mark posted"), "post " + n);
chk(`${V.post} posted`, (await db.query("select count(*)::int n from social_videos where status='posted'")).rows[0].n === V.post);

// ── 12. Client sees ready + posted, and the calendar ──
cl = track(await CL());
const readyN = kept.length - V.post;
if (!$(cl, '#videoTabs')) { console.log('DEBUG url', cl.w.location.href, 'errors', cl.ui.errors, 'body', (cl.d.body||{}).innerHTML?.slice(0,300)); }
chk(`client: Ready & posted (${kept.length})`, $(cl, "#videoTabs").textContent.includes(`Ready & posted (${kept.length})`), $(cl, "#videoTabs").textContent);
chk(`client: ${readyN} ready, ${V.post} posted`, $$(cl, "#listReady .card").length === readyN && $$(cl, "#listPosted .card").length === V.post);
chk("client home stats link to tabs", $$(cl, "#homeStats .stat-card").length === 4);
await click(btn($(cl, "#calGrid"), "›"), "calendar next month");
chk("client calendar shows October film + post dates", $(cl, "#calGrid").textContent.includes("October") && $(cl, "#calGrid").textContent.includes("📣") && $$(cl, "#calGrid .cal-chip").length >= 20);

// ── 13. Audit trail for one ordinary video ──
const plain = kept.find(i => ![...V.change, ...V.opRev, ...V.clientRev].includes(i));
const trail = (await db.query("select a.action, a.changed_by_role r from social_status_audit_log a join social_videos v on v.id=a.video_id where v.title=$1 order by a.id", [title(plain)])).rows.map(x => x.action + ":" + x.r).join(" > ");
const want = "created:operator > approve_concept:operator > approve_concept:client > mark_filmed:client > mark_ready_to_edit:client > direct_update:operator > mark_delivered:editor > direct_update:operator > approve_final:client" + (plain < V.post ? " > direct_update:operator" : "");
chk("audit trail records every step", trail === want, trail);

// ── 14. Nothing broke along the way ──
const errs = allPages.flatMap(p => p.ui.errors);
chk("no page errors", errs.length === 0, errs);
const failed = allPages.flatMap(p => p.ui.log.filter(l => l.error));
chk("no failed database calls", failed.length === 0, failed);
const unexpectedAlerts = allPages.flatMap(p => p.ui.alerts).filter(a => !a.startsWith("Added 30") && !a.includes("doesn't look like a link"));
chk("no unexpected error popups", unexpectedAlerts.length === 0, unexpectedAlerts);

console.log(`Run ${RUN}: ${counts.pass} passed, ${counts.fail} failed`);
process.exit(counts.fail ? 1 : 0);
