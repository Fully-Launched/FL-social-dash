#!/usr/bin/env python3
"""
Regenerates the dashboards, writing everything into dashboards/dist/ — the
one directory meant to be served (Vercel's Output Directory points here;
see vercel.json). Nothing outside dist/ is ever written by this script.

All three pages are shared, static shells: every client, video, editor, and
Drive link is read live from Supabase after login (social_videos is the
single source of truth). The only things baked in at build time are the
shared shell code and agency-wide, non-sensitive content — news.json and
agency-resources.json. No client data ever goes into the built HTML, since
dist/ is served publicly and the login gate only runs in the browser.

Rebuild after changing a template, shell.css/shell.js/auth.js, news.json,
or agency-resources.json. Adding clients or videos never needs a rebuild.

Usage: python3 dashboards/build.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
TEMPLATE_DIR = ROOT / "template"
OPERATOR_DIR = ROOT / "operator"
DIST_DIR = ROOT / "dist"

SHELL_CSS = (TEMPLATE_DIR / "shell.css").read_text()
SHELL_JS = (TEMPLATE_DIR / "shell.js").read_text()
AUTH_JS = (TEMPLATE_DIR / "auth.js").read_text()


def load_json(path, default):
    if not path.exists():
        return default
    with path.open() as f:
        return json.load(f)


def inline_shell(html):
    html = html.replace("/*__SHELL_CSS__*/", SHELL_CSS)
    html = html.replace("/*__SHELL_JS__*/", SHELL_JS)
    html = html.replace("/*__AUTH_JS__*/", AUTH_JS)
    return html


def write(rel_path, html):
    out_path = DIST_DIR / rel_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html)
    print(f"built {out_path.relative_to(ROOT.parent)}")


def main():
    news = load_json(OPERATOR_DIR / "news.json", {"items": []})
    resources = load_json(OPERATOR_DIR / "agency-resources.json", {})

    # vercel.json rewrites /clients/<slug> (and the older
    # /clients/<slug>/portal.html) to this one file; it reads the slug from
    # its own URL at runtime.
    portal = inline_shell((TEMPLATE_DIR / "client-portal.template.html").read_text())
    portal = portal.replace("/*__NEWS_JSON__*/[]", json.dumps(news.get("items", []), indent=2))
    portal = portal.replace("/*__RESOURCES_JSON__*/{}", json.dumps(resources, indent=2))
    write("clients/portal.html", portal)

    write("operator/dashboard.html", inline_shell((OPERATOR_DIR / "dashboard.template.html").read_text()))

    editor = inline_shell((TEMPLATE_DIR / "editor-dashboard.template.html").read_text())
    editor = editor.replace("/*__RESOURCES_JSON__*/{}", json.dumps(resources, indent=2))
    write("editor/dashboard.html", editor)


if __name__ == "__main__":
    main()
