/* Scratch preview — the real pages sit behind the auth gate. Delete before merging. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "./index.css";
import { PrismGradientDefs } from "./components/Icons";
import { PrismBody } from "./pages/PrismDetail";

const react = {
  id: 1,
  topic: "react hooks",
  title: "React Hooks, properly",
  description:
    "[curated] From your first useState to knowing when memoisation is a false economy.",
  items: [
    { id: 1, title: "Learn React", url: "https://react.dev/learn", type: "course", depth_level: "beginner", description: "The official tutorial. Start here — it is genuinely the best React introduction that exists." },
    { id: 2, title: "useState — API reference", url: "https://react.dev/reference/react/useState", type: "website", depth_level: "beginner", description: "The one hook everything else builds on, documented properly." },
    { id: 3, title: "A Complete Guide to useEffect", url: "https://overreacted.io/a-complete-guide-to-useeffect/", type: "article", depth_level: "intermediate", description: "Dan Abramov on why useEffect confuses people, and the mental model that fixes it." },
    { id: 4, title: "useMemo and useCallback", url: "https://kentcdodds.com/blog/usememo-and-usecallback", type: "article", depth_level: "advanced", description: "When memoisation helps, and when it quietly costs you more than it saves." },
  ],
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
      <div className="page page-wide">
        <PrismBody bundle={react} />
        <hr style={{ margin: "56px 0", border: 0, borderTop: "2px solid #1c1c20" }} />
        <PrismBody bundle={rust} />
      </div>
    </MemoryRouter>
  </StrictMode>,
);
