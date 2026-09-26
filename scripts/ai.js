require("dotenv").config({ quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../db");
const store = require("../db/ai");
const { parseQuery } = require("../ai/content");
const { SEED_TOPICS, config } = require("../ai/config");

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "migrate") {
    await store.transaction(client => client.query(fs.readFileSync(path.join(__dirname, "../db/sql/ai.sql"), "utf8")));
    console.log("AI schema ready; public roles have no access.");
  } else if (command === "status") {
    console.log(JSON.stringify({ enabled: config().enabled, ...await store.status() }, null, 2));
  } else if (command === "review") {
    const request = parseQuery(args.join(" "));
    if (!request) throw new Error("Provide a learning query");
    const selected = await store.selection(request.key, true);
    console.log(JSON.stringify(selected?.payload || { status: "not_prepared" }, null, 2));
  } else if (command === "prewarm") {
    const topics = args.length ? args : SEED_TOPICS.slice(0, 5);
    if (topics.length > 20) throw new Error("At most 20 topics per prewarm");
    for (const topic of topics) {
      const request = parseQuery(topic);
      if (!request) throw new Error("Invalid topic");
      const state = await store.enqueue(request, null, { refresh: true, publishPrism: true });
      console.log(`${request.topic}: ${state}`);
    }
  } else if (command === "work") {
    const count = Number(args[0] || 2);
    if (!Number.isInteger(count) || count < 1 || count > 4) throw new Error("Choose 1-4 jobs");
    console.log(JSON.stringify(await require("../ai/worker").work(count)));
  } else if (command === "refresh") {
    const rows = (await pool.query("SELECT j.request FROM ai_selections s JOIN ai_jobs j USING(key) WHERE s.expires_at<now() AND s.publish_prism=true ORDER BY s.expires_at LIMIT 3")).rows;
    for (const { request } of rows) await store.enqueue(request, null, { refresh: true, publishPrism: true });
    console.log(`Queued up to ${rows.length} shared refreshes.`);
  } else {
    throw new Error("Usage: npm run ai -- migrate|status|review query|prewarm [topics...]|work [1-4]|refresh");
  }
}

main().catch(error => {
  // Connection/provider errors can contain sensitive details. Keep logs safe.
  console.error(`AI command failed (${error.code || "configuration_or_processing"}). Check the setup guide and provider dashboards.`);
  process.exitCode = 1;
}).finally(() => pool.end());
