import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { strict as assert } from "node:assert";

const socket = createServer();
await new Promise((resolve, reject) => socket.listen(0, "127.0.0.1", resolve).on("error", reject));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "-H", "127.0.0.1"], { stdio: "inherit", env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP, NODE_ENV: "production" } });
const url = `http://127.0.0.1:${port}`;
try {
  let response;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Server exited before becoming ready");
    try { response = await fetch(`${url}/api/health`); break; } catch { await new Promise((resolve) => setTimeout(resolve, 500)); }
  }
  assert.ok(response, "Server did not become ready");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  const page = await fetch(url);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /<html[\s>]/i);
  assert.match(html, /РЕШИСЬ/);
  assert.match(html, /Прогноз спроса/);
  assert.match(html, /Расчёт подключается на следующем этапе/);
  assert.match(html, /aria-pressed=/);
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled/);
  const lead = await fetch(`${url}/api/lead`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  assert.equal(lead.status, 503);
  console.log("Smoke test passed: forecast homepage, health, disabled lead endpoint");
} finally {
  server.kill();
}
