#!/usr/bin/env bun
/**
 * nju-openapi 终端浏览器。
 *
 * 读取 ../openapi/*.yaml，在终端里分接口浏览：左侧列表、右侧详情。
 *   bun run browse.ts          交互式浏览（需要 TTY）
 *   bun run browse.ts --list   纯文本打印所有系统与接口（可管道 / CI）
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const HERE = dirname(fileURLToPath(import.meta.url));
const OPENAPI_DIR = join(HERE, "..", "openapi");
const METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;
const ACCENT = "#3D4F7A";

interface Operation {
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: any[];
  requestBody: any;
  responses: Record<string, any>;
}

interface System {
  title: string;
  file: string;
  server: string;
  doc: any;
  ops: Operation[];
}

function resolveRef(doc: any, node: any): any {
  if (node && typeof node.$ref === "string" && node.$ref.startsWith("#/")) {
    let cur: any = doc;
    for (const part of node.$ref.slice(2).split("/")) {
      cur = cur?.[part];
      if (cur === undefined) return node;
    }
    return cur;
  }
  return node;
}

function loadSystems(): System[] {
  const files = readdirSync(OPENAPI_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();
  const systems: System[] = [];
  for (const file of files) {
    let doc: any;
    try {
      doc = parse(readFileSync(join(OPENAPI_DIR, file), "utf8"));
    } catch {
      continue;
    }
    if (!doc?.paths) continue;
    const ops: Operation[] = [];
    for (const [path, item] of Object.entries<any>(doc.paths)) {
      for (const method of METHODS) {
        const op = item?.[method];
        if (!op) continue;
        ops.push({
          method: method.toUpperCase(),
          path,
          summary: op.summary ?? "",
          description: op.description ?? "",
          tags: op.tags ?? [],
          parameters: op.parameters ?? [],
          requestBody: op.requestBody,
          responses: op.responses ?? {},
        });
      }
    }
    systems.push({
      title: doc.info?.title ?? file,
      file,
      server: doc.servers?.[0]?.url ?? "",
      doc,
      ops,
    });
  }
  return systems;
}

function buildDetail(system: System, op: Operation): string {
  const lines: string[] = [];
  lines.push(`${op.method}  ${system.server}${op.path}`);
  if (op.summary) lines.push(op.summary);
  if (op.tags.length) lines.push(`标签: ${op.tags.join(", ")}`);
  lines.push("");

  if (op.description) {
    lines.push("说明:");
    for (const line of op.description.trim().split("\n")) lines.push("  " + line);
    lines.push("");
  }

  const params = op.parameters.map((p) => resolveRef(system.doc, p)).filter(Boolean);
  if (params.length) {
    lines.push("参数:");
    for (const p of params) {
      const flag = p.required ? " *" : "";
      lines.push(`  - ${p.name} (${p.in})${flag}${p.description ? ": " + String(p.description).split("\n")[0] : ""}`);
    }
    lines.push("");
  }

  if (op.requestBody) {
    const rb = resolveRef(system.doc, op.requestBody);
    const ct = rb?.content ? Object.keys(rb.content)[0] : "";
    lines.push(`请求体${rb?.required ? " *" : ""}: ${ct}`);
    const media = rb?.content?.[ct];
    let example = media?.example;
    if (example === undefined && media?.examples) {
      const first: any = Object.values(media.examples)[0];
      example = first?.value;
    }
    if (example !== undefined) {
      const text = typeof example === "string" ? example : JSON.stringify(example, null, 2);
      for (const line of text.split("\n").slice(0, 16)) lines.push("  " + line);
    }
    lines.push("");
  }

  const codes = Object.keys(op.responses);
  if (codes.length) {
    lines.push("响应:");
    for (const code of codes) {
      const r = resolveRef(system.doc, op.responses[code]);
      lines.push(`  ${code}: ${r?.description ? String(r.description).split("\n")[0] : ""}`);
    }
  }
  return lines.join("\n");
}

const systems = loadSystems();

if (process.argv.includes("--list")) {
  let total = 0;
  for (const s of systems) {
    console.log(`\n■ ${s.title}  (${s.file})  ${s.server}`);
    for (const o of s.ops) {
      console.log(`    ${o.method.padEnd(5)} ${o.path}${o.summary ? "  — " + o.summary : ""}`);
      total++;
    }
  }
  console.log(`\n共 ${systems.length} 个系统，${total} 个接口。`);
  process.exit(0);
}

if (!process.stdout.isTTY) {
  console.error("需要在交互式终端里运行。想看纯文本清单请加 --list：\n  bun run browse.ts --list");
  process.exit(1);
}

interface Entry {
  system: System;
  op: Operation;
}
const entries: Entry[] = [];
const options: { name: string; description: string; value: number }[] = [];
for (const system of systems) {
  for (const op of system.ops) {
    options.push({
      name: `${op.method.padEnd(5)} ${op.summary || op.path}`,
      description: `${system.title.split(" ")[0]} · ${op.path}`,
      value: entries.length,
    });
    entries.push({ system, op });
  }
}

const { createCliRenderer, BoxRenderable, TextRenderable, SelectRenderable } = await import("@opentui/core");

const renderer = await createCliRenderer({ exitOnCtrlC: true, targetFps: 30 });

const rootCol = new BoxRenderable(renderer, {
  flexDirection: "column",
  width: "100%",
  height: "100%",
});
renderer.root.add(rootCol);

const header = new BoxRenderable(renderer, {
  height: 3,
  border: true,
  borderStyle: "single",
  borderColor: ACCENT,
  title: "nju-openapi",
});
header.add(
  new TextRenderable(renderer, {
    content: `↑↓ / j k 选择 · q 退出 · 共 ${entries.length} 个接口 / ${systems.length} 个系统`,
  }),
);
rootCol.add(header);

const body = new BoxRenderable(renderer, {
  flexGrow: 1,
  flexDirection: "row",
  width: "100%",
});
rootCol.add(body);

const leftBox = new BoxRenderable(renderer, {
  width: "42%",
  height: "100%",
  border: true,
  borderStyle: "single",
  borderColor: ACCENT,
  title: "接口",
});
const select = new SelectRenderable(renderer, {
  width: "100%",
  height: "100%",
  options,
  showDescription: true,
  showScrollIndicator: true,
  wrapSelection: true,
  selectedBackgroundColor: ACCENT,
  selectedTextColor: "#FFFFFF",
});
leftBox.add(select);
body.add(leftBox);

const rightBox = new BoxRenderable(renderer, {
  flexGrow: 1,
  height: "100%",
  border: true,
  borderStyle: "single",
  borderColor: ACCENT,
  title: "详情",
});
const detail = new TextRenderable(renderer, { content: "" });
rightBox.add(detail);
body.add(rightBox);

function refresh(): void {
  const entry = entries[select.getSelectedIndex()];
  if (!entry) return;
  detail.content = buildDetail(entry.system, entry.op);
  rightBox.title = `详情 · ${entry.system.title}`;
}
refresh();

renderer.keyInput.on("keypress", (key: any) => {
  if (key.name === "q" || (key.ctrl && key.name === "c")) {
    renderer.destroy?.();
    process.exit(0);
  }
  select.handleKeyPress(key);
  refresh();
});

renderer.start?.();
