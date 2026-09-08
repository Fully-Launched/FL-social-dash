#!/usr/bin/env python3
"""
Regenerates the dashboards, writing everything into dashboards/dist/ — the
one directory meant to be served (Vercel's Output Directory points here;
see vercel.json). Nothing outside dist/ is ever written by this script,
and dist/ itself holds nothing but build output — no source config.json/
template files live in it.

The client portal (dashboards/dist/clients/portal.html) is ONE shared file
now, not one per client — it reads its client from the URL and fetches
that client's data live from Supabase (social_clients/social_videos/
social_drive_folder_links) at runtime, so adding a client never needs a
rebuild. The operator and editor dashboards still read every client's
dashboards/clients/<slug>/config.json + dashboards/operator/news.json —
that hasn't changed, so THIS script still needs to run after
calendar-planner updates a client's config.json, after editing
news.json/competitors/analytics, or after adding a new client to that
pair of dashboards specifically. It never touches the templates — only
dist/.

Usage: python3 dashboards/build.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
CLIENTS_DIR = ROOT / "clients"
TEMPLATE_DIR = ROOT / "template"
OPERATOR_DIR = ROOT / "operator"
DIST_DIR = ROOT / "dist"

SHELL_CSS = (TEMPLATE_DIR / "shell.css").read_text()
SHELL_JS = (TEMPLATE_DIR / "shell.js").read_text()
AUTH_JS = (TEMPLATE_DIR / "auth.js").read_text()


def load_client_configs():
    configs = []
    for config_path in sorted(CLIENTS_DIR.glob("*/config.json")):
        with config_path.open() as f:
            configs.append(json.load(f))
    return configs


def load_news():
    news_path = OPERATOR_DIR / "news.json"
    if not news_path.exists():
        return {"items": []}
    with news_path.open() as f:
        return json.load(f)


def load_agency_resources():
    path = OPERATOR_DIR / "agency-resources.json"
    if not path.exists():
        return {}
    with path.open() as f:
        return json.load(f)


def inline_shell(html):
    html = html.replace("/*__SHELL_CSS__*/", SHELL_CSS)
    html = html.replace("/*__SHELL_JS__*/", SHELL_JS)
    html = html.replace("/*__AUTH_JS__*/", AUTH_JS)
    return html


def build_client_portal_template(news, resources):
    """Client data (social_clients/social_videos/social_drive_folder_links)
    is read live from Supabase now, not baked from config.json — see
    dashboards/template/client-portal.template.html's startApp(). So this
    writes ONE file, shared by every client, not one per client_config —
    vercel.json's rewrites route /clients/<slug> (and the older
    /clients/<slug>/portal.html shape some clients' config.json still has
    as portalUrl) to this same file, and the page reads the slug from its
    own URL at runtime. News/resources are still safe to bake once, since
    they're agency-wide, not per-client — the per-client relevantClients
    filter on news now runs client-side in startApp() instead of here.
    """
    template = (TEMPLATE_DIR / "client-portal.template.html").read_text()
    out = inline_shell(template)
    out = out.replace("/*__NEWS_JSON__*/[]", json.dumps(news.get("items", []), indent=2))
    out = out.replace("/*__RESOURCES_JSON__*/{}", json.dumps(resources, indent=2))
    out_dir = DIST_DIR / "clients"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "portal.html"
    out_path.write_text(out)
    return out_path


def build_operator_dashboard(configs, news):
    template = (OPERATOR_DIR / "dashboard.template.html").read_text()
    out = inline_shell(template)
    out = out.replace("/*__CLIENTS_JSON__*/[]", json.dumps(configs, indent=2))
    out = out.replace("/*__NEWS_JSON__*/[]", json.dumps(news.get("items", []), indent=2))
    out_dir = DIST_DIR / "operator"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "dashboard.html"
    out_path.write_text(out)
    return out_path


def build_editor_dashboard(configs, resources):
    template = (TEMPLATE_DIR / "editor-dashboard.template.html").read_text()
    out = inline_shell(template)
    out = out.replace("/*__CLIENTS_JSON__*/[]", json.dumps(configs, indent=2))
    out = out.replace("/*__RESOURCES_JSON__*/{}", json.dumps(resources, indent=2))
    out_dir = DIST_DIR / "editor"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "dashboard.html"
    out_path.write_text(out)
    return out_path


def main():
    news = load_news()
    resources = load_agency_resources()

    # Client data is live now — this doesn't need any config.json to exist,
    # unlike the operator/editor builds below.
    portal_path = build_client_portal_template(news, resources)
    print(f"built {portal_path.relative_to(ROOT.parent)}  (shared — every client's data is fetched live at runtime)")

    configs = load_client_configs()
    if not configs:
        print("No dashboards/clients/*/config.json found — operator/editor dashboards not built (they still read config.json for now).")
        return
    op_path = build_operator_dashboard(configs, news)
    print(f"built {op_path.relative_to(ROOT.parent)}  ({len(configs)} client(s), {len(news.get('items', []))} news item(s))")
    ed_path = build_editor_dashboard(configs, resources)
    with_editor_count = sum(1 for c in configs for v in c.get("videos", []) if v.get("status") == "with_editor")
    print(f"built {ed_path.relative_to(ROOT.parent)}  ({with_editor_count} video(s) with an editor)")


if __name__ == "__main__":
    main()
