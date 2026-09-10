/* Scratch preview — the real pages sit behind the auth gate. Delete before merging. */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { PrismGradientDefs } from "./components/Icons";
import { PrismBody } from "./pages/PrismDetail";
import Spectrum from "./pages/Spectrum";
import SpectrumDomain from "./pages/SpectrumDomain";
import PathStage from "./components/PathStage";
import MediaCard from "./components/MediaCard";
import FeedCard from "./components/FeedCard";
import { buildPath } from "./lib/path";

const react = {
  "id": 3,
  "title": "Deep Learning, seriously",
  "topic": "deep learning",
  "description": "[curated] Backpropagation, architectures and transformers — built up from an actual derivative rather than from a framework call.",
  "items": [
    {
      "id": 141,
      "title": "3Blue1Brown: Neural Networks",
      "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi",
      "description": "The visual explanation of what a network is and what gradient descent does to it.",
      "type": "video",
      "depth_level": "beginner"
    },
    {
      "id": 142,
      "title": "But what is a neural network?",
      "url": "https://www.3blue1brown.com/topics/neural-networks",
      "description": "The written companion, with the interactive figures the videos are built from.",
      "type": "website",
      "depth_level": "beginner"
    },
    {
      "id": 143,
      "title": "Neural Networks and Deep Learning",
      "url": "http://neuralnetworksanddeeplearning.com/",
      "description": "Michael Nielsen's free book. Builds a working digit classifier from nothing but numpy.",
      "type": "book",
      "depth_level": "beginner"
    },
    {
      "id": 144,
      "title": "Practical Deep Learning for Coders",
      "url": "https://course.fast.ai/",
      "description": "fast.ai's course. Working models in lesson one, theory once you care why.",
      "type": "course",
      "depth_level": "beginner"
    },
    {
      "id": 145,
      "title": "TensorFlow Playground",
      "url": "https://playground.tensorflow.org/",
      "description": "Add layers and watch the decision boundary move. Ten minutes here beats an hour of reading.",
      "type": "website",
      "depth_level": "beginner"
    },
    {
      "id": 146,
      "title": "PyTorch: Learn the Basics",
      "url": "https://pytorch.org/tutorials/beginner/basics/intro.html",
      "description": "Tensors to a training loop in eight short pages, from the framework's own docs.",
      "type": "course",
      "depth_level": "beginner"
    },
    {
      "id": 147,
      "title": "A Recipe for Training Neural Networks",
      "url": "https://karpathy.github.io/2019/04/25/recipe/",
      "description": "Karpathy on why your network silently fails, and the order to debug it in.",
      "type": "article",
      "depth_level": "beginner"
    },
    {
      "id": 6,
      "title": "Dive into Deep Learning",
      "url": "https://d2l.ai/",
      "description": "A whole textbook where every equation has runnable code beside it. Free and enormous.",
      "type": "book",
      "depth_level": "intermediate"
    },
    {
      "id": 148,
      "title": "CS231n: Convolutional Neural Networks",
      "url": "https://cs231n.github.io/",
      "description": "Stanford's vision course notes. Still the clearest explanation of convolutions written.",
      "type": "course",
      "depth_level": "intermediate"
    },
    {
      "id": 149,
      "title": "The Illustrated Transformer",
      "url": "https://jalammar.github.io/illustrated-transformer/",
      "description": "Attention drawn box by box. How most people finally understand the architecture.",
      "type": "article",
      "depth_level": "intermediate"
    },
    {
      "id": 150,
      "title": "Understanding LSTM Networks",
      "url": "https://colah.github.io/posts/2015-08-Understanding-LSTMs/",
      "description": "Chris Olah's diagrams. Pre-transformer, and still the best writing on sequence models.",
      "type": "article",
      "depth_level": "intermediate"
    },
    {
      "id": 151,
      "title": "Let's build GPT: from scratch, in code",
      "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY",
      "description": "Karpathy building a working transformer in two hours, typing every line.",
      "type": "video",
      "depth_level": "intermediate"
    },
    {
      "id": 152,
      "title": "The Annotated Transformer",
      "url": "https://nlp.seas.harvard.edu/annotated-transformer/",
      "description": "Attention Is All You Need, reprinted with a working implementation between the paragraphs.",
      "type": "article",
      "depth_level": "intermediate"
    },
    {
      "id": 153,
      "title": "CS224n: NLP with Deep Learning",
      "url": "https://web.stanford.edu/class/cs224n/",
      "description": "Stanford's language course, slides and notes public. The path from word vectors to LLMs.",
      "type": "course",
      "depth_level": "intermediate"
    },
    {
      "id": 9,
      "title": "Deep Learning",
      "url": "https://www.deeplearningbook.org/",
      "description": "Goodfellow, Bengio and Courville, free online. The field's standard reference text.",
      "type": "book",
      "depth_level": "advanced"
    },
    {
      "id": 8,
      "title": "Attention Is All You Need",
      "url": "https://arxiv.org/abs/1706.03762",
      "description": "The transformer paper. Eight pages that redirected the entire field.",
      "type": "paper",
      "depth_level": "advanced"
    },
    {
      "id": 154,
      "title": "Deep Residual Learning for Image Recognition",
      "url": "https://arxiv.org/abs/1512.03385",
      "description": "ResNet. Why networks can be hundreds of layers deep and still train.",
      "type": "paper",
      "depth_level": "advanced"
    },
    {
      "id": 155,
      "title": "Adam: A Method for Stochastic Optimization",
      "url": "https://arxiv.org/abs/1412.6980",
      "description": "The optimiser almost everything is trained with, in the authors' own words.",
      "type": "paper",
      "depth_level": "advanced"
    },
    {
      "id": 156,
      "title": "Distill: Feature Visualization",
      "url": "https://distill.pub/2017/feature-visualization/",
      "description": "What individual neurons actually respond to, rendered rather than asserted.",
      "type": "article",
      "depth_level": "advanced"
    },
    {
      "id": 157,
      "title": "The Transformer Circuits Thread",
      "url": "https://transformer-circuits.pub/",
      "description": "Reverse-engineering what a transformer has learned. The frontier of interpretability.",
      "type": "website",
      "depth_level": "advanced"
    },
    {
      "id": 158,
      "title": "nanoGPT",
      "url": "https://github.com/karpathy/nanoGPT",
      "description": "A GPT that trains on one GPU, in about 300 readable lines. The best code to study.",
      "type": "code",
      "depth_level": "advanced"
    }
  ]
};

