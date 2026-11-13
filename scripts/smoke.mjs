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
  assert.match(html, /Нет расчёта/);
  assert.doesNotMatch(html, /Расчёт подключается на следующем этапе/);
  assert.match(html, /aria-pressed=/);
  assert.match(html, /<button[^>]*class="calculate"[^>]*type="submit"/);
  assert.doesNotMatch(html, /<button[^>]*class="calculate"[^>]*disabled/);

  const routesResponse = await fetch(`${url}/api/routes`);
  assert.equal(routesResponse.status, 200);
  const metadata = await routesResponse.json();
  assert.equal(metadata.routes.length, 5);
  assert.deepEqual(metadata.routes.map((route) => route.route).sort(), ['MOW-AER', 'MOW-KGD', 'MOW-LED', 'MOW-MRV', 'MOW-OVB']);
  assert.equal(metadata.routes.reduce((sum, route) => sum + route.dates.length, 0), 155);
  for (const route of metadata.routes) {
    assert.equal(route.dates.length, 31);
    assert.equal(route.dates[0], '2026-06-01');
    assert.equal(route.dates.at(-1), '2026-07-01');
  }
  const post = (body) => fetch(`${url}/api/forecast`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  const request = { origin: 'MOW', destination: 'AER', date: '2026-06-01', price: 9000 };
  const forecastResponse = await post(JSON.stringify(request));
  assert.equal(forecastResponse.status, 200);
  const forecast = await forecastResponse.json();
  assert.equal(forecast.route, 'MOW-AER');
  assert.equal(forecast.date, request.date);
  assert.equal(forecast.price, request.price);
  assert.equal(forecast.dataVersion, metadata.dataVersion);
  assert.equal(forecast.seats, 900);
  assert.equal(forecast.demand, 845);
  assert.equal(forecast.sales, 845);
  assert.equal(forecast.freeSeats, 55);
  assert.deepEqual(forecast.quantiles.map(({ quantile, demand }) => [quantile, demand]), [[0.1, 759], [0.2, 789], [0.3, 810], [0.4, 828], [0.5, 845], [0.6, 861], [0.7, 876], [0.8, 898], [0.9, 928]]);
  for (const [body, status, code] of [
    ['{', 400, 'INVALID_JSON'],
    [JSON.stringify({ ...request, price: -1 }), 422, 'INVALID_FIELDS'],
    [JSON.stringify({ ...request, date: '2026-07-02' }), 404, 'FLIGHT_NOT_FOUND'],
    [' '.repeat(4097), 413, 'BODY_TOO_LARGE'],
  ]) {
    const result = await post(body);
    assert.equal(result.status, status);
    assert.equal((await result.json()).error.code, code);
  }
  const lead = await fetch(`${url}/api/lead`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  assert.equal(lead.status, 503);
  console.log("Smoke test passed: homepage, health, route coverage, forecast and error paths, disabled lead");
} finally {
  server.kill();
}
