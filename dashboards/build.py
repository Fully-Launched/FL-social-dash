#!/usr/bin/env python3
"""
Regenerates the dashboards from dashboards/clients/<slug>/config.json and
dashboards/operator/news.json, writing everything into dashboards/dist/ —
the one directory meant to be served (Vercel's Output Directory points
here; see vercel.json). Nothing outside dist/ is ever written by this
script, and dist/ itself holds nothing but build output — no source
config.json/template files live in it.

Run this after calendar-planner updates a client's config.json, after
editing news.json/competitors/analytics, or after adding a new client. It
never touches the templates — only dist/.

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


CONFIG_PLACEHOLDER = "/*__CONFIG_JSON__*/null"


def safe_json(value):
    """json.dumps, but with </script sequences broken up so embedding the
    result inside a <script> block can't prematurely close the tag —
    defensive, in case a client's data ever contains that literal text."""
    return json.dumps(value, indent=2).replace("</script", "<\\/script")


def build_client_portal(config, news, resources):
    template = (TEMPLATE_DIR / "client-portal.template.html").read_text()
    out = inline_shell(template)
    out = out.replace("__DISPLAY_NAME__", config.get("displayName", config["client"]))
    plan = config.get("planWindow", {})
    out = out.replace("__PLAN_START__", plan.get("start", "?"))
    out = out.replace("__PLAN_END__", plan.get("end", "?"))
    footage_url = config.get("driveFolders", {}).get("footageUploads", "#")
    out = out.replace("__FOOTAGE_FOLDER__", footage_url)
    client_news = [
        item for item in news.get("items", [])
        if not item.get("relevantClients") or config["client"] in item["relevantClients"]
    ]
    out = out.replace("/*__NEWS_JSON__*/[]", json.dumps(client_news, indent=2))
    out = out.replace("/*__RESOURCES_JSON__*/{}", json.dumps(resources, indent=2))
    final = out.replace(CONFIG_PLACEHOLDER, safe_json(config))
    out_dir = DIST_DIR / "clients" / config["client"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "portal.html"
    out_path.write_text(final)
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
    configs = load_client_configs()
    if not configs:
        print("No dashboards/clients/*/config.json found — nothing to build.")
        return
    news = load_news()
    resources = load_agency_resources()
    for config in configs:
        path = build_client_portal(config, news, resources)
        print(f"built {path.relative_to(ROOT.parent)}  ({len(config.get('videos', []))} videos)")
    op_path = build_operator_dashboard(configs, news)
    print(f"built {op_path.relative_to(ROOT.parent)}  ({len(configs)} client(s), {len(news.get('items', []))} news item(s))")
    ed_path = build_editor_dashboard(configs, resources)
    with_editor_count = sum(1 for c in configs for v in c.get("videos", []) if v.get("status") == "with_editor")
    print(f"built {ed_path.relative_to(ROOT.parent)}  ({with_editor_count} video(s) with an editor)")


if __name__ == "__main__":
    main()
