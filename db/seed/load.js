/* Load the curated Prisms into the database.
 *
 *   node db/seed/verify.js && node db/seed/load.js
 *
 * Matched on `topic`, so re-running updates a Prism in place rather than
 * creating a second copy — the ten seeded Prisms keep their ids, and anything
 * already bookmarked against a content item keeps working.
 *
 * Items are addressed by URL for the same reason: a resource that appears in
 * two Prisms is one row, and re-running does not orphan the old one.
 */

const pool = require("../index");
const { PRISMS } = require("./prisms.data");

const SOURCE = "curated";

async function loadPrism(client, prism) {
  const found = await client.query("SELECT id FROM bundles WHERE topic = $1", [
    prism.topic,
  ]);

  const bundleId = found.rows.length
    ? (
        await client.query(
          "UPDATE bundles SET title = $2, description = $3 WHERE id = $1 RETURNING id",
          [found.rows[0].id, prism.title, `[curated] ${prism.description}`],
        )
      ).rows[0].id
    : (
        await client.query(
          "INSERT INTO bundles (title, topic, description) VALUES ($1, $2, $3) RETURNING id",
          [prism.title, prism.topic, `[curated] ${prism.description}`],
        )
      ).rows[0].id;

  /* The membership is rebuilt, not merged — position and depth are the whole
     point of a Prism, and a partial update leaves an order nobody chose. The
     content_items rows themselves are left alone. */
  await client.query("DELETE FROM bundle_items WHERE bundle_id = $1", [bundleId]);

  let position = 0;
  for (const item of prism.items) {
    position += 1;

    const existing = await client.query(
      "SELECT id FROM content_items WHERE url = $1",
      [item.u],
    );

    const itemId = existing.rows.length
      ? (
          await client.query(
            `UPDATE content_items
                SET title = $2, type = $3, topic = $4, depth_level = $5,
                    description = $6, source_name = $7
              WHERE id = $1 RETURNING id`,
            [existing.rows[0].id, item.t, item.k, prism.topic, item.d, item.s, SOURCE],
          )
        ).rows[0].id
      : (
          await client.query(
            `INSERT INTO content_items
               (title, url, type, topic, depth_level, description, source_name, date_added)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE) RETURNING id`,
            [item.t, item.u, item.k, prism.topic, item.d, item.s, SOURCE],
          )
        ).rows[0].id;

    await client.query(
      "INSERT INTO bundle_items (bundle_id, content_item_id, position) VALUES ($1, $2, $3)",
      [bundleId, itemId, position],
    );
  }

  return { id: bundleId, n: position, created: !found.rows.length };
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const prism of PRISMS) {
      const { id, n, created } = await loadPrism(client, prism);
      console.log(
        `  ${created ? "new " : "upd "} #${String(id).padEnd(3)} ${String(n).padStart(2)} items  ${prism.title}`,
      );
    }
    await client.query("COMMIT");
    console.log(`\n${PRISMS.length} prisms loaded`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("rolled back:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
