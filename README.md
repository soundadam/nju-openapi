# nju-openapi

南京大学教务网页登录后实际打的 HTTP 接口说明。非官方。给人和 agent 查功能用。请求就是 curl。

文档站点：[nju-openapi.mintlify.app](https://nju-openapi.mintlify.app)

范围只覆盖 ehall `jwapp` 四个应用：成绩查询、我的课表、本-课表查询、培养方案查询。不是 `jw.nju.edu.cn`。

Playground 只展示请求形状，不要从文档页打生产。

## 仓库

仓库根就是 Mintlify 内容目录：`docs.json`、`index.mdx`、`auth.mdx`、`openapi/`。仪表盘里内容目录留空或填 `/`，不要填 `docs`。

本地校验需要 Node 22（`npx mint` 在更新的 Node 上可能直接退出）：

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx mint validate
```

OpenAPI 是 3.1。`servers.url` 是 `https://ehallapp.nju.edu.cn`。
