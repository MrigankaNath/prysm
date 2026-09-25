import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { CategoryRail, CategorySection } from "../pages/ExploreTopic";
import DiscoveryFeed from "../components/DiscoveryFeed";

// Local visual fixtures, never presented as account recommendations.
const samples = [
  { title: "Bad Dreams: A Horror Podcast", snippet: "A late-night detour into unsettling stories. A different kind of discovery for your headphones.", topic: "Bad dreams", category: "podcasts", source: "podcasts", signal: 20, author: "Bad Dreams", url: "https://podcasts.apple.com/us/genre/podcasts-fiction/id1483" },
  { title: "Thinking in React", snippet: "Break a user interface into components, describe its visual states, and connect them so data flows through your app.", topic: "React", category: "articles", url: "https://react.dev/learn/thinking-in-react" },
  { title: "System Design Tutorial - GeeksforGeeks", snippet: "## Basics Core concepts to get started with system design. System Design Introduction - HLD & LLD.", topic: "systems design", category: "articles", url: "https://www.geeksforgeeks.org/system-design/system-design-tutorial/" },
  { title: "3Blue1Brown: Neural Networks", topic: "Neural networks", category: "articles", source: "tavily", url: "https://www.youtube.com/watch?v=aircAruvnKk" },
  { title: "The beauty of a single equation", snippet: "Follow the intuition behind mathematical ideas, one visual explanation at a time.", topic: "Mathematics", category: "videos", source: "youtube", url: "https://www.youtube.com/@3blue1brown" },
  { title: "LHCb discovers matter–antimatter asymmetry", snippet: "Why is there something rather than nothing? Start with the particles that refuse to behave like their mirror images.", topic: "Quarks", category: "discussions", url: "https://home.cern/science/physics/matter-antimatter-asymmetry" },
  { title: "Gemini Robotics", snippet: "540 points, 220 comments", topic: "Robotics", category: "discussions", source: "hackernews", url: "https://deepmind.google/discover/gemini-robotics/" },
  {"forks": 51331, "language": "JavaScript", "signal": 250049, "snippet": "The library for web and native user interfaces.", "thumbnail": "https://avatars.githubusercontent.com/u/102812?v=4", "title": "react/react", "updated_at": "2026-09-11T23:35:47Z", "topic": "React", "category": "code", "source": "github", "url": "https://github.com/facebook/react"},
  {"forks": 7483, "language": "TypeScript", "signal": 80641, "snippet": "A high performance build tool designed for modern web projects.", "thumbnail": "https://avatars.githubusercontent.com/u/65625612?v=4", "title": "vitejs/vite", "updated_at": "2026-09-15T10:12:00Z", "topic": "Build tools", "category": "code", "source": "github", "url": "https://github.com/vitejs/vite"},
  {"forks": 14261, "language": "Rust", "signal": 106342, "snippet": "An extremely fast Python package and project manager, written in Rust.", "thumbnail": "https://avatars.githubusercontent.com/u/115962839?v=4", "title": "astral-sh/uv", "updated_at": "2026-09-14T18:04:00Z", "topic": "Python tooling", "category": "code", "source": "github", "url": "https://github.com/astral-sh/uv"},
  {"forks": 3912, "language": "Python", "signal": 62844, "snippet": "Build reliable data pipelines in Python with a clear, composable API.", "thumbnail": "https://avatars.githubusercontent.com/u/57251745?v=4", "title": "dagster-io/dagster", "updated_at": "2026-09-13T08:40:00Z", "topic": "Data engineering", "category": "code", "source": "github", "url": "https://github.com/dagster-io/dagster"},
  { title: "A Brief History of Time", snippet: "From the Big Bang to black holes: Stephen Hawking’s introduction to the questions that changed our picture of the universe.", thumbnail: "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg?default=false", topic: "Stephen Hawking", category: "books", author: "Stephen Hawking", url: "https://openlibrary.org/isbn/9780553380163" },
  { title: "Stanford Encyclopedia of Philosophy", snippet: "An entry point into the people, arguments, and everyday questions behind the philosophy.", topic: "Stoicism", category: "websites", url: "https://plato.stanford.edu/entries/stoicism/" },
  { title: "IEEE Robotics and Automation Society", topic: "Robotics", category: "websites", source: "wikipedia", url: "https://www.ieee-ras.org/" },
  { title: "Attention Is All You Need", snippet: "The original Transformer paper. Go to the source of the architecture behind modern language models.", topic: "Machine learning", category: "papers", source: "arxiv", author: "Ashish Vaswani et al.", peer_reviewed: false, url: "https://arxiv.org/abs/1706.03762", published_at: "2017-06-12" },
  { title: "What makes an explanation a good one?", snippet: "A question can open a subject up in a way that a definition cannot. Explore the reasoning behind an answer.", topic: "Philosophy", tags: ["philosophy", "explanation"], category: "qa", url: "https://philosophy.stackexchange.com/" },
  { title: "Learning to notice what you read", snippet: "Reading is more than collecting ideas. It is making room for an unfamiliar point of view.", topic: "Reading", category: "essays", url: "https://aeon.co/essays" },
];
export default function FeedPreview() {
  const [active, setActive] = useState("all");
  const params = new URLSearchParams(window.location.search);
  const categories = params.get("layout") === "categories";
  const codeOnly = params.get("format") === "code";
  const sections = [...new Set(samples.map(item => item.category))].map(key => ({ key, items: samples.filter(item => item.category === key) }));
  const compact = params.get("layout") === "compact";
  const previewItems = codeOnly ? samples.filter(item => item.category === "code") : samples;
  const [doneUrls, setDoneUrls] = useState(() => new Set());
  const toggleRead = item => setDoneUrls(previous => { const next = new Set(previous); if (next.has(item.url)) next.delete(item.url); else next.add(item.url); return next; });
  return <BrowserRouter><main className="page page-wide feed discovery-preview">
    <div className="discovery-preview-note"><strong>LOCAL EXPERIMENT · {codeOnly ? "CODE / REPOSITORIES" : "FEED / 01"}</strong><span>Sample content · bookmarks stay in this preview · nothing published</span></div>
    <h1 className="feed-title">{codeOnly ? "Built in the open." : "Follow your curiosity."}</h1>
    <p className="feed-sub">{codeOnly ? "Repositories worth opening, with the signals that matter." : "A good rabbit hole starts with something worth opening."}</p>
    <section className="feed-section"><h3 className="feed-section-head">{codeOnly ? "Code discoveries" : "Because you searched"}</h3>
      {categories ? <><CategoryRail sections={sections} active={active} onSelect={setActive} />{sections.filter(section => active === "all" || section.key === active).map(({key, items}, index) => <CategorySection preview key={key} category={key} items={items} topic={items[0].topic} index={index} />)}</> : <DiscoveryFeed items={previewItems} preview filters={!codeOnly} compact={compact} doneUrls={doneUrls} onToggleDone={compact ? toggleRead : undefined} />}
    </section>
  </main></BrowserRouter>;
}
