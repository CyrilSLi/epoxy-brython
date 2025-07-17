#!/usr/bin/env python3

# Built-in modules
import base64, os, subprocess
from pathlib import Path

# Third-party modules
import requests as req

os.chdir(Path(__file__).parent.resolve())
web_imports = ["https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-tls/full/epoxy-bundled.min.js"]

for i in ("brython", "javascript"):
    source = Path(i + ".js").resolve()
    min_file = Path(f"../dist/{i}.min.js").resolve()
    bundled_file = Path(f"../dist/{i}-bundled.min.js").resolve()
    with open(source) as f:
        terser = subprocess.run(["terser", str(source), "--compress", "--mangle", "--output", str(min_file)])
    terser.check_returncode()
    with open(min_file) as f:
        min_code = f.read()
    for j in web_imports:
        imported = req.get(j)
        imported.raise_for_status()
        for search in ("import('{}')", 'import("{}")'):
            min_code = min_code.replace(search.format(j), search.format("data:text/javascript;base64," + base64.b64encode(imported.content).decode()))
        terser = subprocess.run(["terser", "--compress", "--mangle", "--output", str(bundled_file)], input=min_code.encode())
        terser.check_returncode()
