// Shared helpers for both dashboards. Inlined by build.py — keep this
// framework-free and dependency-free (no CDN, no bundler).

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function fmtNum(n) {
  if (n == null) return "—";
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

// URL-safe base64, used to hand a small JSON payload (a new video's fields)
// from the operator dashboard to a specific client's own live portal as a
// one-shot query param — see the "quick action" links in both templates.
function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return decodeURIComponent(escape(atob(str)));
}

const PLATFORM_COLOR = {
  instagram: "var(--instagram)", facebook: "var(--facebook)",
  twitter: "var(--twitter)", "twitter/x": "var(--twitter)", x: "var(--twitter)",
  linkedin: "var(--linkedin)", tiktok: "var(--tiktok)"
};
function platformColor(p) { return PLATFORM_COLOR[String(p || "").toLowerCase()] || "var(--sub)"; }

// Hash format is plain "#<view>" for normal navigation (unchanged), or
// "#s_<base64url JSON>" when a link needs to hand this page one-shot data
// — operator mode, quick actions (see client-portal.template.html and
// dashboards/template/README.md). Two things forced the "s_<opaque
// token>" shape, both confirmed by direct testing against a published
// claude.ai Artifact, not assumed:
//   1. Query-string params (?foo=bar) never reach the embedded document —
//      the wrapper doesn't forward them at all.
//   2. The hash DOES reach it, but only when it looks like a plain
//      identifier. "#?operator=1" arrived as an empty hash — the wrapper
//      silently drops anything containing "?", "=", "&". A bare
//      base64url token (letters/digits/-/_ only, which is exactly what
//      base64UrlEncode produces) survives.
// initRouter only ever looks at the <view> part; read parseHashParams()
// yourself for <params>, and do it before initRouter's first activate()
// call, which immediately overwrites the hash with just the view name.
function parseHashParams() {
  const raw = window.location.hash.replace(/^#/, "");
  if (raw.startsWith("s_")) {
    try {
      const state = JSON.parse(base64UrlDecode(raw.slice(2)));
      const params = new URLSearchParams();
      Object.entries(state).forEach(([k, v]) => { if (v != null && k !== "view") params.set(k, v); });
      return { view: state.view || "", params };
    } catch (e) { /* malformed token — fall through as if it were a plain view name */ }
  }
  return { view: raw, params: new URLSearchParams() };
}
// The encoding side of the above — build a link that hands a specific
// artifact one-shot state via its hash. `state.view` (optional) is which
// page to land on; everything else becomes a `parseHashParams().params`
// entry the receiving page reads by key.
function buildHashState(state) {
  return "#s_" + base64UrlEncode(JSON.stringify(state));
}

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
  const fromHash = parseHashParams().view;
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
  concept_pending: "Concept: awaiting client", to_film: "To film", filmed: "Filmed",
  ready_to_edit: "Ready to edit", rejected: "Rejected", with_editor: "With editor",
  in_review: "In review (owner)", client_review: "Final review (client)",
  ready_to_post: "Ready to post", posted: "Posted"
};

// Full lifecycle, in order. Self-serve clients use all of it; concierge
// clients (system: "concierge") skip concept_pending/to_film entirely —
// Tait films the interview himself, so there's no client-facing pre-film
// approval step. Both systems share every stage from "filmed" onward.
const STATUS_ORDER = ["concept_pending","to_film","filmed","ready_to_edit","with_editor","in_review","client_review","ready_to_post","posted"];

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
function modalField(label, value) {
  if (!value) return "";
  return `<div class="modal-field"><b>${escapeHtml(label)}</b><div>${escapeHtml(value)}</div></div>`;
}
// client: { displayName, driveFolders } — either a full client config or
// something shaped like one. video: the effective (override-merged) video.
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
  const linkLabels = { root: "Client folder", footageUploads: "Footage", finalEdits: "Deliver cut", brandVoice: "Brand voice", hooks: "Hooks", assets: "Assets" };
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
