// Shared helpers for all three dashboards (client portal, operator,
// editor). Inlined by build.py — keep this framework-free and
// dependency-free (no CDN, no bundler).

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function fmtNum(n) {
  if (n == null) return "—";
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

// YYYY-MM-DD in the viewer's own time zone. toISOString() is UTC, which
// puts "today" a day ahead in the evening (US) or a day behind in the
// morning (east of UTC) — every date in this system is a plain local date.
function localISODate(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function todayISO() { return localISODate(new Date()); }
function addDaysISO(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  return localISODate(new Date(y, m - 1, d + days));
}

// Month grid shared by every page's calendar. byDay: { "YYYY-MM-DD": [item] },
// chipHtml(item) renders one entry. state.offset is months from the current
// one; the ‹ › buttons change it and call rerender().
function renderMonthCalendar(container, byDay, chipHtml, state, rerender) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + (state.offset || 0), 1);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const title = first.toLocaleString(undefined, { month: "long", year: "numeric" });
  let html = `<div style="grid-column:1/-1;display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <button data-cal="-1">‹</button><b style="min-width:150px;text-align:center">${escapeHtml(title)}</b><button data-cal="1">›</button>
      ${state.offset ? `<button data-cal="0">Today</button>` : ""}
    </div>`;
  html += ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => `<div class="cal-dow">${d}</div>`).join("");
  for (let i = 0; i < first.getDay(); i++) html += `<div></div>`;
  const today = todayISO();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = localISODate(new Date(first.getFullYear(), first.getMonth(), day));
    const items = byDay[dateStr] || [];
    html += `<div class="cal-cell ${dateStr === today ? "today" : ""}"><div class="daynum">${day}</div>${items.map(chipHtml).join("")}</div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll("[data-cal]").forEach(b => b.onclick = () => {
    const step = Number(b.dataset.cal);
    state.offset = step === 0 ? 0 : (state.offset || 0) + step;
    rerender();
  });
}

// Sidebar view routing uses the plain URL hash: "#<view>".
// Sidebar view router: nav items carry data-view="<id>"; sections carry
// class="view" id="view-<id>". Call initRouter() once per page after render.
function initRouter(defaultView) {
  const items = document.querySelectorAll(".nav-item[data-view]");
  function activate(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const el = document.getElementById("view-" + view);
    if (el) el.classList.add("active");
    items.forEach(i => i.classList.toggle("active", i.dataset.view === view));
    window.location.hash = view;
  }
  items.forEach(i => i.addEventListener("click", () => activate(i.dataset.view)));
  const fromHash = window.location.hash.replace(/^#/, "");
  activate(fromHash && document.getElementById("view-" + fromHash) ? fromHash : defaultView);
  return activate;
}

// Minimal dependency-free multi-series line chart, rendered as inline SVG.
// series: [{ name, color, points: [{x: 'label', y: number}, ...] }]
function drawLineChart(container, series, opts) {
  opts = opts || {};
  const w = opts.width || 640, h = opts.height || 200, pad = { t: 10, r: 10, b: 22, l: 40 };
  const allY = series.flatMap(s => s.points.map(p => p.y));
  const maxY = Math.max(1, ...allY), minY = Math.min(0, ...allY);
  const xLabels = series[0] ? series[0].points.map(p => p.x) : [];
  const n = xLabels.length || 1;
  const xAt = i => pad.l + (i / Math.max(1, n - 1)) * (w - pad.l - pad.r);
  const yAt = v => (h - pad.b) - ((v - minY) / (maxY - minY || 1)) * (h - pad.t - pad.b);

  let svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" style="overflow:visible">`;
  // gridlines
  for (let g = 0; g <= 3; g++) {
    const gy = pad.t + (g / 3) * (h - pad.t - pad.b);
    svg += `<line x1="${pad.l}" y1="${gy}" x2="${w - pad.r}" y2="${gy}" stroke="var(--border)" stroke-width="1"/>`;
  }
  series.forEach(s => {
    const pts = s.points.map((p, i) => `${xAt(i)},${yAt(p.y)}`).join(" ");
    svg += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  // x labels: first, middle, last only (keep it readable)
  [0, Math.floor((n - 1) / 2), n - 1].forEach(i => {
    if (xLabels[i] == null) return;
    svg += `<text x="${xAt(i)}" y="${h - 4}" font-size="9" fill="var(--sub2)" text-anchor="middle">${escapeHtml(xLabels[i])}</text>`;
  });
  svg += `</svg>`;
  container.innerHTML = svg;
}

function statusBadge(status, labelMap) {
  const label = (labelMap && labelMap[status]) || status;
  return `<span class="badge" style="background:color-mix(in srgb, var(--status-${status}) 18%, transparent); color:var(--status-${status})">${escapeHtml(label)}</span>`;
}

const STATUS_LABEL = {
  concept_pending: "Concept", to_film: "To film", filmed: "Filmed",
  ready_to_edit: "Ready to edit", rejected: "Rejected", with_editor: "With editor",
  in_review: "In review (owner)", client_review: "Final review (client)",
  ready_to_post: "Ready to post", posted: "Posted"
};

// Full lifecycle, in order. Self-serve clients use all of it; concierge
// clients (system: "concierge") skip concept_pending/to_film entirely —
// Tait films the interview himself, so there's no client-facing pre-film
// approval step. Both systems share every stage from "filmed" onward.
const STATUS_ORDER = ["concept_pending","to_film","filmed","ready_to_edit","with_editor","in_review","client_review","ready_to_post","posted"];

// ---------- social_videos <-> page shape ----------
// social_videos is the single source of truth for every video. Pages work
// with the camelCase shape below; VIDEO_COLUMNS is the one mapping between
// the two, used in both directions so reads and writes can't drift apart.
const VIDEO_COLUMNS = {
  id: "id", clientId: "client_id", title: "title", platform: "platform",
  hook: "hook", overview: "overview", body: "body", concept: "concept",
  filmingDirection: "filming_instructions", caption: "caption", note: "note",
  status: "status", editorId: "editor_id", editorBrief: "editor_brief",
  dueToFilm: "due_to_film", dueToEdit: "due_to_edit", postDate: "post_date",
  conceptApprovedBy: "concept_approved_by", conceptApprovedAt: "concept_approved_at",
  createdAt: "created_at", updatedAt: "updated_at",
};
// Columns a page may write directly. Only operators have direct write
// access (RLS); clients and editors go through VIDEO_ACTIONS below.
// Gate-1 columns are deliberately absent — use the approve_concept action,
// so every approval is stamped and logged.
const VIDEO_WRITABLE = ["clientId","title","platform","hook","overview","body","concept",
  "filmingDirection","caption","note","status","editorId","editorBrief","dueToFilm","dueToEdit","postDate"];

function videoFromRow(row) {
  const v = {};
  Object.entries(VIDEO_COLUMNS).forEach(([key, col]) => { v[key] = row[col] === undefined ? null : row[col]; });
  v.platform = v.platform || [];
  v.editorBrief = v.editorBrief || {};
  v.assignedEditor = null; // display name — resolved from editorId by pages that load social_editors
  return v;
}
// Only keys present in `fields` are included, so a partial patch stays
// partial. Empty strings become null (blank form field = cleared).
function videoFieldsToRow(fields) {
  const row = {};
  VIDEO_WRITABLE.forEach(key => {
    if (!(key in fields)) return;
    const val = fields[key];
    row[VIDEO_COLUMNS[key]] = val === "" ? null : val;
  });
  return row;
}

// ---------- status changes ----------
// Mirrors the transition table in
// supabase/migrations/003_social_videos_write_path.sql — the database is
// what actually enforces these; this only decides which buttons to show.
// Keep the two in step. Operators move every other status by writing
// `status` directly (full RLS access), so only their gate-1 action is here.
const VIDEO_ACTIONS = {
  approve_concept_owner:   { role: "operator", rpc: "social_operator_approve_concept", from: ["concept_pending"], to: "concept_pending", label: "Approve concept", needsConceptUnapproved: true },
  approve_concept:         { role: "client", from: ["concept_pending"], to: "to_film",         label: "Approve", selfServeOnly: true },
  request_concept_changes: { role: "client", from: ["concept_pending"], to: "concept_pending", label: "Request changes", selfServeOnly: true, needsNote: true, notePrompt: "What needs to change?" },
  reject:                  { role: "client", from: ["concept_pending","to_film"], to: "rejected", label: "Deny", selfServeOnly: true, needsNote: true, notePrompt: "Why is this one being denied?", destructive: true },
  mark_filmed:             { role: "client", from: ["to_film"],       to: "filmed",        label: "Mark filmed", selfServeOnly: true },
  mark_ready_to_edit:      { role: "client", from: ["filmed"],        to: "ready_to_edit", label: "Mark ready to edit", selfServeOnly: true },
  approve_final:           { role: "client", from: ["client_review"], to: "ready_to_post", label: "Approve — ready to post" },
  request_revisions:       { role: "client", from: ["client_review"], to: "with_editor",   label: "Request revisions", needsNote: true, notePrompt: "What needs to change?", destructive: true },
  mark_delivered:          { role: "editor", rpc: "social_editor_mark_delivered", from: ["with_editor"], to: "in_review", label: "Mark delivered" },
};

// Action keys `role` may take on `video` right now. clientSystem is the
// social_clients.client_system of the video's client.
function videoActionsFor(video, role, clientSystem) {
  return Object.keys(VIDEO_ACTIONS).filter(key => {
    const a = VIDEO_ACTIONS[key];
    if (a.role !== role || !a.from.includes(video.status)) return false;
    if (a.selfServeOnly && clientSystem !== "self-serve") return false;
    if (a.needsConceptUnapproved && video.conceptApprovedAt) return false;
    return true;
  });
}

// Runs one action against Supabase (sbClient comes from auth.js). Resolves
// to { video } with the updated record, or { error } with the database's
// message — the database re-checks everything, so a refused move comes back
// here as an error rather than silently doing nothing.
async function runVideoAction(actionKey, videoId, note) {
  const a = VIDEO_ACTIONS[actionKey];
  if (!a) return { error: "Unknown action: " + actionKey };
  const { data, error } = a.rpc
    ? await sbClient.rpc(a.rpc, { p_video_id: videoId })
    : await sbClient.rpc("social_client_video_action", { p_video_id: videoId, p_action: actionKey, p_note: note || null });
  if (error) return { error: error.message };
  return { video: videoFromRow(data) };
}

// ---------- Video detail modal ----------
// The "Airtable, but every row is a video card" piece: one shared detail
// view for a video record, used by the client portal, operator dashboard,
// and editor dashboard alike. Only `actionsHtml` differs per audience —
// pass in whatever buttons make sense for who's looking.
function ensureModalRoot() {
  let root = document.getElementById("videoModalRoot");
  if (root) return root;
  root = document.createElement("div");
  root.id = "videoModalRoot";
  root.className = "modal-backdrop hidden";
  root.innerHTML = `<div class="modal-box" id="videoModalBox"></div>`;
  root.addEventListener("click", e => { if (e.target === root) closeVideoModal(); });
  document.body.appendChild(root);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeVideoModal(); });
  return root;
}
function closeVideoModal() {
  const root = document.getElementById("videoModalRoot");
  if (root) root.classList.add("hidden");
}
// Any content in the same modal (the operator's video form uses this).
// Returns the box so the caller can wire up what it rendered.
function openModal(html) {
  ensureModalRoot();
  const box = document.getElementById("videoModalBox");
  box.innerHTML = `<div class="modal-close" onclick="closeVideoModal()">✕</div>` + html;
  document.getElementById("videoModalRoot").classList.remove("hidden");
  return box;
}
function modalField(label, value) {
  if (!value) return "";
  return `<div class="modal-field"><b>${escapeHtml(label)}</b><div>${escapeHtml(value)}</div></div>`;
}
// client: { displayName, driveFolders }. video: a videoFromRow() record.
// opts.actionsHtml: buttons rendered at the bottom, audience-specific.
// opts.linkKeys: which driveFolders entries to show as quick links (default: all present).
// opts.hideEditorBrief: true for the client portal — editing instructions
// (story beats, must-keep, music, CTA, specs) are for the editor and the
// owner, never for the person who filmed the footage.
function openVideoModal(client, video, opts) {
  opts = opts || {};
  ensureModalRoot();
  const f = client.driveFolders || {};
  const linkKeys = opts.linkKeys || Object.keys(f);
  const linkLabels = { root: "Client folder", footageUploads: "Footage", finalEdits: "Deliver cut", brandVoice: "Brand voice", hooks: "Hooks", assets: "Assets", customerData: "Customer data", contentIdeas: "Content ideas" };
  const eb = video.editorBrief || {};
  const hasEditorBrief = !opts.hideEditorBrief && Object.values(eb).some(v => v);

  document.getElementById("videoModalBox").innerHTML = `
    <div class="modal-close" onclick="closeVideoModal()">✕</div>
    <h2>${escapeHtml(video.title || video.id)}</h2>
    <div class="modal-meta">${escapeHtml(client.displayName || "")} · ${(video.platform||[]).join(" · ")} ${statusBadge(video.status, STATUS_LABEL)}</div>

    <div class="modal-dates">
      <div><div class="lbl">Due to film</div>${escapeHtml(video.dueToFilm || "—")}</div>
      <div><div class="lbl">Due to edit</div>${escapeHtml(video.dueToEdit || "—")}</div>
      <div><div class="lbl">Post date</div>${escapeHtml(video.postDate || "—")}</div>
    </div>

    ${modalField("Overview", video.overview)}
    ${modalField("Hook", video.hook)}
    ${modalField("Body / talking points", video.body)}
    ${modalField("Filming direction", video.filmingDirection)}
    ${modalField("Caption", video.caption)}
    ${video.note ? modalField("Note", video.note) : ""}

    ${hasEditorBrief ? `
      <div class="modal-field"><b>Editor brief</b></div>
      ${modalField("Story beats", eb.storyBeats)}
      ${modalField("Must keep", eb.mustKeep)}
      ${modalField("Captions style", eb.captionsStyle)}
      ${modalField("Music / pacing vibe", eb.musicVibe)}
      ${modalField("CTA overlay", eb.ctaOverlay)}
      ${modalField("Platform specs", eb.platformSpecs)}
      ${video.assignedEditor ? modalField("Assigned editor", video.assignedEditor) : ""}
    ` : ""}

    <div class="modal-links">
      ${linkKeys.filter(k => f[k]).map(k => `<a class="btn" href="${f[k]}" target="_blank" rel="noopener">${escapeHtml(linkLabels[k] || k)}</a>`).join("")}
    </div>

    ${opts.actionsHtml ? `<div class="modal-actions">${opts.actionsHtml}</div>` : ""}
  `;
  document.getElementById("videoModalRoot").classList.remove("hidden");
}
