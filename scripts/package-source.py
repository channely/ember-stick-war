"""Package this release's complete working source, excluding Git internals and the archive itself."""
from pathlib import Path
import zipfile,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'dist/release/ember-stick-war-source-0.2.0.zip'
files=[p for p in ROOT.rglob('*') if p.is_file() and p!=out and not set(p.relative_to(ROOT).parts)&{'.git','node_modules','artifacts','__pycache__'} and p.suffix not in ['.log','.pyc']]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 manifest={}
 for p in sorted(files):
  name=str(p.relative_to(ROOT));data=p.read_bytes();z.writestr('ember-stick-war-0.2.0/'+name,data);manifest[name]=hashlib.sha256(data).hexdigest()
 z.writestr('ember-stick-war-0.2.0/SOURCE_MANIFEST.json',json.dumps({'version':'0.2.0','note':'The source ZIP itself and Git history are intentionally excluded.','sha256':manifest},ensure_ascii=False,indent=2))
print(out.name,len(files),'files',out.stat().st_size,'bytes')
