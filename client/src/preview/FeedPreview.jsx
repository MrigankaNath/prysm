import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { CategoryRail, CategorySection } from "../pages/ExploreTopic";
import DiscoveryFeed from "../components/DiscoveryFeed";

// Local visual fixtures, never presented as account recommendations.
const samples = [
  { title: "Bad Dreams: A Horror Podcast", snippet: "A late-night detour into unsettling stories. A different kind of discovery for your headphones.", topic: "Bad dreams", category: "podcasts", source: "podcasts", signal: 20, author: "Bad Dreams", url: "https://podcasts.apple.com/us/genre/podcasts-fiction/id1483" },
  { title: "Thinking in React", snippet: "Break a user interface into components, describe its visual states, and connect them so data flows through your app.", topic: "React", category: "articles", url: "https://react.dev/learn/thinking-in-react" },
  { title: "The beauty of a single equation", snippet: "Follow the intuition behind mathematical ideas, one visual explanation at a time.", topic: "Mathematics", category: "videos", source: "youtube", url: "https://www.youtube.com/@3blue1brown" },
  { title: "LHCb discovers matter–antimatter asymmetry", snippet: "Why is there something rather than nothing? Start with the particles that refuse to behave like their mirror images.", topic: "Quarks", category: "discussions", url: "https://home.cern/science/physics/matter-antimatter-asymmetry" },
  {"forks": 51331, "language": "JavaScript", "signal": 250049, "snippet": "The library for web and native user interfaces.", "thumbnail": "https://avatars.githubusercontent.com/u/102812?v=4", "title": "react/react", "updated_at": "2026-09-11T23:35:47Z", "topic": "React", "category": "code", "source": "github", "url": "https://github.com/facebook/react"},
  { title: "A Brief History of Time", snippet: "From the Big Bang to black holes: Stephen Hawking’s introduction to the questions that changed our picture of the universe.", thumbnail: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg?default=false", topic: "Stephen Hawking", category: "books", author: "Stephen Hawking", url: "https://openlibrary.org/isbn/9780553380163" },
  { title: "Stanford Encyclopedia of Philosophy", snippet: "An entry point into the people, arguments, and everyday questions behind the philosophy.", topic: "Stoicism", category: "websites", url: "https://plato.stanford.edu/entries/stoicism/" },
  { title: "Attention Is All You Need", snippet: "The original Transformer paper. Go to the source of the architecture behind modern language models.", topic: "Machine learning", category: "papers", source: "arxiv", author: "Ashish Vaswani et al.", peer_reviewed: false, url: "https://arxiv.org/abs/1706.03762", published_at: "2017-06-12" },
  { title: "What makes an explanation a good one?", snippet: "A question can open a subject up in a way that a definition cannot. Explore the reasoning behind an answer.", topic: "Philosophy", tags: ["philosophy", "explanation"], category: "qa", url: "https://philosophy.stackexchange.com/" },
  { title: "Learning to notice what you read", snippet: "Reading is more than collecting ideas. It is making room for an unfamiliar point of view.", topic: "Reading", category: "essays", url: "https://aeon.co/essays" },
];
export default function FeedPreview() {
  const [active, setActive] = useState("all");
  const categories = new URLSearchParams(window.location.search).get("layout") === "categories";
  const sections = [...new Set(samples.map(item => item.category))].map(key => ({ key, items: samples.filter(item => item.category === key) }));
  const compact = new URLSearchParams(window.location.search).get("layout") === "compact";
  const [doneUrls, setDoneUrls] = useState(() => new Set());
  const toggleRead = item => setDoneUrls(previous => { const next = new Set(previous); if (next.has(item.url)) next.delete(item.url); else next.add(item.url); return next; });
  return <BrowserRouter><main className="page page-wide feed discovery-preview">
    <div className="discovery-preview-note"><strong>LOCAL EXPERIMENT · FEED / 01</strong><span>Sample content · bookmarks stay in this preview · nothing published</span></div>
    <h1 className="feed-title">Follow your curiosity.</h1>
    <p className="feed-sub">A good rabbit hole starts with something worth opening.</p>
    <section className="feed-section"><h3 className="feed-section-head">Because you searched</h3>
      {categories ? <><CategoryRail sections={sections} active={active} onSelect={setActive} />{sections.filter(section => active === "all" || section.key === active).map(({key, items}, index) => <CategorySection preview key={key} category={key} items={items} topic={items[0].topic} index={index} />)}</> : <DiscoveryFeed items={samples.filter(item => item.category !== "podcasts")} preview compact={compact} doneUrls={doneUrls} onToggleDone={compact ? toggleRead : undefined} />}
    </section>
  </main></BrowserRouter>;
}
