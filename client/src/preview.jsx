/* Scratch preview — the real pages sit behind the auth gate. Delete before merging. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "./index.css";
import { PrismGradientDefs } from "./components/Icons";
import { PrismBody } from "./pages/PrismDetail";
import Spectrum from "./pages/Spectrum";

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

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MemoryRouter>
      <PrismGradientDefs />
      {location.hash === "#spectrum" ? <Spectrum /> : null}
      <div className="page page-wide" hidden={location.hash === "#spectrum"}>
        <PrismBody bundle={react} />
        <hr style={{ margin: "56px 0", border: 0, borderTop: "2px solid #1c1c20" }} />
        <PrismBody bundle={rust} />
      </div>
    </MemoryRouter>
  </StrictMode>,
);
