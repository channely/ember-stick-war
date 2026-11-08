# GitHub Pages 发布

目标仓库：`channely/-ember-stick-war`，保留私有属性。

预期网址：<https://channely.github.io/-ember-stick-war/>。仓库配置并成功构建 Pages 后才可访问。

## 首次开启

静态文件发布在独立的 `gh-pages` 分支根目录。打开仓库的 [Settings → Pages](https://github.com/channely/-ember-stick-war/settings/pages)，选择：

1. Source：**Deploy from a branch**。
2. Branch：**gh-pages**，目录 **/(root)**。
3. 点击 **Save**，等待 Pages 构建完成。

当前连接对 Pages 管理 API 返回 `403 Resource not accessible by integration`，因此不能通过该授权代替仓库管理员开启设置。管理员保存设置后，后续推送 `gh-pages` 会触发 Pages 更新。

GitHub 的个人私有仓库需要支持私有仓库 Pages 的套餐（如 GitHub Pro）。若设置页提示升级，请先由账户所有者处理套餐；这套发布脚本不更改仓库可见性。[GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

## 发布后续更新

先提交游戏改动并将主分支推送到 GitHub，再运行：

```sh
python scripts/publish-github-pages.py
```

脚本将当前 `dist/` 生成到被 Git 忽略的 `artifacts/github-pages/site/`，记录版本与源码提交，提交到 `gh-pages` 并正常推送，不切换主分支、不使用强制推送。重复发布同一提交时不创建多余提交。

只准备本地文件时使用 `python scripts/prepare-github-pages.py`。

## 网址与内容

- 游戏使用相对路径，支持项目子路径 `/-ember-stick-war/`。
- 工坊入口为 `/-ember-stick-war/learn/`，材料下载和版本页同样位于该项目路径下。
- `.nojekyll` 禁用 Jekyll 处理，直接发布静态文件。
- 完整项目源码 ZIP 不复制到 Pages。版本页的源码下载指向私有仓库，仍需仓库访问权限。
- 游戏及亲子教材可通过普通 Pages 网址公开访问；原私有 Sites 入口继续独立使用。
- 不同域名有独立的浏览器本地存档；GitHub Pages 不会自动读到原站点的游戏进度。

可通过 `/build-info.json` 核对游戏版本和对应的源码提交。

## 本次验证与权限状态（2026-11-08）

本地按 `/-ember-stick-war/` 项目路径测试，23 项检查通过：桌面与手机加载、征兵、战斗计时、暂停、工坊的 15 个示例、教材下载、源码包排除及无资源错误。此检查验证发布文件可用，不代表 GitHub Pages 已经启用。

Pages 查询与创建接口均返回 `403 Resource not accessible by integration`；仓库元数据中的 `has_pages` 为 false，目标网址尚为 HTTP 404。所需的 Pages/Administration 管理权限不包含在当前 GitHub 连接授权中。

浏览器接管备选也不可用：环境 `ccarenv_b64_Y2NhcmVudl8xODQ5ZGE5Zjg5ODQ4MTkxOTM5MzFkNTQ3ODg2NzQ4NA` 的当前 `capabilities` 为空，未配置 `remote_desktop`，且未提供 `cua_repl.js` 或浏览器控制工具。因此首次保存 Pages 设置需要仓库管理员在 GitHub 网页完成。
