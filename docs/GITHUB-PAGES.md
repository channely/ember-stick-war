# GitHub Pages 发布

游戏地址：<https://channely.github.io/ember-stick-war/>

- 亲子工坊：<https://channely.github.io/ember-stick-war/learn/>
- 版本与下载：<https://channely.github.io/ember-stick-war/release/>
- 源码仓库：<https://github.com/channely/ember-stick-war>

## 当前配置

2026-11-08，仓库管理员已保存 Pages 设置。GitHub 返回 `status: built`、`https_enforced: true`；游戏首页与版本信息均可通过 HTTPS 访问。

仓库名称已从 `-ember-stick-war` 改为 `ember-stick-war`，目前 GitHub 显示仓库为公开。Pages 使用 **Deploy from a branch → gh-pages → /(root)**，后续推送 `gh-pages` 会触发自动构建。

旧的 `https://channely.github.io/-ember-stick-war/` 地址不再适用；请使用本页的新地址。

## 发布后续更新

先提交游戏改动并将主分支推送到 GitHub，再运行：

```sh
python scripts/publish-github-pages.py
```

脚本将当前 `dist/` 生成到被 Git 忽略的 `artifacts/github-pages/site/`，记录版本与源码提交，提交到 `gh-pages` 并正常推送，不切换主分支、不使用强制推送。重复发布同一提交时不创建多余提交。

只准备本地文件时使用 `python scripts/prepare-github-pages.py`。

Git 远端 `github` 应为 `https://github.com/channely/ember-stick-war.git`；原 Sites 源码远端 `origin` 独立保留。

## 内容与验证

- 游戏使用相对路径，支持项目子路径 `/ember-stick-war/`。
- `.nojekyll` 禁用 Jekyll 处理，直接发布静态文件。
- 完整项目源码 ZIP 不复制到 Pages。版本页的源码下载指向 GitHub 仓库。
- 不同域名有独立的浏览器本地存档；GitHub Pages 不会自动读到原站点的游戏进度。
- 访问 <https://channely.github.io/ember-stick-war/build-info.json> 可核对游戏版本和对应源码提交。

本地项目路径验证曾通过 23 项检查，覆盖桌面、手机、征兵、计时、暂停、15 个教学示例、下载和资源加载。线上部署结果同时可在仓库 [Actions](https://github.com/channely/ember-stick-war/actions) 查看。
