"""Create a ready-to-copy HA www directory and the reproducible source project."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parents[1]
out = root.parent / "Music-Manager-1.0.0.zip"
fixture = (root / "tests/fixture.html").read_text()
script = (root / "dist/music-manager-card.js").read_text()
preview = fixture.replace('<script type="module" src="../dist/music-manager-card.js"></script>', '<script type="module">' + script.replace('</script', '<\\/script') + '</script>')
# The module providing the card is self-contained, with no fetches or imports.
(root / "Vorschau.html").write_text(preview)
with ZipFile(out, "w", ZIP_DEFLATED, compresslevel=9) as archive:
    for name in ["README.md", "LICENSE", "Vorschau.html"]:
        archive.write(root / name, name)
    archive.write(root / "dist/LICENSES.txt", "LICENSES.txt")
    for name in ["music-manager-card.js", "LICENSES.txt", "manifest.json"]:
        archive.write(root / "dist" / name, "www/music-manager/" + name)
    for file in sorted((root / "brand").iterdir()):
        archive.write(file, "brand/" + file.name)
    for file in sorted(root.rglob("*")):
        if not file.is_file():
            continue
        relative = file.relative_to(root)
        if any(part in {".git", "node_modules", "test-results", "__pycache__"} for part in relative.parts) or file.name == "Vorschau.html":
            continue
        archive.write(file, "source/" + relative.as_posix())
with ZipFile(out) as archive:
    assert archive.testzip() is None
    assert archive.read("www/music-manager/music-manager-card.js") == (root / "dist/music-manager-card.js").read_bytes()
    manifest = json.loads(archive.read("www/music-manager/manifest.json"))
    for name, expected in manifest["files"].items():
        assert hashlib.sha256(archive.read("www/music-manager/" + name)).hexdigest() == expected
print(json.dumps({"file":str(out),"bytes":out.stat().st_size,"sha256":hashlib.sha256(out.read_bytes()).hexdigest()}))
