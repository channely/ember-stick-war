# 火柴人战争 · 余烬王国 0.3.0

中文单人浏览器策略游戏。采矿、招募、军团指挥与单兵操控组成完整战斗：六种兵种拥有独立动作，30 关逐步解锁科技并检验不同策略。附带面向二年级孩子和家长的游戏制作工坊。

- [游戏](https://ember-stick-war.channely.chatgpt.site/)
- [亲子工坊：12 课与 3 个进阶实验](https://ember-stick-war.channely.chatgpt.site/learn/)
- [版本与下载](https://ember-stick-war.channely.chatgpt.site/release/)
- [私有 GitHub 仓库](https://github.com/channely/-ember-stick-war)
- [教程 PDF](dist/learn/downloads/parent-child-guide-0.3.0.pdf) · [离线材料包](dist/learn/downloads/ember-family-kit-0.3.0.zip) · [打印活动卡](dist/learn/downloads/designer-cards-0.3.0.pdf)

原 Sites 站点和源码仓库保持私有。游戏与学习进度保存在当前浏览器，不上传到服务器。

## GitHub Pages

已提供 `gh-pages` 发布脚本，发布当前版本到项目网址 `https://channely.github.io/-ember-stick-war/`。首次开启需要在仓库 [Settings → Pages](https://github.com/channely/-ember-stick-war/settings/pages) 选择 **Deploy from a branch → gh-pages → /(root)** 并保存；构建成功后网址才可访问。

后续提交并推送主分支后，运行 `python scripts/publish-github-pages.py` 更新网页。完整源码 ZIP 不进入 Pages，源码下载仍需私有仓库权限。私有仓库使用 Pages 需要支持该功能的 GitHub 套餐，网站默认公开访问。步骤及验证方式见 [GitHub Pages 发布说明](docs/GITHUB-PAGES.md)。

## 这一版怎么玩

战斗金币用于征兵；通关首次获得的升级点用于兵器库；宝石用于各兵种装备和消耗法术。先建立经济，再决定出兵组合与进退时机。矿工必须把黄金送回营地，矿脉会耗尽，敌军也有真实矿工和经济。

| 角色 | 手动操作 |
| --- | --- |
| 矿工 | 挥镐采掘、背金移动，回营自动交付 |
| 剑士 | 普攻、举剑格挡、跳斩 |
| 弓箭手 | 按住瞄准、松开发射；箭矢按实际轨迹命中 |
| 盾矛兵 | 刺击、举盾、投矛；失去长矛后用短剑，回营补矛 |
| 法师 | 范围震击、召唤小兵；法师帽增加召唤上限 |
| 巨人 | 范围重击；非经典皮肤手操可用地震 |

点击己方单位接管，WASD 移动，空格主要动作，Q/E 专属动作。1–6 招募，Z/X/C 驻营、防守、进攻，P 暂停，Esc 交还指挥。具体动作以选中面板提示为准。触屏使用左侧摇杆与右侧动作区，弓手可拖动瞄准。

人口上限 50，训练队列 5 位。六种法术使用库存并共享冷却。主线前 12 关按经典科技推进，接着 6 关装备试炼与 12 关策略挑战；初始不开放全部兵种。标准规则可选亲子辅助：半速、暂停下令和提示，成绩单独记录。六兵种练习不消耗背包资源、不提供战役奖励。

## 本地运行

需要 Python 3；游戏无需前端依赖和构建步骤。

```sh
python -m http.server 4173 --directory dist
```

打开 `http://localhost:4173`。也可使用 `npm start`。正式游戏使用 ES 模块，需要 HTTP 服务；工坊 `dist/learn/examples/` 中的 15 个小作品可双击离线运行。

## 验证

需要 Node.js 20 或更新版本。

```sh
npm test
npm run check
npm run test:browser
node scripts/workshop-qa.mjs
```

浏览器脚本需要已运行的本地服务器、Playwright 和 Chromium。规则测试覆盖固定步长、实际命中、双边经济、单位动作、关卡与存档迁移。连续战役测试使用正常采金及累计升级奖励，浏览器中的特殊场景 fixture 仅用于交互验证，不作为通关证据。最终结果见 [0.3.0 验证记录](docs/验证记录-0.3.0.md)。

## 源码结构

| 模块 | 职责 |
| --- | --- |
| `dist/engine.js`、`dist/rules.js`、`dist/sim/` | 固定步长模拟、规则参数、碰撞与经济 |
| `dist/content.js` | 30 关、皮肤、法术与升级分支 |
| `dist/progress.js` | 三种资源、科技、装备、分模式成绩及旧档迁移 |
| `dist/input.js`、`dist/game.js` | 键鼠/触控输入与页面连接 |
| `dist/pose.js`、`dist/art*.js` | 角色姿势、装备锚点与绘制 |
| `dist/learn/` | 工坊、可编辑代码、15 个独立作品及下载材料 |
| `tests/`、`scripts/` | 规则与浏览器验收、材料生成与打包 |

教学更新步骤：`python scripts/build-learning.py`、`python scripts/build-workshop.py`、`node scripts/build-pdf.mjs`、`python scripts/build-family-kit.py`。生成源码包使用 `python scripts/package-source.py`，其清单校验每个文件。字体子集由 `scripts/subset-fonts.py` 生成。

## 兼容与对齐边界

新档使用 `ember-kingdom-v3`。首次读取旧版本时保留旧存储键和完整历史，返还旧升级、旧道具价值，已购皮肤授予对应六兵种；新主线从第一关开始。旧战斗快照不能混入新规则，新版恢复战斗时保持暂停。

本项目独立实现美术、代码、关卡脚本和音效，以《火柴人战争：遗产》经典玩法为参考。已核实机制与网页标定参数分开记录，详见 [规则对齐说明](docs/规则对齐-0.3.0.md)。本版包含七套选定皮肤，没有新增锦标赛、周任务或原作僵尸模式。

字体使用 Noto CJK 本地子集，许可证见 `dist/assets/fonts/LICENSE.txt`。
