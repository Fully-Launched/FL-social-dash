// Tait's flow, end to end, clicking the real buttons on the real built
// pages: 30 ideas from Claude for a client who films, plus a few for a
// client Tait films for.
//   node tests/flow.test.mjs 1   smooth path
//   node tests/flow.test.mjs 2   client adds suggestions / asks for changes to finished videos
//   node tests/flow.test.mjs 3   operator asks for revisions; editor clicks Finished before uploading
import { freshDb, makeHarness, checker } from "./harness.mjs";

const RUN = Number(process.argv[2] || 1);
const V = {
  1: { change: [], opRev: [], clientRev: [], post: 30, early: false },
  2: { change: [25, 26, 27], opRev: [], clientRev: [4, 5], post: 10, early: false },
  3: { change: [0], opRev: [1, 2, 3], clientRev: [6], post: 15, early: true },
}[RUN];
console.log(`Run ${RUN}:`, JSON.stringify(V));

const db = await freshDb();
const { openPage, settle } = makeHarness(db);
const counts = checker();
const chk = (n, cond, x) => counts.check(n, cond, x);

const U = { op: "00000000-0000-0000-0000-00000000000a", ed: "00000000-0000-0000-0000-00000000000b", cl: "00000000-0000-0000-0000-00000000000d", dad: "00000000-0000-0000-0000-00000000000e" };
const FL = "d44e6fc3-dfea-42dc-902c-54724441040d";
const DAD = "d44e6fc3-dfea-42dc-902c-54724441040e";
await db.exec(`
  insert into auth.users values ('${U.op}'),('${U.ed}'),('${U.cl}'),('${U.dad}');
  insert into social_operators values ('${U.op}','Tait','tait@x');
  insert into social_editors (id,name,email) values ('${U.ed}','Morgan','m@x');
  insert into social_clients (id,name,slug,client_system) values
    ('${FL}','Fully Launched','test-fully-launched','self-serve'),
    ('${DAD}','Dad Co','dad-co','concierge');
  insert into social_client_users (id,client_id,email) values ('${U.cl}','${FL}','fl@x'),('${U.dad}','${DAD}','dad@x');
  insert into social_drive_folder_links (client_id, footage_uploads, final_edits, brand_voice) values
    ('${FL}','https://drive/fl-footage','https://drive/fl-final','https://docs/fl-brand'),
    ('${DAD}','https://drive/dad-footage','https://drive/dad-final',null);
`);

const BASE = "https://fl.test";
const OP = () => openPage("operator/dashboard.html", U.op, BASE + "/operator/dashboard.html");
const CL = () => openPage("clients/portal.html", U.cl, BASE + "/clients/test-fully-launched");
const DADP = () => openPage("clients/portal.html", U.dad, BASE + "/clients/dad-co");
const ED = () => openPage("editor/dashboard.html", U.ed, BASE + "/editor/dashboard.html");

const iso = d => d.toISOString().slice(0, 10);
const day = n => iso(new Date(Date.UTC(2026, 9, 1 + n)));      // Oct 1 + n
const title = i => `Post ${String(i + 1).padStart(2, "0")} — idea ${i + 1}`;
const plan = Array.from({ length: 30 }, (_, i) => ({
  title: title(i), platform: ["instagram", "tiktok"], hook: `Hook ${i + 1}`, overview: `Overview ${i + 1}`,
  body: `Talking points ${i + 1}`, outline: [`Point A${i + 1}`, `Point B${i + 1}`], filmingDirection: `Film it like this: ${i + 1}`, editorInstructions: `Cut it like this: ${i + 1}`,
  dueToFilm: day(i - 10), dueToEdit: day(i - 7), postDate: day(i),
}));

const $ = (p, s) => p.d.querySelector(s);
const $$ = (p, s) => Array.from(p.d.querySelectorAll(s));
const btn = (root, text) => root && Array.from(root.querySelectorAll("button")).find(b => b.textContent.trim().startsWith(text));
async function click(el, what) { if (!el) throw new Error("not found: " + what); el.click(); await settle(); }
const portalCard = (p, listSel, t) => $$(p, listSel + " .card").find(c => (c.querySelector("[data-open]") || {}).textContent === t);
const opRow = (p, listSel, t) => $$(p, listSel + " .row").find(r => (r.querySelector("b.video-card") || {}).textContent === t);
const edCard = (p, t) => $$(p, "#queueList .card").find(c => c.querySelector("[data-open]").textContent === t);
const statusOf = async t => (await db.query("select status, note, concept_approved_at, caption, editor_id from social_videos where title=$1", [t])).rows[0];
const count = async (where, params = []) => (await db.query(`select count(*)::int n from social_videos where ${where}`, params)).rows[0].n;
const allPages = [];
const track = p => { allPages.push(p); return p; };

