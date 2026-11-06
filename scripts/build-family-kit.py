"""Package independent lessons and print materials; standard library only.
Run after build-workshop.py and build-pdf.mjs. The offline landing page needs no fetch.
"""
from pathlib import Path
from html import escape
import hashlib
import json
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = sys.argv[1] if len(sys.argv) > 1 else json.loads((ROOT / 'package.json').read_text())['version']
BASE = ROOT / 'dist/learn'
manifest = json.loads((BASE / 'examples/manifest.json').read_text())
files = {}
for entry in manifest:
    files['examples/' + entry['file']] = (BASE / 'examples' / entry['file']).read_bytes()
files['examples/manifest.json'] = (BASE / 'examples/manifest.json').read_bytes()
for name in [f'parent-child-guide-{VERSION}.md', f'parent-child-guide-{VERSION}.pdf', f'designer-cards-{VERSION}.pdf']:
    files[name] = (BASE / 'downloads' / name).read_bytes()
links = ''.join(f'<li><a href="examples/{escape(item["file"])}">{escape(item["title"])}</a><p>{escape(item["task"])}</p></li>' for item in manifest)
landing = f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>亲子游戏材料包 {VERSION}</title><style>body{{max-width:800px;margin:40px auto;padding:0 20px;background:#f7f2e6;color:#304b38;font:16px/1.8 system-ui}}a{{color:#426a4d}}li{{margin:20px 0}}p{{color:#67775c}}small{{color:#7c896c}}</style><h1>和孩子一起造一座火柴人王国</h1><p>v{VERSION} · 12 次基础探险 + 3 个进阶实验 · 每次 20–30 分钟</p><p>所有作品都可直接打开，不需要安装软件或联网。孩子提出预测、决定改动和解释结果；家长帮助打字、保存和备份。一次只改一个条件。</p><p><a href="parent-child-guide-{VERSION}.pdf">完整教程 PDF</a> · <a href="parent-child-guide-{VERSION}.md">可编辑教程</a> · <a href="designer-cards-{VERSION}.pdf">五页可打印记录卡</a></p><ol>{links}</ol><p><small>这是原创教学小模型。格子、回合与小数字用于理解规则，不是原作或正式游戏的数值。正式项目的更多系统请由家长陪伴探索。</small></p></html>'''
files['开始.html'] = landing.encode('utf-8')
files['请先阅读.txt'] = f'''余烬王国亲子材料包 v{VERSION}

1. 完整解压 ZIP 到一个家庭项目文件夹。
2. 双击“开始.html”，选择本次的小作品；examples 中所有 HTML 都能独立运行。
3. 家长协助用记事本或代码编辑器打开 HTML，一次只改一个数字或规则。
4. 另存一份新文件，回到浏览器打开它。不要覆盖上一份能运行的作品。
5. 学习顺序：先猜 → 动手 → 观察 → 解释。每次 20–30 分钟，兴趣到了就保存。

材料含 12 个基础作品、3 个进阶实验、完整教程和五页打印卡。
SHA256SUMS.json 记录每个文件的校验值，供家长核对材料完整性。
'''.encode('utf-8')
files['SHA256SUMS.json'] = (json.dumps({name: hashlib.sha256(data).hexdigest() for name, data in sorted(files.items())}, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
target = BASE / 'downloads' / f'ember-family-kit-{VERSION}.zip'
with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in sorted(files.items()):
        info = zipfile.ZipInfo(name, date_time=(2026, 11, 6, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, data)
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert len([name for name in archive.namelist() if name.startswith('examples/') and name.endswith('.html')]) == 15
print(f'Built {target.name}: {len(files)} files, 15 standalone lessons, verified ZIP CRCs.')
