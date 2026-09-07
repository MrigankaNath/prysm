/* Machine learning and deep learning.
 *
 * The field has more free material than any other in this set and most of it
 * is bad — recycled tutorials that fit a model and stop. What survives here is
 * the material that explains why a method works, plus the three textbooks the
 * researchers themselves put online.
 */

const AI = [
  {
    slug: "machine-learning",
    title: "Machine Learning from scratch",
    topic: "machine learning",
    description:
      "From a first regression to reading the papers, without the tutorial layer that teaches you to call fit() and nothing else.",
    items: [
      { t: "MLU-Explain", u: "https://mlu-explain.github.io/", k: "website", d: "beginner", s: "Amazon's visual explainers. Every concept is a diagram you can drag rather than an equation." },
      { t: "Google Machine Learning Crash Course", u: "https://developers.google.com/machine-learning/crash-course", k: "course", d: "beginner", s: "Twelve hours, real exercises, no account needed. The most complete free introduction there is." },
      { t: "StatQuest: Machine Learning playlist", u: "https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF", k: "video", d: "beginner", s: "Josh Starmer explaining each method twice — once with pictures, once with the maths." },
      { t: "Kaggle: Intro to Machine Learning", u: "https://www.kaggle.com/learn/intro-to-machine-learning", k: "course", d: "beginner", s: "Seven short lessons that end with a model you built yourself. Runs in the browser." },
      { t: "scikit-learn: An introduction", u: "https://scikit-learn.org/stable/getting_started.html", k: "article", d: "beginner", s: "The library almost everyone starts with, introduced by the people who wrote it." },
      { t: "Elements of AI", u: "https://www.elementsofai.com/", k: "course", d: "beginner", s: "Helsinki's course for non-specialists. The best explanation of what the field can and cannot do." },
      { t: "Machine Learning for Humans", u: "https://medium.com/machine-learning-for-humans/why-machine-learning-matters-6164faf1df12", k: "article", d: "beginner", s: "A long-form tour of the whole field in plain language, with the maths kept optional." },
      { t: "scikit-learn User Guide", u: "https://scikit-learn.org/stable/user_guide.html", k: "book", d: "intermediate", s: "Every estimator with the theory behind it. Closer to a textbook than to API docs." },
      { t: "Kaggle: Intermediate Machine Learning", u: "https://www.kaggle.com/learn/intermediate-machine-learning", k: "course", d: "intermediate", s: "Missing values, categoricals, leakage and pipelines — where real data actually hurts." },
      { t: "Cross-validation: evaluating estimator performance", u: "https://scikit-learn.org/stable/modules/cross_validation.html", k: "article", d: "intermediate", s: "How to know your model works. More projects die here than on model choice." },
      { t: "Rules of Machine Learning", u: "https://developers.google.com/machine-learning/guides/rules-of-ml", k: "article", d: "intermediate", s: "Forty-three rules from Google engineers. Rule one: most problems do not need machine learning." },
      { t: "An Introduction to Statistical Learning", u: "https://www.statlearning.com/", k: "book", d: "intermediate", s: "ISLR, free from the authors. The standard bridge between the tutorials and the theory." },
      { t: "Feature Engineering", u: "https://www.kaggle.com/learn/feature-engineering", k: "course", d: "intermediate", s: "The part that decides whether a model works, and the part tutorials skip." },
      { t: "Distill", u: "https://distill.pub/", k: "website", d: "intermediate", s: "The journal that set the standard for explaining machine learning visually. Archived but unmatched." },
      { t: "The Elements of Statistical Learning", u: "https://hastie.su.domains/ElemStatLearn/", k: "book", d: "advanced", s: "Hastie, Tibshirani and Friedman, free from Stanford. The reference the field is built on." },
      { t: "Pattern Recognition and Machine Learning", u: "https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/", k: "book", d: "advanced", s: "Bishop's book, released free by Microsoft Research. The Bayesian view, done thoroughly." },
      { t: "Probabilistic Machine Learning", u: "https://probml.github.io/pml-book/", k: "book", d: "advanced", s: "Murphy's two volumes, free drafts. The most current comprehensive treatment available." },
      { t: "Understanding Machine Learning: From Theory to Algorithms", u: "https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/", k: "book", d: "advanced", s: "Shalev-Shwartz and Ben-David on why learning is possible at all. PAC bounds from first principles." },
      { t: "Exploring Bayesian Optimization", u: "https://distill.pub/2020/bayesian-optimization/", k: "article", d: "advanced", s: "Distill's interactive walk through the method behind most hyperparameter search." },
      { t: "pyprobml", u: "https://github.com/probml/pyprobml", k: "code", d: "advanced", s: "Runnable notebooks for every figure in Murphy's books. Theory you can step through." },
      { t: "Papers with Code", u: "https://paperswithcode.com/", k: "website", d: "advanced", s: "State of the art per task, each entry linked to a runnable implementation." },
    ],
  },
  {
    slug: "deep-learning",
    title: "Deep Learning, seriously",
    topic: "deep learning",
    description:
      "Backpropagation, architectures and transformers — built up from an actual derivative rather than from a framework call.",
    items: [
      { t: "3Blue1Brown: Neural Networks", u: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", k: "video", d: "beginner", s: "The visual explanation of what a network is and what gradient descent does to it." },
      { t: "But what is a neural network?", u: "https://www.3blue1brown.com/topics/neural-networks", k: "website", d: "beginner", s: "The written companion, with the interactive figures the videos are built from." },
      { t: "Neural Networks and Deep Learning", u: "http://neuralnetworksanddeeplearning.com/", k: "book", d: "beginner", s: "Michael Nielsen's free book. Builds a working digit classifier from nothing but numpy." },
      { t: "Practical Deep Learning for Coders", u: "https://course.fast.ai/", k: "course", d: "beginner", s: "fast.ai's course. Working models in lesson one, theory once you care why." },
      { t: "TensorFlow Playground", u: "https://playground.tensorflow.org/", k: "website", d: "beginner", s: "Add layers and watch the decision boundary move. Ten minutes here beats an hour of reading." },
      { t: "PyTorch: Learn the Basics", u: "https://pytorch.org/tutorials/beginner/basics/intro.html", k: "course", d: "beginner", s: "Tensors to a training loop in eight short pages, from the framework's own docs." },
      { t: "A Recipe for Training Neural Networks", u: "https://karpathy.github.io/2019/04/25/recipe/", k: "article", d: "beginner", s: "Karpathy on why your network silently fails, and the order to debug it in." },
      { t: "Dive into Deep Learning", u: "https://d2l.ai/", k: "book", d: "intermediate", s: "A whole textbook where every equation has runnable code beside it. Free and enormous." },
      { t: "CS231n: Convolutional Neural Networks", u: "https://cs231n.github.io/", k: "course", d: "intermediate", s: "Stanford's vision course notes. Still the clearest explanation of convolutions written." },
      { t: "The Illustrated Transformer", u: "https://jalammar.github.io/illustrated-transformer/", k: "article", d: "intermediate", s: "Attention drawn box by box. How most people finally understand the architecture." },
      { t: "Understanding LSTM Networks", u: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/", k: "article", d: "intermediate", s: "Chris Olah's diagrams. Pre-transformer, and still the best writing on sequence models." },
      { t: "Let's build GPT: from scratch, in code", u: "https://www.youtube.com/watch?v=kCc8FmEb1nY", k: "video", d: "intermediate", s: "Karpathy building a working transformer in two hours, typing every line." },
      { t: "The Annotated Transformer", u: "https://nlp.seas.harvard.edu/annotated-transformer/", k: "article", d: "intermediate", s: "Attention Is All You Need, reprinted with a working implementation between the paragraphs." },
      { t: "CS224n: NLP with Deep Learning", u: "https://web.stanford.edu/class/cs224n/", k: "course", d: "intermediate", s: "Stanford's language course, slides and notes public. The path from word vectors to LLMs." },
      { t: "Deep Learning", u: "https://www.deeplearningbook.org/", k: "book", d: "advanced", s: "Goodfellow, Bengio and Courville, free online. The field's standard reference text." },
      { t: "Attention Is All You Need", u: "https://arxiv.org/abs/1706.03762", k: "paper", d: "advanced", s: "The transformer paper. Eight pages that redirected the entire field." },
      { t: "Deep Residual Learning for Image Recognition", u: "https://arxiv.org/abs/1512.03385", k: "paper", d: "advanced", s: "ResNet. Why networks can be hundreds of layers deep and still train." },
      { t: "Adam: A Method for Stochastic Optimization", u: "https://arxiv.org/abs/1412.6980", k: "paper", d: "advanced", s: "The optimiser almost everything is trained with, in the authors' own words." },
      { t: "Distill: Feature Visualization", u: "https://distill.pub/2017/feature-visualization/", k: "article", d: "advanced", s: "What individual neurons actually respond to, rendered rather than asserted." },
      { t: "The Transformer Circuits Thread", u: "https://transformer-circuits.pub/", k: "website", d: "advanced", s: "Reverse-engineering what a transformer has learned. The frontier of interpretability." },
      { t: "nanoGPT", u: "https://github.com/karpathy/nanoGPT", k: "code", d: "advanced", s: "A GPT that trains on one GPU, in about 300 readable lines. The best code to study." },
    ],
  },
];

module.exports = { AI };