/* The smallest real Prism, because that is where a layout falls over. */
const rust = {
  id: 2,
  topic: "learning rust",
  title: "Learning Rust",
  description: "[curated] Two stops, because the book is most of the answer.",
  items: [
    { id: 5, title: "The Rust Programming Language", url: "https://doc.rust-lang.org/book/", type: "book", depth_level: "beginner", description: "The book. Free, complete, and the reason Rust's learning curve is survivable." },
    { id: 6, title: "Rustonomicon", url: "https://doc.rust-lang.org/nomicon/", type: "book", depth_level: "advanced", description: "Unsafe Rust, and the invariants you are promising to uphold when you use it." },
  ],
};

/* The explore roadmap, built from the same buildPath the real page uses so the
   preview cannot drift from it. */
const CATEGORIES = {
  videos: [
    { title: "The Map of Quantum Computing", url: "https://youtube.com/watch?v=a", source: "youtube", author: "Domain of Science", signal: 2_400_000, snippet: "Every branch of the field on one map." },
    { title: "Quantum Computers, Explained", url: "https://youtube.com/watch?v=b", source: "youtube", author: "Veritasium", signal: 1_100_000, snippet: "Where the speedup actually comes from." },
  ],
  websites: [
    { title: "quantum.country", url: "https://quantum.country/qcvc", thumbnail: "https://www.google.com/s2/favicons?domain=quantum.country&sz=128", snippet: "An essay with spaced repetition built in." },
    { title: "Quantum Algorithm Zoo", url: "https://quantumalgorithmzoo.org/", thumbnail: "https://www.google.com/s2/favicons?domain=quantumalgorithmzoo.org&sz=128", snippet: "Every known algorithm and its speedup." },
  ],
  articles: [
    { title: "The Limits of Quantum Computers", url: "https://scottaaronson.com/l", depth_level: "beginner", snippet: "What these machines cannot do." },
    { title: "Grover's algorithm, carefully", url: "https://en.wikipedia.org/wiki/Grover", depth_level: "intermediate", snippet: "Why quadratic is smaller than it sounds." },
    { title: "Surface codes", url: "https://arxiv.org/abs/1208.0928", depth_level: "advanced", snippet: "The code the roadmaps are betting on." },
  ],
  discussions: [
    { title: "Google claims quantum supremacy", url: "https://www.nature.com/articles/x", source: "hackernews", signal: 1582, snippet: "1582 points, 640 comments" },
  ],
  papers: [
    { title: "Polynomial-Time Algorithms for Prime Factorization", url: "https://arxiv.org/abs/quant-ph/9508027", source: "arxiv", snippet: "Shor, 1995." },
    { title: "Quantum Computing in the NISQ era", url: "https://arxiv.org/abs/1801.00862", peer_reviewed: true, venue: "Quantum", signal: 4200, snippet: "The paper that named the era." },
  ],
};