const idx = Array.from({ length: 30 }, (_, i) => i);

// ── 1. Operator plans 30 ideas with Claude and adds them ──
let op = track(await OP());
chk("opens on To Do", $(op, "#view-todo").classList.contains("active"));
await click($(op, "#bulkAddBtn"), "add ideas");
chk("defaults to the first client (A–Z)", $(op, "#bkClient").value === DAD);
$(op, "#bkClient").value = FL;
$(op, "#bkText").value = "Here you go:\n```json\n" + JSON.stringify(plan, null, 2) + "\n```";
$(op, "#bkText").dispatchEvent(new op.w.Event("input"));
chk("preview shows 30", $(op, "#bkPreview").textContent.includes("30 idea(s) ready"), $(op, "#bkPreview").textContent.slice(0, 80));
await click($(op, "#bkSave"), "save ideas");
let rows = (await db.query("select title, status, due_to_film, due_to_edit, post_date, filming_instructions, editor_brief, concept_approved_at from social_videos order by title")).rows;
chk("30 videos created", rows.length === 30, rows.length);
chk("each has film/edit/post dates", rows.every((r, i) => r.due_to_film === day(i - 10) && r.due_to_edit === day(i - 7) && r.post_date === day(i)), rows[0]);
chk("each has filming + editing instructions", rows.every((r, i) => r.filming_instructions === `Film it like this: ${i + 1}` && r.editor_brief.instructions === `Cut it like this: ${i + 1}`), rows[0]);
chk("all are ideas the client can already see", rows.every(r => r.status === "concept_pending" && r.concept_approved_at));
await click($$(op, ".nav-item").find(n => n.dataset.view === "calendar"), "calendar");
await click(btn($(op, "#calGrid"), "›"), "calendar next month");
chk("operator calendar shows October posts", $(op, "#calGrid").textContent.includes("October") && $$(op, "#calGrid .cal-chip").length === 30, $$(op, "#calGrid .cal-chip").length);

// ── 2. Client reviews the 30 ideas ──
let cl = track(await CL());
chk("client sees 30 ideas to approve", $(cl, "#videoTabs").textContent.includes("Ideas to approve (30)"), $(cl, "#videoTabs").textContent);
chk("client has only My Videos + Calendar", $$(cl, ".nav-item").map(n => n.dataset.view).join() === "videos,calendar");
const c0 = portalCard(cl, "#listIdeas", title(0));
chk("idea card: hook, script, outline, film-by, how to film", c0 && ["Hook 1", "Talking points 1", "- Point A1\n- Point B1", "Film by " + day(-10), "Film it like this: 1"].every(t => c0.textContent.includes(t)), c0 && c0.textContent);
chk("idea card: nothing else (no platforms, post date, overview)", c0 && !/instagram|posts |Overview 1/.test(c0.textContent));
chk("idea card has only Approve idea + Add suggestions", c0 && Array.from(c0.querySelectorAll("button")).map(b => b.textContent).join("|") === "Approve idea|Add suggestions");
chk("client never sees editing instructions", !cl.d.body.textContent.includes("Cut it like this"));
for (const i of idx) {
  const card = portalCard(cl, "#listIdeas", title(i));
  if (V.change.includes(i)) { cl.ui.prompts.push("Make it funnier " + i); await click(btn(card, "Add suggestions"), "suggest " + i); }
  else await click(btn(card, "Approve idea"), "approve " + i);
}
for (const i of V.change) { const s = await statusOf(title(i)); chk(`#${i} back with Tait`, s.status === "concept_pending" && !s.concept_approved_at && s.note === "Make it funnier " + i, s); }

