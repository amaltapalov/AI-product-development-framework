#!/usr/bin/env python3
"""Build the framework portal.

Reads the framework markdown (single source of truth) and inlines it into
template.html, producing index.html. Standard library only.

    python3 portal/build.py              # uses the newest version file
    python3 portal/build.py path/to/other-version.md
"""
import hashlib
import json
import re
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
PLACEHOLDER = "/*__FRAMEWORK_MD__*/"


def latest_source() -> pathlib.Path:
    """Pick the highest-numbered 'Conversational AI Design Framework v*.md' next to the portal."""
    files = list(HERE.parent.glob("Conversational AI Design Framework v*.md"))
    if not files:
        sys.exit("No 'Conversational AI Design Framework v*.md' file found.")
    def version(f: pathlib.Path):
        m = re.search(r"v(\d+(?:\.\d+)*)", f.stem)
        return tuple(int(x) for x in m.group(1).split(".")) if m else (0,)
    return max(files, key=version)


def main() -> None:
    source = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else latest_source()
    md = source.read_text(encoding="utf-8")
    template = (HERE / "template.html").read_text(encoding="utf-8")
    if PLACEHOLDER not in template:
        sys.exit(f"Placeholder {PLACEHOLDER} not found in template.html")
    payload = json.dumps(md, ensure_ascii=False).replace("</", "<\\/")
    out = template.replace(PLACEHOLDER, payload)
    # Version local assets so browsers don't keep serving stale copies after a rebuild.
    def bust(m: re.Match) -> str:
        f = HERE / m.group(2)
        if not f.is_file():
            return m.group(0)
        v = hashlib.sha1(f.read_bytes()).hexdigest()[:10]
        return f'{m.group(1)}="{m.group(2)}?v={v}"'
    out = re.sub(r'(src|href)="([\w.-]+\.(?:js|css))"', bust, out)
    (HERE / "index.html").write_text(out, encoding="utf-8")
    print(f"Built {HERE / 'index.html'} from {source.name} ({len(md):,} chars)")


if __name__ == "__main__":
    main()
