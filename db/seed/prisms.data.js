/* The curated Prisms.
 *
 * The one place in Prysm where a person, not a ranking, decided the order.
 * Everything here is free to read without an account or a paywall — a paid
 * course may well be better, but a path that stops being followable three
 * stops in is not a path.
 *
 * Seven stops per depth level. Where a level genuinely has fewer than seven
 * things worth someone's time it takes fewer: the app's own rule is that no
 * result is a fact and three wrong ones are a lie, and that applies hardest
 * to the one surface claiming to be curated.
 *
 * Split by cluster only so each file stays a readable length. Every URL is
 * checked live by db/seed/verify.js before this is loaded.
 */

const { WEB } = require("./prisms/web");
const { AI } = require("./prisms/ai");
const { CS } = require("./prisms/cs");
const { MIXED } = require("./prisms/mixed");
const { CORE } = require("./prisms/core");

const PRISMS = [...WEB, ...AI, ...CS, ...MIXED, ...CORE];

module.exports = { PRISMS };
