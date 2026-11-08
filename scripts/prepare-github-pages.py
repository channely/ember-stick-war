"""Prepare the current game's static files for a GitHub project Pages site."""
from pathlib import Path
import json
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'artifacts/github-pages/site'
REPOSITORY = 'channely/-ember-stick-war'
PAGES_URL = 'https://channely.github.io/-ember-stick-war/'


def prepare():
    version = json.loads((ROOT / 'package.json').read_text())['version']
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=OUTPUT.parent) as temporary:
        stage = Path(temporary) / 'site'
        shutil.copytree(ROOT / 'dist', stage, ignore=shutil.ignore_patterns('ember-stick-war-source-*.zip'))
        (stage / '.nojekyll').write_text('')
        (stage / 'build-info.json').write_text(json.dumps({
            'version': version, 'source_commit': commit,
            'repository': REPOSITORY, 'url': PAGES_URL
        }, ensure_ascii=False, indent=2) + '\n')
        release = stage / 'release/index.html'
        text = release.read_text()
        text = re.sub(r'href="\./(ember-stick-war-source-([^"/]+)\.zip)"',
                      lambda m: f'href="https://github.com/{REPOSITORY}/blob/v{m[2]}/dist/release/{m[1]}?raw=true"', text)
        text = text.replace('本站与源码仓库保持私有。', '游戏网站公开访问，完整源码下载需要仓库访问权限。')
        release.write_text(text)
        for path in stage.rglob('*'):
            if path.is_file() and path.suffix in {'.html', '.md'}:
                path.write_text(path.read_text().replace('https://ember-stick-war.channely.chatgpt.site', PAGES_URL.rstrip('/')))
        if OUTPUT.exists():
            shutil.rmtree(OUTPUT)
        shutil.move(str(stage), OUTPUT)
    print(f'Prepared v{version} from {commit[:7]}: {OUTPUT}')
    print(f'Pages URL after activation: {PAGES_URL}')
    return OUTPUT


if __name__ == '__main__':
    prepare()
