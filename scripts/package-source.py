"""Package the current release from its complete source; exclude generated source archives."""
from pathlib import Path
import zipfile, hashlib, json
ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT/'package.json').read_text())['version']
out = ROOT/f'dist/release/ember-stick-war-source-{VERSION}.zip'
excluded = {'.git', 'node_modules', 'artifacts', '__pycache__', '.cache'}
files = [p for p in ROOT.rglob('*') if p.is_file()
    and not set(p.relative_to(ROOT).parts) & excluded
    and not (p.parent == out.parent and p.name.startswith('ember-stick-war-source-') and p.suffix == '.zip')
    and p.suffix not in ['.log', '.pyc']]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    manifest = {}
    for p in sorted(files):
        name = str(p.relative_to(ROOT)); data = p.read_bytes()
        z.writestr(f'ember-stick-war-{VERSION}/'+name, data)
        manifest[name] = hashlib.sha256(data).hexdigest()
    z.writestr(f'ember-stick-war-{VERSION}/SOURCE_MANIFEST.json', json.dumps({
        'version':VERSION,
        'note':'Source download archives and Git history are excluded; all other release files are checksummed.',
        'sha256':manifest}, ensure_ascii=False, indent=2))
print(out.name, len(files), 'files', out.stat().st_size, 'bytes')
