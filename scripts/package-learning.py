"""Create a standalone, offline family kit from the checked-in learning artifacts."""
from pathlib import Path
import zipfile,json,html
ROOT=Path(__file__).resolve().parents[1];base=ROOT/'dist/learn';out=base/'downloads/ember-family-kit-0.2.0.zip'
manifest=json.loads((base/'examples/manifest.json').read_text())
links=''.join(f'<a href="examples/{x["file"]}"><b>{x["title"]}</b><small>{html.escape(x["task"])}</small></a>' for x in manifest)
index='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>我们的火柴人王国 · 离线材料包</title><style>body{max-width:900px;margin:40px auto;padding:0 22px;background:#f6f1e6;color:#354e38;font:16px/1.9 system-ui}h1{font-size:32px}p,small{color:#839076}main{display:grid;grid-template-columns:1fr 1fr;gap:15px}a{color:#506f43}main a{display:block;background:#fffdf4;border:1px solid #d9dec8;padding:20px;border-radius:8px;text-decoration:none}small{display:block;font-size:12px;margin-top:10px}footer{margin:30px 0;font-size:12px}@media(max-width:600px){main{grid-template-columns:1fr}}</style><h1>和孩子一起，造一座火柴人王国。</h1><p>解压后直接打开此文件。先猜，再试，最后说一说。每次只完成一个小变化。</p><p><a href="parent-child-guide-0.2.0.pdf">完整教程 PDF</a> · <a href="parent-child-guide-0.2.0.md">可编辑教程</a> · <a href="cards.html">打印任务卡</a> · <a href="designer-cards-0.2.0.pdf">四张任务卡 PDF</a></p><main>'''+links+'''</main><footer>家长用文本编辑器打开 HTML，孩子决定修改的数字或规则。保存后刷新浏览器。v0.2.0 · 原创教学材料。</footer></html>'''
readme='''亲子游戏工坊 · 0.2.0

1. 将 ZIP 完整解压到一个新文件夹。
2. 双击 index.html，选择今天的课程。也可以直接打开 examples 中的 HTML 文件。
3. 第一课可以只用纸、笔与豆子。每次约 20–30 分钟，可拆开完成。
4. 阅读 parent-child-guide-0.2.0.pdf，包含从空白文件开始的 9 行代码、12 次课程和第一课脚本。
5. 家长用记事本或代码编辑器打开示例 HTML，孩子决定修改哪一个数字。保存，回浏览器刷新。
6. 保存为新文件，保留上一份能运行的版本。不要用 Word 编辑代码。
7. cards.html 或 designer-cards-0.2.0.pdf 可打印规则卡、关卡卡、测试卡与日记。

每个示例都可以离线运行，不需要安装 Node.js 或 Python。
这是教学用精简作品。正式版游戏的完整源码与版本说明：
https://ember-stick-war.channely.chatgpt.site/release/
在线游戏和工坊： https://ember-stick-war.channely.chatgpt.site/

孩子负责预测、设计、画图、试玩和解释，家长负责设备、打字协助、保存与账号。
'''
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 z.writestr('index.html',index);z.writestr('README-先读我.txt',readme)
 for file in (base/'examples').glob('*.html'):z.write(file,'examples/'+file.name)
 for file in ['parent-child-guide-0.2.0.pdf','parent-child-guide-0.2.0.md','designer-cards-0.2.0.pdf']:z.write(base/'downloads'/file,file)
 z.writestr('cards.html',(base/'cards.html').read_text().replace("../assets/fonts/","assets/fonts/"))
 for file in ['sans-regular.woff','LICENSE.txt']:z.write(ROOT/'dist/assets/fonts'/file,'assets/fonts/'+file)
print(out.name,out.stat().st_size,'bytes')
