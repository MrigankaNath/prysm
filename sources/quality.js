/* What kind of site is this? — the question Tavily's score does not answer.
 *
 * Its relevance score says "this page is about your topic" and nothing more:
 * measured on "stoicism", `custommapposter.com` and `mercercountypva.com` both
 * outscored writing by people who actually study the subject, and on "sleep
 * deprivation" the advanced tier returned a Scribd upload and an Academia.edu
 * PDF dump. Relevance is a floor. This is the ordering.
 *
 * Two things it does, deliberately kept apart:
 *   - drops hosts that are never the article you wanted, whatever they score
 *   - ranks the rest by what they are, so a university page and an engineering
 *     blog lead, and a page that exists to sell something trails
 *
 * It ranks rather than filters below the drop list, because the alternative is
 * an allowlist of "good websites" — which is a curation problem this app is
 * not trying to solve and which would empty the lane on any topic the list
 * didn't anticipate.
 */

const { hostOf } = require("./http");

/* Never an article. Document dumps re-host other people's work behind a
   signup, and a storefront is a storefront whatever the page is titled. */
const DROP_HOSTS = [
  "scribd.com",
  "slideshare.net",
  "academia.edu",
  "coursehero.com",
  "studocu.com",
  "docsity.com",
  "quizlet.com",
  "chegg.com",
  // Open-submission content platforms — the farm shape, minus the pretence.
  "vocal.media",
  /* Retail. A product page ranks for a topic because the product is about the
     topic, which is not the same as the page being about it — observed on
     "stoicism", where Amazon's listing for a beginner's guide and two Udemy
     course pages took article slots from the Stanford Encyclopedia. */
  "amazon.com",
  "www.amazon.com",
  "ebay.com",
  "etsy.com",
  "udemy.com",
  "skillshare.com",
];

/* Matched against the host, not the URL: a path can legitimately contain
   "store" (a docs page about state stores), a hostname essentially cannot.
   Split in two because the words are not equally safe. "poster" and "bookshop"
   mean one thing wherever they appear — `custommapposter.com` and
   `midlandbookshop.com` both turned up on "stoicism" and neither is glued to a
   separator — while "store" and "buy" need one, or `restore` and `buyer`
   match. */
const DROP_ANYWHERE = /(bookshop|bookstore|poster|coupon|merch)/;
const DROP_BOUNDED = /(^|[.-])(shop|store|buy|deals?|printing)([.-]|$)/;

/* Academic and public-sector domains are the one class of host that is
   verifiable from the URL alone — you cannot register a .edu or a .gov to
   rank for a keyword. */
const INSTITUTIONAL = /\.(edu|gov|mil)(\.[a-z]{2})?$/;
const INSTITUTIONAL_ALSO = /(^|\.)(ac|edu|gov)\.[a-z]{2}$/;

/* Where the writing is. A company's engineering blog and a person's own site
   are the two things asked for here, and both announce themselves in the host
   or the first path segment far more reliably than in their content. */
const BLOG_HOST =
  /^(blog|blogs|engineering|eng|tech|research|labs|developer|devblog)\./;

/* `netflixtechblog.com`, `overreacted.io`'s peers — a company blog often lives
   on its own domain rather than a subdomain, and says so in the name. */
const BLOG_NAME = /(techblog|devblog|engineeringblog|blog)\.[a-z.]+$/;
const BLOG_PATH = /^\/(blog|blogs|posts?|writing|essays?|notes|articles?)(\/|$)/;

/* A personal site is the hardest of the three to detect and these are the
   only honest signals: TLDs that are bought by individuals far more often
   than by content operations. Weaker than the blog signals above, which is
   why it shares their rank rather than leading. */
const PERSONAL_TLD = /\.(dev|io|me|name|blog|page|xyz)$/;

const RANK = { institutional: 0, written: 1, ordinary: 2, drop: 3 };

function hostRank(url) {
  const host = hostOf(url);
  if (!host) return RANK.drop;

  if (
    DROP_HOSTS.includes(host) ||
    DROP_ANYWHERE.test(host) ||
    DROP_BOUNDED.test(host)
  ) {
    return RANK.drop;
  }

  if (INSTITUTIONAL.test(host) || INSTITUTIONAL_ALSO.test(host)) {
    return RANK.institutional;
  }

  let path = "/";
  try {
    path = new URL(url).pathname;
  } catch {
    // hostOf already parsed it; an unparseable URL can't reach here.
  }

  if (
    BLOG_HOST.test(host) ||
    BLOG_NAME.test(host) ||
    BLOG_PATH.test(path) ||
    PERSONAL_TLD.test(host)
  ) {
    return RANK.written;
  }

  return RANK.ordinary;
}

module.exports = { hostRank, RANK };