// ── 3. Operator reworks the ideas with suggestions and sends them again ──
if (V.change.length) {
  op = track(await OP());
  for (const i of V.change) {
    const row = opRow(op, "#ideasList", title(i));
    chk(`#${i} shows client's suggestion`, row && row.textContent.includes("Make it funnier " + i));
    await click(btn(row, "✏️ Edit"), "edit " + i);
    $(op, '[data-f="hook"]').value = "Funnier hook " + i;
    $(op, '[data-f="note"]').value = "";
    await click($(op, "#vfSave"), "save rewrite");
  }
  if (V.change.length > 1) await click(btn($(op, "#sendAllWrap"), "Send all"), "send all");
  else await click(btn(opRow(op, "#ideasList", title(V.change[0])), "Send to client"), "send again");
  chk("reworked ideas visible again", (await count("status='concept_pending' and concept_approved_at is not null")) === V.change.length);
  cl = track(await CL());
  for (const i of V.change) {
    const card = portalCard(cl, "#listIdeas", title(i));
    chk(`client sees rewrite #${i}`, card && card.textContent.includes("Funnier hook " + i));
    await click(btn(card, "Approve idea"), "approve rewrite " + i);
  }
}
chk("all 30 approved → to film", (await count("status='to_film'")) === 30);

// ── 4. Client films and uploads ──
cl = track(await CL());
chk("To film shows 30", $(cl, "#videoTabs").textContent.includes("To film (30)"), $(cl, "#videoTabs").textContent);
const f0 = portalCard(cl, "#listToFilm", title(0));
chk("Raw footage here link on the card", f0 && Array.from(f0.querySelectorAll('a[href="https://drive/fl-footage"]')).some(a => a.textContent.includes("Raw footage here")));
for (const i of idx) await click(btn(portalCard(cl, "#listToFilm", title(i)), "Uploaded footage"), "uploaded " + i);
chk("all uploaded → back to Tait", (await count("status='ready_to_edit'")) === 30);

// ── 5. Operator assigns the editor ──
op = track(await OP());
chk("30 ready for an editor", $$(op, "#toEditorList .row").length === 30);
for (const i of idx) {
  // The first goes through the popup, which sits over the video's own row.
  if (i === 0) {
    await click(opRow(op, "#toEditorList", title(i)).querySelector("b.video-card"), "open popup");
    const box = $(op, "#videoModalBox .modal-actions");
    box.querySelector("select").value = U.ed;
    await click(btn(box, "Send to editor"), "send from popup");
    chk("popup picker sends to the editor", !op.ui.alerts.length, op.ui.alerts);
    continue;
  }
  const row = opRow(op, "#toEditorList", title(i));
  row.querySelector("select").value = U.ed;
  await click(btn(row, "Send to editor"), "send " + i);
}
chk("all with the editor", (await count("status='with_editor' and editor_id=$1", [U.ed])) === 30);

// ── 6. Editor edits and finishes ──
async function editorFinish(list) {
  const ed = track(await ED());
  for (const i of list) await click(btn(edCard(ed, title(i)), "Finished"), "finish " + i);
  return ed;
}
let ed = track(await ED());
chk("editor has only To Edit + Calendar", $$(ed, ".nav-item").map(n => n.dataset.view).join() === "queue,calendar");
chk("editor queue has 30", $$(ed, "#queueList .card").length === 30);
const e0 = edCard(ed, title(0));
chk("editor card: raw footage, finished folder, instructions, edit-by date",
  e0.querySelector('a[href="https://drive/fl-footage"]') && e0.querySelector('a[href="https://drive/fl-final"]') && e0.textContent.includes("Cut it like this: 1") && e0.textContent.includes(day(-7)));
chk("editor told to name the file after the video", e0.textContent.includes("name it " + title(0)));
chk("editor sees the client's brand guidelines", Array.from(e0.querySelectorAll('a[href="https://docs/fl-brand"]')).some(a => a.textContent.includes("Brand guidelines")));
chk("editor card: no hook, script or post date", !/Hook 1|Talking points 1|posts /.test(e0.textContent));
await click($$(ed, ".nav-item").find(n => n.dataset.view === "calendar"), "editor calendar");
chk("editor calendar has the edit dates", $$(ed, "#calGrid .cal-chip").length > 0);
if (V.early) {
  ed.w.confirm = m => { ed.ui.confirms.push(m); return false; };
  await click(btn(e0, "Finished"), "not uploaded yet");
  ed.w.confirm = m => { ed.ui.confirms.push(m); return true; };
  chk("not uploaded yet: still with editor", (await statusOf(title(0))).status === "with_editor");
}
const edF = await editorFinish(idx);
chk("Finished asks about the folder, never for a link", edF.ui.confirms[0].includes("finished video folder") && !edF.ui.promptsShown.length, [edF.ui.confirms[0], edF.ui.promptsShown]);
chk("all back to Tait for review", (await count("status='in_review'")) === 30);