const PATH = buildPath(CATEGORIES, ["videos", "websites", "discussions", "papers"]);

function PathPreview() {
  const [open, setOpen] = useState(null);
  const [done, setDone] = useState([]);

  return (
    <div className="page page-wide">
      <h1 className="prism-title" style={{ marginBottom: 28 }}>Explore path</h1>
      <div className="path">
        {PATH.map((stage) => (
          <PathStage
            key={stage.id}
            stage={stage}
            topic="quantum computing"
            doneUrls={done}
            litUrl={PATH[0].items[0].url}
            openUrl={open}
            onOpen={setOpen}
            onToggle={(url) =>
              setDone((d) => (d.includes(url) ? d.filter((u) => u !== url) : [...d, url]))
            }
            expanded
            onExpand={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

/* Deliberately uneven copy: a one-line title beside a three-line one is what
   made the lane ragged, so that is what the preview has to show. */
const MEDIA = [
  { title: "GPT-6 Astra First Experience", url: "https://youtube.com/watch?v=1", snippet: "ChatGPT 6 Astra is out and it's INSANE. Support our community with merch :) and a much longer trailing line to force the clamp.", thumbnail: null, signal: 120000, duration: 640 },
  { title: "Introducing GPT-6 Astra for developers", url: "https://youtube.com/watch?v=2", snippet: "Meet GPT-6 Astra, our latest frontier model.", thumbnail: null, signal: 400000, duration: 320 },
  { title: "Short", url: "https://youtube.com/watch?v=3", snippet: "One line.", thumbnail: null, signal: 900, duration: 200 },
];

function MediaPreview() {
  return (
    <div className="page page-wide">
      <h1 className="prism-title" style={{ marginBottom: 24 }}>Videos lane</h1>
      <div className="media-grid">
        {MEDIA.map((item, i) => (
          <MediaCard key={i} item={item} topic="gpt astra" category="videos" />
        ))}
      </div>
    </div>
  );
}

const FEED = [
  { c:"code", t:"Next Js", i:{ title:"vercel/next.js", url:"https://github.com/vercel/next.js", snippet:"The React Framework", thumbnail:"https://avatars.githubusercontent.com/u/14985020?v=4", published_at:"2026-09-01", signal:128000 }},
  { c:"podcasts", t:"Stoicism", i:{ title:"Stoicism Meditation", url:"https://podcasts.apple.com/x", snippet:"Stoicism Meditation · Education · 720 episodes", author:"Stoicism Meditation", published_at:"2025-12-09", signal:720 }},
  { c:"discussions", t:"Sleep", i:{ title:"American Academy of Sleep Medicine calls for elimination of daylight saving time", url:"https://aasm.org/x", snippet:"1600 points, 486 comments", published_at:"2020-08-29", signal:1600 }},
  { c:"websites", t:"Sleep", i:{ title:"nytimes.com", url:"https://nytimes.com/x", snippet:null, thumbnail:"https://www.google.com/s2/favicons?domain=nytimes.com&sz=128" }},
];

function FeedPreview() {
  return (
    <div className="page page-wide feed">
      <h1 className="prism-title" style={{ marginBottom: 24 }}>Because you searched</h1>
      <section className="feed-section"><div className="fcard-grid">
        {FEED.map((x,i)=><FeedCard key={i} item={x.i} topic={x.t} category={x.c} />)}
      </div></section>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MemoryRouter initialEntries={["/spectrum/physics"]}>
      <PrismGradientDefs />
      {location.hash === "#spectrum" ? <Spectrum /> : null}
      {/* Needs a real route, since the page reads its id from useParams. */}
      {location.hash === "#domain" ? (
        <Routes>
          <Route path="/spectrum/:id" element={<SpectrumDomain />} />
        </Routes>
      ) : null}
      {location.hash === "#path" ? <PathPreview /> : null}
      {location.hash === "#media" ? <MediaPreview /> : null}
      {location.hash === "#feed" ? <FeedPreview /> : null}
      <div className="page page-wide" hidden={location.hash !== ""}>
        <PrismBody bundle={react} />
        <hr style={{ margin: "56px 0", border: 0, borderTop: "2px solid #1c1c20" }} />
        <PrismBody bundle={rust} />
      </div>
    </MemoryRouter>
  </StrictMode>,
);
