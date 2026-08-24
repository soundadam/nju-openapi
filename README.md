# nju-openapi

南京大学 ehall 教务网页内部接口的非官方 OpenAPI + Mintlify 文档。不是学校官方文档，会变。

范围只有四个 ehall 应用：成绩查询、我的课表、本-课表查询、培养方案。对照实现是 [nju-cli](https://github.com/nju-cli/nju-cli) `crates/ehall/`。

本地：

```sh
npx mint validate
npx mint dev
```

Playground 固定 `simple`，关掉代理，避免文档站打教务生产。

Mintlify 仪表盘绑定这个 GitHub 仓，内容目录留仓库根（`docs.json` 在根上）。改 Git 源只能在仪表盘做。不要让仪表盘「绑定仓库」自动另建一个空仓。
