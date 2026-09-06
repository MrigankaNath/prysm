/* The curated Prisms.
 *
 * The one place in Prysm where a person, not a ranking, decided the order.
 * Everything here is free to read without an account or a paywall — a paid
 * course may well be better, but a path that stops being followable three
 * stops in is not a path.
 *
 * Seven stops per depth level. Where a level genuinely has fewer than seven
 * things worth someone's time, it takes fewer: the app's own rule is that no
 * result is a fact and three wrong ones are a lie, and that applies hardest
 * to the surface claiming to be curated.
 *
 * Every URL is checked by db/seed/verify.js before this is loaded.
 */

const WEB = [
  {
    slug: "react-hooks",
    title: "React Hooks, properly",
    topic: "react hooks",
    description:
      "Components, state and effects as the current docs teach them — not the class-based React the internet still remembers.",
    items: [
      // beginner
      { t: "Learn React — the official tutorial", u: "https://react.dev/learn", k: "course", d: "beginner", s: "The rewritten docs. Interactive, opinionated, and the best React introduction that exists." },
      { t: "Thinking in React", u: "https://react.dev/learn/thinking-in-react", k: "article", d: "beginner", s: "How to go from a mockup to a component tree. The mental model everything else assumes." },
      { t: "State: a component's memory", u: "https://react.dev/learn/state-a-components-memory", k: "article", d: "beginner", s: "Why state exists, and why mutating a variable doesn't re-render anything." },
      { t: "Tutorial: Tic-Tac-Toe", u: "https://react.dev/learn/tutorial-tic-tac-toe", k: "course", d: "beginner", s: "Build something small end to end before you build something large badly." },
      { t: "Rendering Lists and keys", u: "https://react.dev/learn/rendering-lists", k: "article", d: "beginner", s: "The key prop, and the bugs you get for free when you use the array index." },
      { t: "Responding to Events", u: "https://react.dev/learn/responding-to-events", k: "article", d: "beginner", s: "Handlers, propagation, and why you pass the function rather than call it." },
      { t: "React Foundations", u: "https://nextjs.org/learn/react-foundations", k: "course", d: "beginner", s: "React explained from plain JavaScript upward — useful if the JSX still feels like magic." },
      // intermediate
      { t: "You Might Not Need an Effect", u: "https://react.dev/learn/you-might-not-need-an-effect", k: "article", d: "intermediate", s: "The single highest-value page in the docs. Most useEffect calls in most codebases should not exist." },
      { t: "A Complete Guide to useEffect", u: "https://overreacted.io/a-complete-guide-to-useeffect/", k: "article", d: "intermediate", s: "Dan Abramov on why effects confuse people, and the mental model that fixes it." },
      { t: "Synchronizing with Effects", u: "https://react.dev/learn/synchronizing-with-effects", k: "article", d: "intermediate", s: "Effects as synchronisation with an outside system, not as lifecycle hooks." },
      { t: "Reacting to Input with State", u: "https://react.dev/learn/reacting-to-input-with-state", k: "article", d: "intermediate", s: "Declarative UI as a state machine, which is what it actually is." },
      { t: "Scaling Up with Reducer and Context", u: "https://react.dev/learn/scaling-up-with-reducer-and-context", k: "article", d: "intermediate", s: "The state pattern that covers most apps before you reach for a library." },
      { t: "Writing Resilient Components", u: "https://overreacted.io/writing-resilient-components/", k: "article", d: "intermediate", s: "Four principles that stop components rotting as an app grows." },
      { t: "Reusing Logic with Custom Hooks", u: "https://react.dev/learn/reusing-logic-with-custom-hooks", k: "article", d: "intermediate", s: "When to extract a hook, and the difference between sharing logic and sharing state." },
      // advanced
      { t: "useMemo and useCallback", u: "https://kentcdodds.com/blog/usememo-and-usecallback", k: "article", d: "advanced", s: "When memoisation helps, and when it quietly costs you more than it saves." },
      { t: "React as a UI Runtime", u: "https://overreacted.io/react-as-a-ui-runtime/", k: "article", d: "advanced", s: "React described as a runtime rather than a library. The deepest single piece written about it." },
      { t: "Before You memo()", u: "https://overreacted.io/before-you-memo/", k: "article", d: "advanced", s: "Two composition tricks that beat memoisation, by moving state instead of caching renders." },
      { t: "The Two Reacts", u: "https://overreacted.io/the-two-reacts/", k: "article", d: "advanced", s: "Server and client as two halves of one model, from the person who built much of it." },
      { t: "React Server Components", u: "https://react.dev/reference/rsc/server-components", k: "article", d: "advanced", s: "The reference for the model that changed what a React component can be." },
      { t: "useSyncExternalStore", u: "https://react.dev/reference/react/useSyncExternalStore", k: "article", d: "advanced", s: "How to subscribe to a store without tearing during concurrent rendering." },
      { t: "React source, annotated", u: "https://github.com/facebook/react", k: "code", d: "advanced", s: "The repo. The reconciler in packages/react-reconciler is where the interesting part lives." },
    ],
  },
  {
    slug: "typescript",
    title: "TypeScript, properly",
    topic: "typescript",
    description:
      "From annotating a function to bending the type system, without the years of cargo-culting in between.",
    items: [
      { t: "TypeScript Handbook", u: "https://www.typescriptlang.org/docs/handbook/intro.html", k: "book", d: "beginner", s: "The official book. Complete, current, and shorter than you think." },
      { t: "TypeScript for JavaScript Programmers", u: "https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html", k: "article", d: "beginner", s: "The fastest honest introduction if you already write JavaScript." },
      { t: "Everyday Types", u: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html", k: "article", d: "beginner", s: "The ninety percent of TypeScript you will actually write." },
      { t: "TypeScript Playground", u: "https://www.typescriptlang.org/play", k: "website", d: "beginner", s: "Compile in the browser and see the emitted JavaScript. The fastest way to test a hunch." },
      { t: "Narrowing", u: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html", k: "article", d: "beginner", s: "How the compiler tracks what a value can be. The core skill of using the language." },
      { t: "Total TypeScript Beginners Tutorial", u: "https://www.totaltypescript.com/books/total-typescript-essentials", k: "book", d: "beginner", s: "Matt Pocock's free essentials book, written as exercises rather than prose." },
      { t: "tsconfig reference", u: "https://www.typescriptlang.org/tsconfig", k: "website", d: "beginner", s: "Every compiler option with an explanation. Read strict before you turn anything off." },
      { t: "Generics", u: "https://www.typescriptlang.org/docs/handbook/2/generics.html", k: "article", d: "intermediate", s: "Type parameters, constraints, and when a generic is actually earning its keep." },
      { t: "Type Manipulation", u: "https://www.typescriptlang.org/docs/handbook/2/types-from-types.html", k: "article", d: "intermediate", s: "Conditional, mapped and indexed types — the tools behind every clever utility type." },
      { t: "Utility Types", u: "https://www.typescriptlang.org/docs/handbook/utility-types.html", k: "article", d: "intermediate", s: "Partial, Pick, Omit, Record and friends. Learn these before writing your own." },
      { t: "Do's and Don'ts", u: "https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html", k: "article", d: "intermediate", s: "The official list of mistakes, including why you should almost never type something as Object." },
      { t: "Declaration Files", u: "https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html", k: "article", d: "intermediate", s: "How to describe JavaScript that has no types, which is still most of npm." },
      { t: "TypeScript Deep Dive", u: "https://basarat.gitbook.io/typescript/", k: "book", d: "intermediate", s: "Basarat's free book. Stronger on the why than the handbook is." },
      { t: "Modules and moduleResolution", u: "https://www.typescriptlang.org/docs/handbook/modules/theory.html", k: "article", d: "intermediate", s: "The single most confusing area of the toolchain, explained from first principles." },
      { t: "Type Challenges", u: "https://github.com/type-challenges/type-challenges", k: "code", d: "advanced", s: "Type-level puzzles from warm-up to genuinely hard. The gym for the type system." },
      { t: "Template Literal Types", u: "https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html", k: "article", d: "advanced", s: "String types the compiler can compute with. How typed routing libraries work." },
      { t: "Variance annotations", u: "https://www.typescriptlang.org/docs/handbook/2/generics.html#variance-annotations", k: "article", d: "advanced", s: "in and out, and why your generic wrapper accepts something it shouldn't." },
      { t: "The TypeScript compiler API", u: "https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API", k: "article", d: "advanced", s: "Reading and transforming TypeScript programmatically — the basis of every codemod." },
      { t: "TypeScript source", u: "https://github.com/microsoft/TypeScript", k: "code", d: "advanced", s: "The checker is one enormous file, and it is more readable than its reputation." },
      { t: "Structural typing and assignability", u: "https://www.typescriptlang.org/docs/handbook/type-compatibility.html", k: "article", d: "advanced", s: "The rules that decide whether one type fits another, including the unsound ones." },
      { t: "Performance", u: "https://github.com/microsoft/TypeScript/wiki/Performance", k: "article", d: "advanced", s: "Why your build is slow, from the people who wrote the compiler." },
    ],
  },

  {
    slug: "nextjs-fullstack",
    title: "Full-stack React with Next.js",
    topic: "next.js",
    description:
      "Routing, rendering and data on the framework most React apps now ship on.",
    items: [
      { t: "Learn Next.js", u: "https://nextjs.org/learn", k: "course", d: "beginner", s: "Build and deploy a real dashboard. The official course, and genuinely well made." },
      { t: "Getting Started", u: "https://nextjs.org/docs/app/getting-started", k: "article", d: "beginner", s: "The App Router from a blank folder. Start here, not on a five-year-old tutorial." },
      { t: "Routing fundamentals", u: "https://nextjs.org/docs/app/building-your-application/routing", k: "article", d: "beginner", s: "Files as routes, layouts as nesting. The idea the whole framework rests on." },
      { t: "Fetching data", u: "https://nextjs.org/docs/app/getting-started/fetching-data", k: "article", d: "beginner", s: "Where data loading lives now that components can run on the server." },
      { t: "Layouts and pages", u: "https://nextjs.org/docs/app/getting-started/layouts-and-pages", k: "article", d: "beginner", s: "Shared shells that don't re-render, which is most of the point of nested layouts." },
      { t: "Images and fonts", u: "https://nextjs.org/docs/app/getting-started/images-and-fonts", k: "article", d: "beginner", s: "Two of the largest performance wins available, handled by the framework." },
      { t: "Deploying", u: "https://nextjs.org/docs/app/getting-started/deploying", k: "article", d: "beginner", s: "What actually has to be true for a build to run somewhere other than your laptop." },
      { t: "Server and Client Components", u: "https://nextjs.org/docs/app/getting-started/server-and-client-components", k: "article", d: "intermediate", s: "The boundary that confuses everyone, and the rules for where to draw it." },
      { t: "Server Actions and mutations", u: "https://nextjs.org/docs/app/getting-started/mutating-data", k: "article", d: "intermediate", s: "Writing data without hand-rolling an API route for every form." },
      { t: "Caching in Next.js", u: "https://nextjs.org/docs/app/guides/caching", k: "article", d: "intermediate", s: "Four caches with different lifetimes. The source of most surprising behaviour." },
      { t: "Error handling", u: "https://nextjs.org/docs/app/getting-started/error-handling", k: "article", d: "intermediate", s: "Error boundaries, not-found states, and what the user sees when the server throws." },
      { t: "Metadata and SEO", u: "https://nextjs.org/docs/app/getting-started/metadata-and-og-images", k: "article", d: "intermediate", s: "Generated titles, descriptions and social images, typed rather than templated." },
      { t: "Middleware", u: "https://nextjs.org/docs/app/api-reference/file-conventions/middleware", k: "article", d: "intermediate", s: "Code that runs before the request resolves — auth gates, redirects, rewrites." },
      { t: "Authentication guide", u: "https://nextjs.org/docs/app/guides/authentication", k: "article", d: "intermediate", s: "Sessions, cookies and where to check them, from the framework's own perspective." },
      { t: "Partial Prerendering", u: "https://nextjs.org/docs/app/getting-started/partial-prerendering", k: "article", d: "advanced", s: "A static shell streamed with dynamic holes. The most interesting rendering idea in the framework." },
      { t: "Streaming and Suspense", u: "https://nextjs.org/docs/app/api-reference/file-conventions/loading", k: "article", d: "advanced", s: "Sending HTML before the data arrives, and what that does to perceived speed." },
      { t: "Incremental Static Regeneration", u: "https://nextjs.org/docs/app/guides/incremental-static-regeneration", k: "article", d: "advanced", s: "Static pages that update without a rebuild. The economics of a large content site." },
      { t: "Self-hosting Next.js", u: "https://nextjs.org/docs/app/guides/self-hosting", k: "article", d: "advanced", s: "What the platform was doing for you, made explicit. Worth reading before you commit to one." },
      { t: "How Next.js works", u: "https://nextjs.org/docs/architecture", k: "article", d: "advanced", s: "Compiler, runtimes and supported browsers — the architecture under the conventions." },
      { t: "Next.js source", u: "https://github.com/vercel/next.js", k: "code", d: "advanced", s: "The repo. packages/next/src/server is where the rendering actually happens." },
      { t: "Understanding React Server Components", u: "https://vercel.com/blog/understanding-react-server-components", k: "article", d: "advanced", s: "The clearest explanation of why RSC exists and what problem it was built for." },
    ],
  },
  {
    slug: "modern-css",
    title: "CSS and modern layout",
    topic: "css",
    description:
      "Grid, flexbox, custom properties and container queries — CSS as it is in a current browser, not as it was in 2015.",
    items: [
      { t: "MDN: Learn CSS", u: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics", k: "course", d: "beginner", s: "The reference everyone actually uses, in its taught-from-scratch form." },
      { t: "CSS Cascade and inheritance", u: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts", k: "article", d: "beginner", s: "Why your rule isn't applying. Almost every CSS bug is one of these three things." },
      { t: "The Box Model", u: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model", k: "article", d: "beginner", s: "Content, padding, border, margin — and why border-box is what you want." },
      { t: "A Complete Guide to Flexbox", u: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", k: "article", d: "beginner", s: "The single most-referenced page in front-end. Bookmark it; you will come back." },
      { t: "A Complete Guide to Grid", u: "https://css-tricks.com/snippets/css/complete-guide-grid/", k: "article", d: "beginner", s: "Two-dimensional layout, with every property illustrated." },
      { t: "Flexbox Froggy", u: "https://flexboxfroggy.com/", k: "course", d: "beginner", s: "Twenty-four levels of flexbox as a puzzle game. Faster than reading about it." },
      { t: "CSS Selectors", u: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors", k: "website", d: "beginner", s: "Every selector the browser supports, with what it matches." },
      { t: "Learn CSS", u: "https://web.dev/learn/css", k: "course", d: "intermediate", s: "Google's course. Stronger on the modern layout and colour modules than most books." },
      { t: "Custom properties", u: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties", k: "article", d: "intermediate", s: "Variables that cascade and can be read from JavaScript. The basis of every theming system." },
      { t: "Container queries", u: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries", k: "article", d: "intermediate", s: "Components that respond to their container rather than the viewport. The thing media queries could never do." },
      { t: "Defensive CSS", u: "https://defensivecss.dev/", k: "website", d: "intermediate", s: "Short patterns for layouts that don't break on long text, missing images or narrow screens." },
      { t: "Every Layout", u: "https://every-layout.dev/", k: "book", d: "intermediate", s: "Layout primitives derived from first principles. Changes how you think about the whole problem." },
      { t: "Modern CSS Solutions", u: "https://moderncss.dev/", k: "website", d: "intermediate", s: "Stephanie Eckles rebuilding common components with what CSS can now do alone." },
      { t: "A Complete Guide to CSS Cascade Layers", u: "https://css-tricks.com/css-cascade-layers/", k: "article", d: "intermediate", s: "Explicit control over specificity wars, which is what @layer is really for." },
      { t: "The Rules of Margin Collapse", u: "https://www.joshwcomeau.com/css/rules-of-margin-collapse/", k: "article", d: "advanced", s: "The oldest CSS trap, finally explained in a way that stays explained." },
      { t: "Stacking contexts", u: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context", k: "article", d: "advanced", s: "Why your z-index of 9999 does nothing. The answer is never a bigger number." },
      { t: "Understanding Layout Algorithms", u: "https://www.joshwcomeau.com/css/understanding-layout-algorithms/", k: "article", d: "advanced", s: "CSS as a set of competing layout engines rather than one set of properties." },
      { t: "CSS Containment", u: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment", k: "article", d: "advanced", s: "Telling the browser what can't affect what, and getting rendering performance for it." },
      { t: "Houdini and the CSS Painting API", u: "https://developer.mozilla.org/en-US/docs/Web/API/CSS_Painting_API", k: "article", d: "advanced", s: "Extending the rendering engine itself, for the cases where CSS genuinely runs out." },
      { t: "Cascade, specificity and inheritance", u: "https://web.dev/learn/css/specificity", k: "article", d: "advanced", s: "Specificity computed properly, including the parts that surprise experienced people." },
      { t: "CSS Working Group drafts", u: "https://drafts.csswg.org/", k: "website", d: "advanced", s: "The specifications as they are being written. Where the next three years of CSS is decided." },
    ],
  },
];

module.exports = { WEB };
