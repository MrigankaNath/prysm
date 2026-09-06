/* Physics and philosophy.
 *
 * Two subjects where the free material is either excellent or actively
 * misleading, with very little in between. Quantum computing in particular has
 * a popular-science layer that teaches people something false and easy
 * ("it tries all answers at once"), so the beginner stops here are the ones
 * that refuse to say it.
 */

const MIXED = [
  {
    slug: "quantum-computing",
    title: "Quantum Computing without the hype",
    topic: "quantum computing",
    description:
      "What a qubit is, what interference buys you, and which problems this actually helps with — stated honestly at every level.",
    items: [
      { t: "Quantum Computing for the Very Curious", u: "https://quantum.country/qcvc", k: "book", d: "beginner", s: "Matuschak and Nielsen. An essay with spaced repetition built in, so it stays learned." },
      { t: "Scott Aaronson: The Limits of Quantum Computers", u: "https://www.scottaaronson.com/writings/limitsqc-draft.pdf", k: "article", d: "beginner", s: "The clearest short statement of what these machines cannot do, by someone qualified to say it." },
      { t: "Qiskit: Basics of Quantum Information", u: "https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information", k: "course", d: "beginner", s: "IBM's course. States, measurement and entanglement before any circuit." },
      { t: "Quantum Computing: A Gentle Introduction to Qubits", u: "https://www.youtube.com/watch?v=F_Riqjdh2oM", k: "video", d: "beginner", s: "Kurzgesagt-style, but accurate — a rare combination in this subject." },
      { t: "Quantum mechanics distilled", u: "https://quantum.country/qm", k: "book", d: "beginner", s: "The physics a qubit rests on, in one essay, assuming only vectors and matrices." },
      { t: "Quantum Country: Quantum Computing FAQ", u: "https://quantum.country/", k: "website", d: "beginner", s: "The essay series' home, including the shorter pieces on measurement and teleportation." },
      { t: "Shtetl-Optimized", u: "https://scottaaronson.blog/", k: "website", d: "beginner", s: "Aaronson's blog, and the most reliable place to find out whether a headline is nonsense." },
      { t: "Qiskit: Fundamentals of Quantum Algorithms", u: "https://quantum.cloud.ibm.com/learning/en/courses/fundamentals-of-quantum-algorithms", k: "course", d: "intermediate", s: "Deutsch-Jozsa through Grover and Shor, with runnable circuits at each step." },
      { t: "Quantum Algorithm Zoo", u: "https://quantumalgorithmzoo.org/", k: "website", d: "intermediate", s: "Every known quantum algorithm with its speedup and its source paper. The field's index." },
      { t: "IBM Quantum Composer", u: "https://quantum.cloud.ibm.com/composer", k: "website", d: "intermediate", s: "Build a circuit by dragging gates and run it on real hardware. Makes the maths concrete." },
      { t: "Quantum Computation and Quantum Information — notes", u: "https://www.cs.cmu.edu/~odonnell/quantum18/", k: "course", d: "intermediate", s: "O'Donnell's CMU course. Full lecture notes for the standard graduate treatment." },
      { t: "Grover's algorithm", u: "https://en.wikipedia.org/wiki/Grover%27s_algorithm", k: "article", d: "intermediate", s: "The quadratic speedup, and why quadratic is a much smaller deal than the press implies." },
      { t: "John Preskill: Quantum Computing in the NISQ era", u: "https://arxiv.org/abs/1801.00862", k: "paper", d: "intermediate", s: "The paper that named the current era and set expectations for it honestly." },
      { t: "Quantum Machine Learning: what it is and is not", u: "https://arxiv.org/abs/1611.09347", k: "paper", d: "intermediate", s: "A careful look at the most overclaimed application, by people working on it." },
      { t: "Quantum Computing: Lecture Notes", u: "https://arxiv.org/abs/1907.09415", k: "book", d: "advanced", s: "Ronald de Wolf's full graduate course, free on arXiv. The best single PDF in the subject." },
      { t: "Polynomial-Time Algorithms for Prime Factorization", u: "https://arxiv.org/abs/quant-ph/9508027", k: "paper", d: "advanced", s: "Shor's paper. The result that made governments start funding this." },
      { t: "Quantum Error Correction — Gottesman's lectures", u: "https://arxiv.org/abs/0904.2557", k: "paper", d: "advanced", s: "Error correction is the whole engineering problem, and this is the standard introduction." },
      { t: "Quantum Supremacy Using a Programmable Processor", u: "https://www.nature.com/articles/s41586-019-1666-5", k: "paper", d: "advanced", s: "Google's 2019 result, open access — and worth reading beside its critics." },
      { t: "Quantum Computing Since Democritus — lecture notes", u: "https://www.scottaaronson.com/democritus/", k: "book", d: "advanced", s: "The original free lecture notes. Complexity, physics and philosophy, very funny." },
      { t: "Surface codes: Towards practical large-scale quantum computation", u: "https://arxiv.org/abs/1208.0928", k: "paper", d: "advanced", s: "The error-correcting code most hardware roadmaps are actually betting on." },
      { t: "Qiskit source", u: "https://github.com/Qiskit/qiskit", k: "code", d: "advanced", s: "A production quantum SDK. The transpiler is where the interesting engineering lives." },
    ],
  },
  {
    slug: "stoicism",
    title: "The Stoics, unabridged",
    topic: "stoicism",
    description:
      "The primary texts and the scholarship — not the productivity-blog version that keeps the quotes and drops the physics.",
    items: [
      { t: "Meditations — Marcus Aurelius", u: "https://classics.mit.edu/Antoninus/meditations.html", k: "book", d: "beginner", s: "The private notebook of a Roman emperor. Free in full, and the usual first door in." },
      { t: "Enchiridion — Epictetus", u: "https://classics.mit.edu/Epictetus/epicench.html", k: "book", d: "beginner", s: "The handbook. Short enough to read in an hour and hard enough to spend years on." },
      { t: "Stoicism — Internet Encyclopedia of Philosophy", u: "https://iep.utm.edu/stoicism/", k: "article", d: "beginner", s: "A peer-reviewed overview of the whole school, not just the ethics people quote." },
      { t: "Letters from a Stoic — Seneca", u: "https://en.wikisource.org/wiki/Moral_letters_to_Lucilius", k: "book", d: "beginner", s: "One hundred and twenty-four letters. The most readable of the three Roman Stoics." },
      { t: "Discourses — Epictetus", u: "https://classics.mit.edu/Epictetus/discourses.html", k: "book", d: "beginner", s: "The lectures the Enchiridion summarises, with the arguments left in." },
      { t: "Stoicism — Stanford Encyclopedia of Philosophy", u: "https://plato.stanford.edu/entries/stoicism/", k: "article", d: "beginner", s: "The scholarly reference. Denser than the IEP and the one to trust on disputes." },
      { t: "On the Shortness of Life — Seneca", u: "https://en.wikisource.org/wiki/On_the_shortness_of_life", k: "book", d: "beginner", s: "Twenty pages on how people spend time. The single most quoted Stoic essay, in full." },
      { t: "Ancient Ethical Theory", u: "https://plato.stanford.edu/entries/ethics-ancient/", k: "article", d: "intermediate", s: "Where Stoicism sits against Aristotle and the Epicureans, which is how to actually judge it." },
      { t: "Stoic Ethics — IEP", u: "https://iep.utm.edu/stoiceth/", k: "article", d: "intermediate", s: "Virtue, indifferents and the passions, worked through properly." },
      { t: "Stoic Philosophy of Mind — IEP", u: "https://iep.utm.edu/stoicmind/", k: "article", d: "intermediate", s: "Impressions and assent — the psychology the ethics is built on, and usually skipped." },
      { t: "Stoic Logic", u: "https://plato.stanford.edu/entries/logic-ancient/", k: "article", d: "intermediate", s: "The Stoics invented propositional logic. This is the half of the school nobody markets." },
      { t: "Epictetus — SEP", u: "https://plato.stanford.edu/entries/epictetus/", k: "article", d: "intermediate", s: "The former slave who taught the emperor's teachers, and what he actually argued." },
      { t: "Seneca — SEP", u: "https://plato.stanford.edu/entries/seneca/", k: "article", d: "intermediate", s: "Including the uncomfortable part: he wrote this while serving Nero." },
      { t: "Marcus Aurelius — SEP", u: "https://plato.stanford.edu/entries/marcus-aurelius/", k: "article", d: "intermediate", s: "The Meditations read as philosophy rather than as an inspirational quote source." },
      { t: "Ancient Theories of Soul — SEP", u: "https://plato.stanford.edu/entries/ancient-soul/", k: "article", d: "advanced", s: "The physics the ethics depends on. Drop it and 'live according to nature' means nothing." },
      { t: "Lives of the Eminent Philosophers, Book VII", u: "https://en.wikisource.org/wiki/Lives_of_the_Eminent_Philosophers/Book_VII", k: "book", d: "advanced", s: "Diogenes Laertius on Zeno and the early Stoa — the main source for the founders." },
      { t: "Cicero: De Finibus and the Tusculan Disputations", u: "https://www.gutenberg.org/ebooks/29247", k: "book", d: "advanced", s: "Book III of De Finibus is the fullest surviving statement of Stoic ethics — written by a critic." },
      { t: "Determinism and freedom in Stoic philosophy", u: "https://plato.stanford.edu/entries/freewill/", k: "article", d: "advanced", s: "Compatibilism starts here. The Stoics got to it two thousand years before the moderns." },
      { t: "Causal Determinism — SEP", u: "https://plato.stanford.edu/entries/determinism-causal/", k: "article", d: "advanced", s: "Stoic determinism stated carefully, including how they tried to keep responsibility inside it." },
      { t: "Perseus Digital Library: Stoic texts", u: "https://www.perseus.tufts.edu/hopper/", k: "website", d: "advanced", s: "The Greek and Latin originals with word-by-word parsing, free from Tufts." },
      { t: "Cicero — SEP", u: "https://plato.stanford.edu/entries/cicero/", k: "article", d: "advanced", s: "Our single most important source for lost Stoic texts, and an opponent worth reading." },
    ],
  },
  {
    slug: "epistemology",
    title: "Thinking clearly",
    topic: "epistemology",
    description:
      "What makes a belief justified, why smart people are wrong confidently, and how to reason under uncertainty on purpose.",
    items: [
      { t: "Epistemology — Stanford Encyclopedia of Philosophy", u: "https://plato.stanford.edu/entries/epistemology/", k: "article", d: "beginner", s: "The map of the whole field. Read this before any popular book on thinking." },
      { t: "List of cognitive biases", u: "https://en.wikipedia.org/wiki/List_of_cognitive_biases", k: "website", d: "beginner", s: "The catalogue. Useless as a checklist, valuable as a way to notice your own moves." },
      { t: "The Gettier Problem", u: "https://iep.utm.edu/gettier/", k: "article", d: "beginner", s: "Three pages that broke a definition of knowledge that had stood for two thousand years." },
      { t: "An Intuitive Explanation of Bayes' Theorem", u: "https://www.readthesequences.com/An-Intuitive-Explanation-Of-Bayess-Theorem", k: "article", d: "beginner", s: "Yudkowsky's long walk through one formula until it stops feeling like arithmetic." },
      { t: "Seeing Theory", u: "https://seeing-theory.brown.edu/", k: "website", d: "beginner", s: "Brown's visual introduction to probability. Drag the parameters and watch belief update." },
      { t: "Fallacies — IEP", u: "https://iep.utm.edu/fallacy/", k: "article", d: "beginner", s: "A proper taxonomy of bad arguments, with why each one fails rather than just its name." },
      { t: "Calibration: Your Own Personal Test", u: "https://www.openphilanthropy.org/calibration/", k: "website", d: "beginner", s: "Find out whether your ninety percent means ninety percent. Most people's does not." },
      { t: "Bayesian Epistemology — SEP", u: "https://plato.stanford.edu/entries/epistemology-bayesian/", k: "article", d: "intermediate", s: "Degrees of belief done formally, including the arguments against doing it this way." },
      { t: "The Problem of Induction", u: "https://plato.stanford.edu/entries/induction-problem/", k: "article", d: "intermediate", s: "Hume's problem, still unsolved, and underneath every empirical claim you will ever make." },
      { t: "Falsifiability and the demarcation problem", u: "https://plato.stanford.edu/entries/pseudo-science/", k: "article", d: "intermediate", s: "What separates science from what looks like it. Harder than Popper made it sound." },
      { t: "Scientific Objectivity — SEP", u: "https://plato.stanford.edu/entries/scientific-objectivity/", k: "article", d: "intermediate", s: "Whether the thing we trust science for is even the thing science has." },
      { t: "Testimony — SEP", u: "https://plato.stanford.edu/entries/testimony-episprob/", k: "article", d: "intermediate", s: "Almost everything you know, you were told. This is the epistemology of that." },
      { t: "Why Most Published Research Findings Are False", u: "https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.0020124", k: "paper", d: "intermediate", s: "Ioannidis, 2005. The paper that started the replication crisis, and it is readable." },
      { t: "Peer Disagreement — SEP", u: "https://plato.stanford.edu/entries/disagreement/", k: "article", d: "intermediate", s: "What you should do when someone as informed as you concludes the opposite." },
      { t: "Epistemic Justification — SEP", u: "https://plato.stanford.edu/entries/justep-foundational/", k: "article", d: "advanced", s: "Foundationalism against coherentism — the regress problem that starts the whole subject." },
      { t: "Formal Epistemology — SEP", u: "https://plato.stanford.edu/entries/formal-epistemology/", k: "article", d: "advanced", s: "Belief modelled mathematically, and where the models stop matching people." },
      { t: "Probability Theory: The Logic of Science", u: "https://bayes.wustl.edu/etj/prob/book.pdf", k: "book", d: "advanced", s: "Jaynes. Probability derived as the only consistent extension of logic. Free and uncompromising." },
      { t: "Dutch Book Arguments — SEP", u: "https://plato.stanford.edu/entries/dutch-book/", k: "article", d: "advanced", s: "Why incoherent beliefs can be turned into a guaranteed loss, stated as a proof." },
      { t: "Social Epistemology — SEP", u: "https://plato.stanford.edu/entries/epistemology-social/", k: "article", d: "advanced", s: "Knowledge as something groups produce, which is how it is actually produced." },
      { t: "The Enduring Evolution of Logic", u: "https://plato.stanford.edu/entries/logic-classical/", k: "article", d: "advanced", s: "Classical logic stated precisely, for when informal reasoning stops being enough." },
      { t: "Reasoning and Argumentation — IEP", u: "https://iep.utm.edu/argument/", k: "article", d: "advanced", s: "Argument structure as a formal object: what makes one valid, sound, or merely persuasive." },
    ],
  },
];

module.exports = { MIXED };
