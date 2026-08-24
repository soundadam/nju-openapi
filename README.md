# nju-openapi

南京大学各网页系统登录后实际打的 HTTP 接口说明。非官方。给人和 agent 查功能用。请求就是 curl。

文档站点：[nju-openapi.mintlify.app](https://nju-openapi.mintlify.app)

## 覆盖范围

- **教务 ehall**（`ehallapp.nju.edu.cn`，需登录）：成绩查询 `cjcx`、我的课表 `wdkb`、本-课表查询 `kcbcx`、培养方案 `qxfacx`、免修不免考 `mtxkbl`（含写接口）。
- **门户与通知**（多为公开抓取）：教务网 `jw`、科研院 `scit`、资产管理处 `zcc`、研招网 `yzb`、团委 `tuanwei`、信息化 `itsc`、交换生 `exchange`。
- **校园服务**：体育场馆 `venue`（独立 OAuth + 请求签名 + 点选验证码）。
- **认证**：统一认证 CAS（拿 `CASTGC`）、ehall 会话（appShow / changeAppRole）、Web VPN（aTrust 短信）。

Playground 只展示请求形状，不要从文档页打生产。写接口（如 `mtxkbl` 的 `sqmtkc`）会真提交申请，别对生产点。接口会变，没有 SLA，不要贴真实学号、成绩、手机号。

## 仓库

仓库根就是 Mintlify 内容目录：`docs.json`、`index.mdx`、说明页（`authserver.mdx`、`auth.mdx`、`webvpn.mdx`）、`openapi/`。仪表盘里内容目录留空或填 `/`，不要填 `docs`。

本地校验需要 Node 22（`npx mint` 在更新的 Node 上可能直接退出）：

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npx mint validate
```

OpenAPI 都是 3.1。各文件 `servers.url` 是对应系统的 host（ehall 是 `https://ehallapp.nju.edu.cn`，门户各用自己的域名）。抓包日期见各 yaml 的 `x-captured`。

## 终端浏览器

`tui/` 下有个用 [OpenTUI](https://github.com/anomalyco/opentui) 写的终端浏览器，读 `openapi/*.yaml`，在终端里翻接口：左侧列表、右侧详情。需要 [bun](https://bun.sh)：

```bash
cd tui
bun install
bun run start   # 交互式：↑↓ / j k 选择，q 退出
bun run list    # 纯文本列出所有系统与接口，可管道 / 给 CI
```

只读本地 yaml，不发网络请求。不进 Mintlify 构建（在 `.mintignore` 里）。
