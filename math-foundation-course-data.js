(() => {
    'use strict';

    const catalog = window.MathLectureCatalog;
    if (!catalog) return;

    Object.values(catalog).forEach(course => {
        delete course.playlist;
        course.lectures.forEach(lecture => delete lecture.video);
    });

    const lesson = (scene, title, summary, concepts, math, ml, duration = '14 min') => ({
        scene, title, summary, concepts, math, ml, duration
    });

    catalog.calculus.label = 'Calculus + trigonometry';
    catalog.calculus.lectures.push(
        lesson(
            'unit-circle-proof',
            'Sine and cosine are coordinates',
            'Construct trigonometry from a unit radius. The angle selects a point on the circle; cosine and sine are its horizontal and vertical coordinates, and the Pythagorean identity is simply the fixed radius.',
            [
                'Radians measure signed arc length on a unit circle',
                'A radius at angle θ ends at (cos θ, sin θ)',
                'Horizontal and vertical projections form a right triangle',
                'Quadrant signs come from coordinate direction',
                'The identity cos²θ + sin²θ = 1 is the circle equation',
                'Tangent is the slope sin θ / cos θ wherever cos θ is nonzero',
                'Periodicity follows when one full turn returns to the same point',
                'The tangent direction is a quarter-turn of the radius'
            ],
            '\\(\\mathbf u(\\theta)=(\\cos\\theta,\\sin\\theta),\\quad \\cos^2\\theta+\\sin^2\\theta=1\\)',
            'Periodic features, Fourier encodings, and positional representations all inherit this circular geometry.',
            '15 min'
        ),
        lesson(
            'rotation-addition-proof',
            'Rotation matrices prove the angle-addition formulas',
            'Derive the rotation matrix from the images of the basis vectors. Composing rotations in two ways forces the sine and cosine addition identities, so the formulas become consequences of motion rather than facts to memorize.',
            [
                'The first matrix column is the rotated x-basis vector',
                'The second column is the rotated y-basis vector',
                'A quarter-turn gives the sign pattern (-sin A, cos A)',
                'Rotation preserves lengths, angles, and orientation',
                'Rotating by B and then A gives R(A)R(B)',
                'The same motion is one rotation R(A+B)',
                'Comparing first-column entries proves both addition identities',
                'Replacing B by -B yields subtraction and double-angle identities'
            ],
            '\\(R(A)R(B)=R(A+B)\\Rightarrow\\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B\\)',
            'Orthogonal transformations, data augmentation, and equivariant models use exactly this composition law.',
            '18 min'
        ),
        lesson(
            'sine-derivative-proof',
            'Why the derivative of sine is cosine',
            'Prove the two small-angle limits from circle geometry, substitute the sine addition identity into the difference quotient, and interpret the result as the vertical component of the unit circle tangent.',
            [
                'Derivative means the limiting vertical change per radian',
                'Sector and triangle areas give sin h < h < tan h',
                'The squeeze theorem gives sin h / h → 1',
                'The half-angle identity gives (cos h - 1) / h → 0',
                'Expand sin(θ+h) with the angle-addition identity',
                'Separate the difference quotient into two known limits',
                'Only the cos θ coefficient survives, so d sin θ / dθ = cos θ',
                'The derivative vector (-sin θ, cos θ) is tangent and perpendicular to the radius'
            ],
            '\\(\\displaystyle\\frac{d}{d\\theta}\\sin\\theta=\\lim_{h\\to0}\\frac{\\sin(\\theta+h)-\\sin\\theta}{h}=\\cos\\theta\\)',
            'Derivatives of periodic activations, Fourier features, and oscillatory kernels begin with this proof.',
            '20 min'
        )
    );

    catalog.probability = {
        label: 'Probability + statistics',
        color: '#059669',
        lectures: [
            lesson('sample-space', 'Sample spaces, events, and probability axioms', 'Treat uncertainty as geometry over possible outcomes. Events are sets, unions mean “or,” intersections mean “and,” and probability is a consistent measure assigned to those sets.', [
                'A sample space Ω lists every possible outcome', 'An event A is a subset of Ω', 'Complements represent “not A”', 'Unions represent A or B', 'Intersections represent A and B', 'P(Ω)=1 and P(A)≥0', 'Disjoint events add without overlap', 'Inclusion–exclusion subtracts double-counted overlap'
            ], '\\(P(A\\cup B)=P(A)+P(B)-P(A\\cap B)\\)', 'Classification outputs distribute one unit of probability mass across possible labels.'),
            lesson('counting', 'Counting outcomes without listing them', 'Build the product rule, permutations, combinations, and binomial coefficients from decision trees. Counting is the denominator and numerator of many exact probability calculations.', [
                'The product rule multiplies choices across sequential decisions', 'Factorials count orderings of distinct objects', 'Permutations count ordered selections', 'Combinations ignore order', 'Dividing by k! removes rearrangements of the same subset', 'Binomial coefficients count binary strings with k successes', 'The binomial theorem packages all success counts', 'Combinatorial explosion motivates sampling and approximation'
            ], '\\(\\binom nk=\\frac{n!}{k!(n-k)!}\\)', 'Feature subsets, minibatches, model structures, and exact latent assignments all grow combinatorially.'),
            lesson('conditional', 'Conditional probability and independence', 'Conditioning zooms into a smaller possible world. Independence is the special case where that zoom does not change the probability of the other event.', [
                'P(A|B) renormalizes the part of A inside B', 'The denominator P(B) rescales the restricted universe to one', 'The multiplication rule reconstructs intersections', 'Order matters for conditional probability', 'Independence means P(A|B)=P(A)', 'Equivalent independence test P(A∩B)=P(A)P(B)', 'Pairwise independence need not imply mutual independence', 'Conditional independence can appear after observing a useful variable'
            ], '\\(P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}\\)', 'Graphical models express which variables become independent once a representation or label is known.'),
            lesson('bayes-update', 'Bayes’ rule as a flow of probability mass', 'Start with prior mass on hypotheses, pass it through likelihood filters, and renormalize the surviving mass. This makes base rates, false positives, and evidence visually explicit.', [
                'The prior represents belief before current evidence', 'The likelihood scores how compatible data is with each hypothesis', 'Prior times likelihood gives unnormalized posterior mass', 'The evidence is the total surviving mass', 'Normalization makes posterior probabilities sum to one', 'Posterior odds equal prior odds times a likelihood ratio', 'Base-rate neglect occurs when the prior is ignored', 'Sequential updates reuse the previous posterior as the next prior'
            ], '\\(P(H\\mid D)=\\frac{P(D\\mid H)P(H)}{\\sum_j P(D\\mid H_j)P(H_j)}\\)', 'Bayesian classifiers, uncertainty estimates, filtering, and probabilistic inference all use this update.'),
            lesson('random-variable', 'Random variables and expectation', 'A random variable maps outcomes to numbers. Its distribution moves probability mass onto a number line, and expectation is the balance point or long-run average of that mass.', [
                'A random variable is a function X:Ω→ℝ', 'A probability mass function assigns mass to discrete values', 'A density assigns probability through area, not point height', 'A cumulative distribution records P(X≤x)', 'Expectation is a probability-weighted average', 'Linearity of expectation does not require independence', 'Functions of variables use E[g(X)]', 'Expected loss is the population objective in learning'
            ], '\\(\\mathbb E[X]=\\sum_x xP(X=x)\\quad\\text{or}\\quad\\int x f(x)\\,dx\\)', 'Training minimizes an empirical estimate of expected prediction loss.'),
            lesson('variance-covariance', 'Variance, covariance, and correlation', 'Measure spread by averaging squared displacement from the mean, then extend the idea to whether two variables move together. Correlation normalizes covariance into a unit-free scale.', [
                'Centering subtracts the mean', 'Squaring prevents positive and negative deviations from canceling', 'Variance equals E[X²]−E[X]²', 'Standard deviation restores the original units', 'Covariance records joint directional variation', 'Positive covariance means above-mean values tend to coincide', 'Correlation divides out both marginal scales', 'Zero correlation does not generally imply independence'
            ], '\\(\\operatorname{Cov}(X,Y)=\\mathbb E[(X-\\mu_X)(Y-\\mu_Y)],\\quad\\rho=\\frac{\\operatorname{Cov}(X,Y)}{\\sigma_X\\sigma_Y}\\)', 'Covariance matrices define feature geometry; whitening and PCA act directly on that structure.'),
            lesson('discrete-distributions', 'Bernoulli, binomial, categorical, and Poisson models', 'Choose a distribution by matching the outcome structure and assumptions: one binary trial, repeated trials, one of many labels, or counts over an interval.', [
                'Bernoulli models one binary outcome', 'Binomial counts successes in n independent equal-probability trials', 'Categorical distributes mass across K labels', 'Multinomial counts repeated categorical outcomes', 'Poisson models counts at a constant independent rate', 'Distribution parameters determine mean and variance', 'Probability mass must sum to one', 'Log probabilities turn products into stable sums'
            ], '\\(P(K=k)=\\binom nk p^k(1-p)^{n-k}\\)', 'Binary and multiclass cross-entropy are negative log-likelihoods for Bernoulli and categorical models.'),
            lesson('continuous-distributions', 'Uniform, Gaussian, exponential, and transformed densities', 'Read probability as area beneath a density. Understand location, scale, tails, change of variables, and why the Gaussian repeatedly appears when many small effects add.', [
                'A density value is not itself a probability', 'Interval probability is an integral', 'Uniform density expresses equal plausibility over a range', 'Gaussian location and scale are μ and σ', 'Exponential waiting time is memoryless', 'Standardization maps values to z-scores', 'Change of variables preserves probability mass', 'Tail behavior controls the frequency of extreme values'
            ], '\\(f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}\\)', 'Gaussian noise models, initialization, latent-variable models, and uncertainty intervals depend on density geometry.'),
            lesson('clt-sampling', 'Law of large numbers and central limit theorem', 'Separate two convergence ideas: sample averages stabilize near the population mean, while the distribution of standardized sample means approaches a Gaussian under broad conditions.', [
                'A sample mean averages independent observations', 'The law of large numbers concerns convergence to μ', 'Variance of the sample mean is σ²/n', 'Standard error shrinks as 1/√n', 'The CLT concerns the shape of repeated sample means', 'Centering and √n scaling prevent collapse', 'The original population need not be Gaussian', 'Dependence and heavy tails can invalidate simple approximations'
            ], '\\(\\sqrt n\\,\\frac{\\bar X-\\mu}{\\sigma}\\xrightarrow{d}\\mathcal N(0,1)\\)', 'Minibatch gradients are noisy sample averages; batch size controls their standard error.'),
            lesson('likelihood', 'Likelihood, maximum likelihood, and MAP', 'Hold the observed data fixed and view the probability model as a function of its parameters. The best-fitting parameter makes the observed sample most plausible under the assumed model.', [
                'Probability varies outcomes with parameters fixed', 'Likelihood varies parameters with data fixed', 'Independent data makes likelihoods multiply', 'Log-likelihood turns products into sums', 'Maximum likelihood chooses the peak', 'The score is the log-likelihood gradient', 'MAP adds log prior to log likelihood', 'Regularization often equals a negative log prior'
            ], '\\(\\hat\\theta_{MLE}=\\arg\\max_\\theta\\sum_i\\log p(x_i\\mid\\theta)\\)', 'Most supervised losses are negative log-likelihood objectives optimized by gradients.'),
            lesson('inference', 'Estimators, confidence intervals, bootstrap, and tests', 'An estimate varies from sample to sample. Sampling distributions turn that variation into standard errors, intervals, and tests while making assumptions and error rates explicit.', [
                'An estimator is a random function of a sample', 'Bias measures systematic displacement', 'Variance measures sample-to-sample instability', 'Mean squared error combines squared bias and variance', 'A confidence procedure has repeated-sampling coverage', 'Bootstrap resamples observed data to estimate uncertainty', 'A p-value is a tail probability under a null model', 'Statistical significance is not effect size or practical importance'
            ], '\\(\\operatorname{MSE}(\\hat\\theta)=\\operatorname{Bias}(\\hat\\theta)^2+\\operatorname{Var}(\\hat\\theta)\\)', 'Validation metrics also have sampling uncertainty; resampling helps compare models responsibly.'),
            lesson('bayesian-inference', 'Bayesian inference with continuous parameters', 'Treat the parameter as uncertain, combine a prior density with the likelihood, and use the posterior to make predictions that average over parameter uncertainty.', [
                'A prior density describes plausible parameter values', 'A likelihood reshapes the prior using data', 'The posterior is a full distribution, not one estimate', 'The marginal likelihood is the normalizing integral', 'Credible intervals contain posterior mass', 'Posterior predictive distributions average over parameters', 'Conjugacy gives analytic updates in special cases', 'Sampling or variational methods approximate difficult posteriors'
            ], '\\(p(\\theta\\mid D)=\\frac{p(D\\mid\\theta)p(\\theta)}{\\int p(D\\mid\\vartheta)p(\\vartheta)d\\vartheta}\\)', 'Bayesian neural nets, ensembling, and uncertainty-aware decisions integrate over plausible models.'),
            lesson('least-squares', 'Regression, least squares, and the geometry of projection', 'Fit a linear prediction by projecting the target vector onto the column space of the design matrix. The optimal residual is perpendicular to every available feature direction.', [
                'A design matrix stores examples by features', 'Predictions Xβ live in the column space of X', 'Residuals are y−Xβ', 'Squared loss is residual length squared', 'The optimum residual is orthogonal to every column', 'Orthogonality gives the normal equations', 'Correlation does not establish causation', 'Regularization stabilizes poorly determined directions'
            ], '\\(X^T(X\\hat\\beta-y)=0\\Rightarrow\\hat\\beta=(X^TX)^{-1}X^Ty\\)', 'Linear regression, output layers, and local approximations all use projection and residual geometry.'),
            lesson('information', 'Entropy, cross-entropy, and KL divergence', 'Measure uncertainty as expected surprise. Cross-entropy scores predictions under the true distribution, while KL divergence is the extra coding cost caused by using the wrong distribution.', [
                'Surprise is −log p and grows for rare events', 'Entropy is expected surprise under one distribution', 'Entropy is zero for a certain outcome', 'Cross-entropy uses q to encode outcomes drawn from p', 'KL divergence is cross-entropy minus entropy', 'KL is nonnegative but asymmetric', 'Minimizing cross-entropy matches the predicted distribution to data', 'Softmax plus cross-entropy yields a simple probability error gradient'
            ], '\\(H(p,q)=-\\sum_x p(x)\\log q(x)=H(p)+D_{KL}(p\\|q)\\)', 'Classification, language modeling, variational inference, and distillation all optimize information-theoretic objectives.')
        ]
    };

    const guides = window.MathLectureGuides || (window.MathLectureGuides = {});
    const derivations = window.MathLectureDerivations || (window.MathLectureDerivations = {});
    const guide = (scene, formula, observe, check) => { guides[scene] = { formula, observe, check }; };
    const derive = (scene, steps) => { derivations[scene] = steps.map(([math, text]) => ({ math, text })); };

    guide('unit-circle-proof', 'Read cosine and sine as the two coordinate projections of a unit radius. The circle equation and every sign change then follow from geometry.', 'Move θ through all four quadrants. Track the radius, its two shadows, and the tangent direction together.', 'Why does using radians make the distance traveled along the unit circle equal to the input change?');
    derive('unit-circle-proof', [
        ['\\|\\mathbf u(\\theta)\\|=1', 'The moving point stays one unit from the origin.'],
        ['\\mathbf u(\\theta)=(\\cos\\theta,\\sin\\theta)', 'The coordinate projections define cosine and sine.'],
        ['\\cos^2\\theta+\\sin^2\\theta=1', 'The Pythagorean theorem is exactly the unit-circle equation.'],
        ['\\tan\\theta=\\sin\\theta/\\cos\\theta', 'The right triangle slope is rise divided by run wherever the run is nonzero.']
    ]);
    guide('rotation-addition-proof', 'A rotation is fixed by where it sends the two basis vectors. Multiplying two such matrices and comparing with one combined rotation proves the angle formulas.', 'Move A and B separately, then watch the same endpoint reached by a single A+B turn.', 'Which sign in the second column makes the basis stay perpendicular and orientation-preserving?');
    derive('rotation-addition-proof', [
        ['R(A)\\hat{\\mathbf i}=(\\cos A,\\sin A)', 'The first column is the rotated horizontal basis vector.'],
        ['R(A)\\hat{\\mathbf j}=(-\\sin A,\\cos A)', 'The vertical basis is the same unit direction turned a quarter-circle farther.'],
        ['R(A)R(B)=R(A+B)', 'Two successive turns and one combined turn are the same linear transformation.'],
        ['\\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B', 'The lower entry of the first column must agree.'],
        ['\\cos(A+B)=\\cos A\\cos B-\\sin A\\sin B', 'The upper entry of the first column must agree.']
    ]);
    guide('sine-derivative-proof', 'The addition formula separates the difference quotient into two universal small-angle limits. Circle areas prove those limits without assuming the derivative.', 'Shrink h while comparing the secant displacement with the tangent vector at θ.', 'Where does the proof require radians, and how would degrees change the derivative?');
    derive('sine-derivative-proof', [
        ['\\sin h<h<\\tan h', 'For 0<h<π/2, the inner triangle, circular sector, and outer triangle have increasing areas.'],
        ['\\cos h<\\sin h/h<1', 'Divide by positive h and rearrange; squeezing as h→0 gives sin h/h→1.'],
        ['(\\cos h-1)/h=-2\\sin^2(h/2)/h\\to0', 'The half-angle identity supplies the second small-angle limit.'],
        ['\\frac{\\sin(\\theta+h)-\\sin\\theta}{h}=\\sin\\theta\\frac{\\cos h-1}{h}+\\cos\\theta\\frac{\\sin h}{h}', 'The addition identity isolates the only two limiting ratios.'],
        ['(\\sin\\theta)\' = \\cos\\theta', 'The first term vanishes and the second tends to cosine.']
    ]);

    const probabilityGuides = {
        'sample-space': ['Use set area to read union, intersection, and complement before calculating.', 'Move probability mass between regions and compare exact area with sampled frequency.', 'Why must overlap be subtracted once in the addition rule?'],
        counting: ['Build counts by multiplying branch choices, then divide out orderings that describe the same selection.', 'Follow a decision tree and watch equivalent leaf orderings collapse into one combination.', 'Why is choosing k items equivalent to choosing the n−k items left out?'],
        conditional: ['Conditioning crops the universe to B and then rescales that region to total probability one.', 'Compare the fraction of A in the full space with the fraction inside B.', 'How can A and B be dependent even if neither causes the other?'],
        'bayes-update': ['Posterior mass is surviving prior mass after each hypothesis passes through its likelihood filter.', 'Change the base rate and diagnostic accuracy; watch identical evidence imply a different posterior.', 'Why can a highly accurate test still produce many false positives for a rare condition?'],
        'random-variable': ['Expectation is the center of mass of probability after outcomes are mapped to numbers.', 'Move probability mass and watch the balance point shift without needing any outcome at the mean.', 'Why does E[X+Y]=E[X]+E[Y] even when X and Y are dependent?'],
        'variance-covariance': ['Variance is average squared radius about the mean; covariance is signed co-motion about two means.', 'Rotate a point cloud and compare its principal spread directions with covariance sign.', 'What nonlinear dependence can have zero covariance?'],
        'discrete-distributions': ['Match the support and assumptions before selecting a probability-mass formula.', 'Vary p and n; watch binomial mass move and concentrate around np.', 'Which binomial assumption fails when one draw changes the next draw’s probability?'],
        'continuous-distributions': ['Probability is density area over an interval; height alone only describes local concentration.', 'Change μ and σ while the total Gaussian area remains one.', 'Why can a density exceed one while every probability remains at most one?'],
        'clt-sampling': ['Averages concentrate because independent noise partially cancels; √n scaling reveals the stable sampling shape.', 'Resample skewed data at growing n and watch the histogram of means become narrower and more bell-shaped.', 'Why does multiplying sample size by four only halve the standard error?'],
        likelihood: ['Keep data fixed and slide the parameter; likelihood rises when the model places more mass near what occurred.', 'Watch independent likelihood factors become an additive log-likelihood curve.', 'Why is likelihood not a probability distribution over parameters unless combined with a prior and normalized?'],
        inference: ['An estimator is one output of a repeatable sampling procedure; uncertainty belongs to that procedure.', 'Generate many samples, mark their estimates, and compare coverage of repeated intervals.', 'What exactly is random in a frequentist confidence interval before and after observing data?'],
        'bayesian-inference': ['Multiply prior density by likelihood pointwise and normalize the resulting posterior area.', 'Add observations sequentially and watch the posterior concentrate while retaining parameter uncertainty.', 'How does a posterior predictive distribution differ from plugging in one best parameter?'],
        'least-squares': ['The fitted vector is the closest point in the feature column space, so the residual must be perpendicular to that entire space.', 'Move the candidate prediction along the regression subspace and watch residual length minimize at a right angle.', 'What happens to the normal-equation solution when columns are linearly dependent?'],
        information: ['Surprise converts multiplication of probabilities into addition; expected surprise measures coding cost.', 'Shift predicted mass away from actual outcomes and watch cross-entropy and KL increase.', 'Why is KL divergence asymmetric even though both arguments are probability distributions?']
    };
    Object.entries(probabilityGuides).forEach(([scene, values]) => guide(scene, ...values));

    derive('sample-space', [['P(\\Omega)=1', 'All possible outcomes carry total mass one.'], ['P(A^c)=1-P(A)', 'The complement receives exactly the mass outside A.'], ['P(A\\cup B)=P(A)+P(B)-P(A\\cap B)', 'Adding both events counts their overlap twice, so subtract it once.']]);
    derive('conditional', [['P(A\\cap B)=P(A\\mid B)P(B)', 'The mass of B times the fraction of B also in A gives the intersection.'], ['P(A\\mid B)=P(A\\cap B)/P(B)', 'Divide by B to make the restricted universe total one.'], ['P(A\\cap B)=P(A)P(B)', 'If conditioning changes nothing, the multiplication rule factorizes.']]);
    derive('bayes-update', [['P(H,D)=P(D\\mid H)P(H)', 'Prior mass survives in proportion to the likelihood of the evidence.'], ['P(D)=\\sum_jP(D\\mid H_j)P(H_j)', 'Add surviving mass across mutually exclusive hypotheses.'], ['P(H\\mid D)=P(H,D)/P(D)', 'Normalize the selected joint mass by all ways the evidence could occur.']]);
    derive('random-variable', [['X:\\Omega\\to\\mathbb R', 'Map each outcome to the numerical quantity of interest.'], ['P_X(x)=P(\\{\\omega:X(\\omega)=x\\})', 'Collect outcome probability at each mapped value.'], ['\\mathbb E[X]=\\sum_xxP_X(x)', 'The weighted center is the long-run average under repeated sampling.']]);
    derive('variance-covariance', [['\\mu=\\mathbb E[X]', 'First locate the distribution center.'], ['\\operatorname{Var}(X)=\\mathbb E[(X-\\mu)^2]', 'Average squared radial displacement from the center.'], ['\\operatorname{Var}(X)=\\mathbb E[X^2]-\\mu^2', 'Expanding the square gives a computational identity.'], ['\\rho=\\operatorname{Cov}(X,Y)/(\\sigma_X\\sigma_Y)', 'Standardizing both axes makes co-motion unit-free.']]);
    derive('discrete-distributions', [['P(X=x)\\ge0,\\quad\\sum_xP(X=x)=1', 'A valid mass function assigns nonnegative mass totaling one.'], ['P(K=k)=\\binom nkp^k(1-p)^{n-k}', 'Choose which trials succeed, then multiply success and failure probabilities.'], ['\\mathbb E[K]=np,\\quad\\operatorname{Var}(K)=np(1-p)', 'A binomial count sums n independent Bernoulli variables.']]);
    derive('continuous-distributions', [['P(a\\le X\\le b)=\\int_a^bf(x)dx', 'Probability is area beneath the density.'], ['\\int_{-\\infty}^{\\infty}f(x)dx=1', 'The complete density has unit area.'], ['z=(x-\\mu)/\\sigma', 'Center and scale to compare values in standard-deviation units.']]);
    derive('clt-sampling', [['\\bar X_n=n^{-1}\\sum_iX_i', 'Average independent observations with common finite mean and variance.'], ['\\mathbb E[\\bar X_n]=\\mu,\\quad\\operatorname{Var}(\\bar X_n)=\\sigma^2/n', 'Averaging preserves the mean while independent variance divides by n.'], ['\\sqrt n(\\bar X_n-\\mu)/\\sigma\\xrightarrow{d}\\mathcal N(0,1)', 'Centering and standardizing expose the limiting Gaussian sampling shape.']]);
    derive('likelihood', [['L(\\theta;D)=\\prod_ip(x_i\\mid\\theta)', 'Conditional independence turns a dataset likelihood into a product.'], ['\\ell(\\theta)=\\sum_i\\log p(x_i\\mid\\theta)', 'The logarithm preserves the maximizer and improves numerical stability.'], ['\\nabla_\\theta\\ell(\\hat\\theta)=0', 'An interior maximum has zero local slope, subject to curvature and boundaries.'], ['\\hat\\theta_{MAP}=\\arg\\max[\\ell(\\theta)+\\log p(\\theta)]', 'A prior adds a regularizing preference.']]);
    derive('inference', [['\\operatorname{Bias}(\\hat\\theta)=\\mathbb E[\\hat\\theta]-\\theta', 'Bias compares the procedure’s average estimate with truth.'], ['\\operatorname{MSE}=\\operatorname{Bias}^2+\\operatorname{Var}', 'Squared error separates systematic and sampling components.'], ['\\hat\\theta\\pm z^*\\operatorname{SE}(\\hat\\theta)', 'An approximate interval combines an estimate, sampling scale, and target coverage multiplier.']]);
    derive('bayesian-inference', [['p(\\theta,D)=p(D\\mid\\theta)p(\\theta)', 'Joint density is likelihood times prior.'], ['p(D)=\\int p(D\\mid\\theta)p(\\theta)d\\theta', 'Integrate across every parameter explanation of the data.'], ['p(\\theta\\mid D)=p(\\theta,D)/p(D)', 'Normalize into the posterior density.'], ['p(y_*\\mid x_*,D)=\\int p(y_*\\mid x_*,\\theta)p(\\theta\\mid D)d\\theta', 'Predict by averaging over parameter uncertainty.']]);
    derive('least-squares', [['L(\\beta)=\\|y-X\\beta\\|^2', 'Residual length measures squared prediction error.'], ['\\nabla_\\beta L=-2X^T(y-X\\beta)', 'Each feature direction measures residual alignment.'], ['X^T(y-X\\hat\\beta)=0', 'At the optimum, the residual is perpendicular to every column.'], ['X^TX\\hat\\beta=X^Ty', 'The normal equations encode the orthogonal projection.']]);
    derive('information', [['I(x)=-\\log p(x)', 'Rare outcomes carry more surprise, while independent surprises add.'], ['H(p)=\\mathbb E_p[I(X)]=-\\sum_xp(x)\\log p(x)', 'Entropy is expected self-information.'], ['H(p,q)=-\\sum_xp(x)\\log q(x)', 'Cross-entropy scores a coding distribution q on outcomes drawn from p.'], ['D_{KL}(p\\|q)=H(p,q)-H(p)\\ge0', 'The excess coding cost vanishes only when q matches p on p-supported outcomes.']]);
    derive('counting', [['n!=n(n-1)\\cdots1', 'Order n distinct objects by choosing one remaining object at each position.'], ['P(n,k)=n!/(n-k)!', 'Stop the ordered choice tree after k positions.'], ['\\binom nk=P(n,k)/k!', 'Every unordered subset appears in k! internal orders.']]);
})();