// ── 7. Operator reviews: revisions, or approve + caption ──
async function approveWithCaption(p, i) {
  await click(btn(opRow(p, "#editsList", title(i)), "Approve & add captions"), "approve edit " + i);
  $(p, '#videoModalBox [data-f="onScreenCaption"]').value = "On screen " + (i + 1);
  $(p, '#videoModalBox [data-f="caption"]').value = "Caption " + (i + 1);
  await click($(p, "#aeSave"), "save caption " + i);
}
op = track(await OP());
const r0 = opRow(op, "#editsList", title(0));
chk("Watch opens the finished video folder", r0 && !!r0.querySelector('a[href="https://drive/fl-final"]'));
// A caption is required.
await click(btn(r0, "Approve & add captions"), "approve without caption");
await click($(op, "#aeSave"), "save empty caption");
chk("caption required", $(op, "#aeError").textContent.includes("caption") && (await statusOf(title(0))).status === "in_review");
op.w.closeVideoModal();
for (const i of idx) {
  if (V.opRev.includes(i)) {
    await click(btn(opRow(op, "#editsList", title(i)), "Revisions needed"), "revisions " + i);
    $(op, '#videoModalBox [data-f="revisions"]').value = "Tighten the intro " + i;
    await click($(op, "#rvSave"), "send revisions " + i);
  }
  else await approveWithCaption(op, i);
}
if (V.opRev.length) {
  ed = track(await ED());
  for (const i of V.opRev) chk(`editor sees Tait's revisions #${i}`, edCard(ed, title(i))?.textContent.includes("Revisions needed") && edCard(ed, title(i)).textContent.includes("Tighten the intro " + i));
  chk("revisions are never in the note the client sees", (await count("note like 'Tighten%'")) === 0);
  const clr = track(await CL());
  await click($$(clr, ".nav-item").find(n => n.dataset.view === "calendar"), "client calendar");
  await click(btn($(clr, "#calGrid"), "›"), "next month");
  await click($$(clr, "#calGrid .cal-chip").find(c => c.textContent === title(V.opRev[0])), "client opens revised video");
  chk("client never sees revisions", !clr.d.body.textContent.includes("Tighten the intro"));
  await editorFinish(V.opRev);
  op = track(await OP());
  for (const i of V.opRev) await approveWithCaption(op, i);
}
chk("all 30 with the client, both captions", (await count("status='client_review' and caption like 'Caption %' and on_screen_caption like 'On screen %'")) === 30);
chk("revisions cleared once approved", (await count("editor_brief->>'revisions' is not null")) === 0);

// ── 8. Client approves for posting ──
cl = track(await CL());
chk("client has 30 finished videos to approve", $(cl, "#videoTabs").textContent.includes("Finished videos to approve (30)"), $(cl, "#videoTabs").textContent);
const fr = portalCard(cl, "#listFinal", title(0));
chk("client can watch it and read both captions", fr && !!fr.querySelector('a[href="https://drive/fl-final"]') && fr.textContent.includes("Caption 1") && fr.textContent.includes("On screen 1"));
for (const i of idx) {
  const card = portalCard(cl, "#listFinal", title(i));
  if (V.clientRev.includes(i)) { cl.ui.prompts.push("Use the other take " + i); await click(btn(card, "Request changes"), "client changes " + i); }
  else await click(btn(card, "Approve for posting"), "approve for posting " + i);
}
if (V.clientRev.length) {
  const edc = track(await ED());
  for (const i of V.clientRev) chk(`editor sees the client's change #${i} under Revisions needed`, edCard(edc, title(i))?.textContent.includes("Use the other take " + i));
  await editorFinish(V.clientRev);
  op = track(await OP());
  for (const i of V.clientRev) {
    await click(btn(opRow(op, "#editsList", title(i)), "Approve & add captions"), "approve again " + i);
    chk(`captions kept for #${i}`, $(op, '#videoModalBox [data-f="caption"]').value === "Caption " + (i + 1) && $(op, '#videoModalBox [data-f="onScreenCaption"]').value === "On screen " + (i + 1));
    await click($(op, "#aeSave"), "resend " + i);
  }
  cl = track(await CL());
  for (const i of V.clientRev) await click(btn(portalCard(cl, "#listFinal", title(i)), "Approve for posting"), "final again " + i);
}
chk("all 30 ready to post", (await count("status='ready_to_post'")) === 30);

