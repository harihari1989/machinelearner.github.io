# machinelearner.github.io

Visual, interactive explanations of machine learning and the mathematics that makes it work.

## Math Deep Dive

The Math Deep Dive is a white-theme course that builds formulas from pictures, motion, proofs, and numerical experiments. It concentrates on the mathematical foundations used most often in machine learning:

- calculus and trigonometry: limits, derivatives, integrals, the chain rule, Taylor approximation, the unit circle, rotation matrices, angle addition, and the geometric proof that the derivative of sine is cosine;
- linear algebra: vectors, span, transformations, composition, determinants, subspaces, projections, basis changes, eigenvectors, and abstract vector spaces;
- probability and statistics: events, counting, conditioning, Bayes’ rule, random variables, distributions, expectation, variance, covariance, the central limit theorem, likelihood, inference, regression, entropy, cross-entropy, and KL divergence; and
- neural networks: forward computation, loss, gradient descent, backpropagation, tokens, attention, transformers, feature memory, and diffusion.

The searchable formula library contains 54 guided lessons and 382 concept checkpoints. Each lesson moves through intuition, a concept-by-concept argument, a staged derivation, a visual experiment, boundary cases, and the connection to machine learning.

Dedicated proof labs let readers manipulate the angles in the unit-circle and rotation arguments. A probability lab connects exact probability to samples, Bayes updates, distributions, sampling distributions, and confidence intervals. The embedded Python lab lets readers edit and run numerical experiments for the sine derivative, rotation composition, Bayes’ rule, the central limit theorem, and gradient descent.

Serve the repository as a static site; browser security prevents the isolated
Python worker from running when `index.html` is opened with a `file://` URL.

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173/>. If `index.html` is opened directly while
that preview server is running, the page automatically hands off to this URL.
