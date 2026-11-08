"""Push prepared static files to gh-pages without switching or rewriting main."""
from pathlib import Path
import json
import os
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
REMOTE = 'github'
BRANCH = 'gh-pages'
OUTPUT = ROOT / 'artifacts/github-pages/site'


def git(*args, env=None, input=None):
    return subprocess.check_output(['git', *args], cwd=ROOT, env=env, input=input, text=True).strip()


def publish():
    if git('status', '--porcelain', '--untracked-files=normal'):
        raise SystemExit('Commit tracked changes before publishing their exact source state.')
    remote = git('remote', 'get-url', REMOTE)
    if remote not in {'https://github.com/channely/ember-stick-war.git', 'git@github.com:channely/ember-stick-war.git'}:
        raise SystemExit('The github remote must point to channely/ember-stick-war.')
    subprocess.run([sys.executable, str(ROOT / 'scripts/prepare-github-pages.py')], cwd=ROOT, check=True)
    tip = git('ls-remote', '--heads', REMOTE, f'refs/heads/{BRANCH}')
    parent = tip.split()[0] if tip else None
    if parent:
        subprocess.run(['git', 'fetch', '--no-tags', REMOTE, f'refs/heads/{BRANCH}'], cwd=ROOT, check=True)
    with tempfile.TemporaryDirectory(prefix='ember-pages-index-') as temporary:
        env = dict(os.environ, GIT_INDEX_FILE=str(Path(temporary) / 'index'))
        git('read-tree', '--empty', env=env)
        for path in sorted(OUTPUT.rglob('*')):
            if path.is_file():
                blob = git('hash-object', '-w', str(path))
                git('update-index', '--add', '--cacheinfo', '100644', blob, path.relative_to(OUTPUT).as_posix(), env=env)
        tree = git('write-tree', env=env)
    if parent and tree == git('rev-parse', f'{parent}^{{tree}}'):
        print('gh-pages already contains this exact build.')
        return
    info = json.loads((OUTPUT / 'build-info.json').read_text())
    parents = ['-p', parent] if parent else []
    commit = git('commit-tree', tree, *parents,
                 input=f'Publish game v{info["version"]} from {info["source_commit"][:7]}\n')
    # No force push: a concurrent deployment fails instead of overwriting it.
    subprocess.run(['git', 'push', REMOTE, f'{commit}:refs/heads/{BRANCH}'], cwd=ROOT, check=True)
    print(f'Static build pushed to {BRANCH}: {commit}')
    print('Pages settings: https://github.com/channely/ember-stick-war/settings/pages')


if __name__ == '__main__':
    publish()