// ── 9. Posting ──
op = track(await OP());
chk("Ready to Post lists 30", $$(op, "#postList > .card").length === 30, $$(op, "#postList > .card").length);
const p0 = $$(op, "#postList > .card")[0];
chk("in post-date order, with date, caption, finished video", p0.textContent.includes(title(0)) && p0.textContent.includes("Post " + day(0)) && p0.textContent.includes("Caption 1") && p0.textContent.includes("On screen 1") && !!p0.querySelector('a[href="https://drive/fl-final"]'));
for (let n = 0; n < V.post; n++) await click(btn($$(op, "#postList > .card")[0], "Mark posted"), "post " + n);
chk(`${V.post} posted`, (await count("status='posted'")) === V.post);

// ── 10. Client calendar ──
cl = track(await CL());
await click($$(cl, ".nav-item").find(n => n.dataset.view === "calendar"), "client calendar");
await click(btn($(cl, "#calGrid"), "›"), "client calendar next month");
chk("client calendar shows all 30 posts", $(cl, "#calGrid").textContent.includes("October") && $$(cl, "#calGrid .cal-chip").length === 30, $$(cl, "#calGrid .cal-chip").length);

// ── 11. A client Tait films for ──
op = track(await OP());
op.w.openBulkAdd(DAD); await settle();
$(op, "#bkText").value = JSON.stringify([1, 2].map(n => ({ title: "Dad " + n, hook: "Dad hook " + n, postDate: day(n) })));
$(op, "#bkText").dispatchEvent(new op.w.Event("input"));
await click($(op, "#bkSave"), "save dad ideas");
chk("Tait-films ideas skip client approval", (await count("client_id=$1 and status='to_film'", [DAD])) === 2);
let dad = track(await DADP());
chk("that client only has finished videos to approve", $(dad, "#videoTabs").textContent === "Finished videos to approve (0)", $(dad, "#videoTabs").textContent);
op = track(await OP());
const d1 = opRow(op, "#toEditorList", "Dad 1");
chk("Tait films it: raw footage link + send to editor", d1 && !!d1.querySelector('a[href="https://drive/dad-footage"]') && !!btn(d1, "Send to editor"));
for (const t of ["Dad 1", "Dad 2"]) { const r = opRow(op, "#toEditorList", t); r.querySelector("select").value = U.ed; await click(btn(r, "Send to editor"), "send " + t); }
ed = track(await ED());
for (const t of ["Dad 1", "Dad 2"]) await click(btn(edCard(ed, t), "Finished"), "finish " + t);
op = track(await OP());
for (const t of ["Dad 1", "Dad 2"]) {
  await click(btn(opRow(op, "#editsList", t), "Approve & add captions"), "approve " + t);
  $(op, '#videoModalBox [data-f="caption"]').value = t + " caption";
  await click($(op, "#aeSave"), "caption " + t);
}
dad = track(await DADP());
for (const t of ["Dad 1", "Dad 2"]) await click(btn(portalCard(dad, "#listFinal", t), "Approve for posting"), "dad approves " + t);
chk("Tait-films videos ready to post", (await count("client_id=$1 and status='ready_to_post'", [DAD])) === 2);

// ── 12. Audit trail for one ordinary video ──
const plainI = idx.find(i => ![...V.change, ...V.opRev, ...V.clientRev].includes(i) && !(V.early && i === 0));
const trail = (await db.query("select a.action, a.changed_by_role r from social_status_audit_log a join social_videos v on v.id=a.video_id where v.title=$1 order by a.id", [title(plainI)])).rows.map(x => x.action + ":" + x.r).join(" > ");
const want = "created:operator > approve_concept:client > mark_filmed:client > mark_ready_to_edit:client > direct_update:operator > mark_delivered:editor > direct_update:operator > approve_final:client" + (plainI < V.post ? " > direct_update:operator" : "");
chk("audit trail records every step", trail === want, trail);

// ── 13. Nothing broke along the way ──
const errs = allPages.flatMap(p => p.ui.errors);
chk("no page errors", errs.length === 0, errs);
const failed = allPages.flatMap(p => p.ui.log.filter(l => l.error));
chk("no failed database calls", failed.length === 0, failed);
const unexpectedAlerts = allPages.flatMap(p => p.ui.alerts).filter(a => !a.startsWith("Added "));
chk("no unexpected error popups", unexpectedAlerts.length === 0, unexpectedAlerts);

console.log(`Run ${RUN}: ${counts.pass} passed, ${counts.fail} failed`);
process.exit(counts.fail ? 1 : 0);
