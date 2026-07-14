window.MathLectureCatalog = {
    calculus: {
        label: "Calculus",
        color: "#61dafb",
        lectures: [
            {
                video: "WUvTyaaNkzM", duration: "17:05", scene: "accumulation",
                title: "The essence of calculus",
                summary: "Build calculus from one recurring move: approximate a hard whole with many simple pieces, then study what the approximation approaches.",
                concepts: ["Circle area from thin concentric rings", "Unrolling rings into an almost-triangle", "Integrals as limits of finite sums", "Area under f(t)=t² as an accumulation function", "Derivatives as sensitivity to a finite nudge", "The fundamental theorem linking accumulation and rate"],
                math: "\\(A(x)=\\int_0^x f(t)\\,dt\\Rightarrow A'(x)=f(x)\\)",
                ml: "Training loss is an accumulation over examples; gradients measure how that accumulated loss changes."
            },
            {
                video: "9vKqVkMQHKk", duration: "16:50", scene: "tangent",
                title: "The paradox of the derivative",
                summary: "Resolve the apparent contradiction of an instantaneous rate by examining ordinary finite differences and asking for their limiting value.",
                concepts: ["Average versus instantaneous velocity", "Secant lines approaching a tangent line", "Finite changes dx and df", "Difference quotients and limits", "Derivative as best local linear prediction", "Slope units and sensitivity interpretation"],
                math: "\\(f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}\\)",
                ml: "A partial derivative is the local effect of nudging one parameter while holding the others fixed."
            },
            {
                video: "S0_qX4VJhMQ", duration: "17:34", scene: "geometry",
                title: "Derivative formulas through geometry",
                summary: "Discover power-rule patterns by watching how tiny geometric pieces account for the change in squares, cubes, and higher powers.",
                concepts: ["Square-area proof for d(x²)", "Cube-volume proof for d(x³)", "First-order pieces dominate tiny changes", "Higher-order terms shrink faster", "General power rule pattern", "Why symbolic derivative rules encode geometry"],
                math: "\\((x+dx)^n-x^n\\approx n x^{n-1}dx\\)",
                ml: "Local linearization discards higher-order parameter interactions for a sufficiently small optimizer step."
            },
            {
                video: "YG15m2VwSjA", duration: "15:56", scene: "chain",
                title: "Visualizing the chain rule and product rule",
                summary: "Derive the rules for combined functions by tracking how small input nudges propagate through sums, products, and compositions.",
                concepts: ["Sum rule as adding output changes", "Product rule from changing rectangle area", "Negligible dx·dy corner term", "Composition as a dependency chain", "Multiplying local conversion factors", "Function notation versus differential intuition"],
                math: "\\(d(fg)=f\\,dg+g\\,df,\\quad \\frac{df}{dx}=\\frac{df}{dg}\\frac{dg}{dx}\\)",
                ml: "Backpropagation is repeated chain rule with cached intermediate activations."
            },
            {
                video: "m2MIpDrF7Es", duration: "13:50", scene: "growth",
                title: "What's so special about Euler's number e?",
                summary: "See why every exponential changes in proportion to itself and why one base makes the proportionality constant exactly one.",
                concepts: ["Additive time becomes multiplicative growth", "Derivative of a^t is proportional to a^t", "Separating the starting value from a tiny time step", "Defining e through its growth rate", "e^t as its own derivative", "Continuous growth and decay"],
                math: "\\(\\frac{d}{dt}e^{kt}=k e^{kt}\\)",
                ml: "Exponentials power softmax, log-likelihoods, normalization, continuous-time dynamics, and learning-rate schedules."
            },
            {
                video: "qb40J4N1fa4", duration: "15:34", scene: "constraint",
                title: "Implicit differentiation, what's going on here?",
                summary: "Treat an equation as a constraint coupling multiple changing quantities, then balance their tiny contributions without explicitly solving for one variable.",
                concepts: ["Curves defined by constraints F(x,y)=0", "x and y changing together", "Partial sensitivity to each input", "Circle tangent from x²+y²=r²", "Related rates", "Multivariable chain rule"],
                math: "\\(F_x\\,dx+F_y\\,dy=0\\Rightarrow \\frac{dy}{dx}=-\\frac{F_x}{F_y}\\)",
                ml: "Implicit gradients appear in equilibrium models, constrained optimization, differentiable solvers, and normalization layers."
            },
            {
                video: "kfF40MiS7zA", duration: "18:27", scene: "limit",
                title: "Limits, L'Hôpital's rule, and epsilon-delta definitions",
                summary: "Separate the value of a function from the value it approaches, formalize approach with tolerances, and explain a derivative-based rule for 0/0 ratios.",
                concepts: ["Approach value versus function value", "One-sided and two-sided behavior", "0/0 as missing information, not an answer", "L'Hôpital's rule via relative local change", "Epsilon output tolerance", "Delta input tolerance and rigorous limits"],
                math: "\\(\\forall\\varepsilon>0\\;\\exists\\delta>0:\\;0<|x-a|<\\delta\\Rightarrow|f(x)-L|<\\varepsilon\\)",
                ml: "Limit reasoning underlies convergence, numerical stability, gradient checking, and asymptotic approximations."
            },
            {
                video: "rfG8ce4nNh0", duration: "20:46", scene: "integration",
                title: "Integration and the fundamental theorem of calculus",
                summary: "Turn signed area into a limiting sum and show why changing the endpoint exposes the original function as the derivative of accumulated area.",
                concepts: ["Riemann rectangles and signed area", "Definite versus indefinite integrals", "Area accumulation function", "Antiderivatives", "Fundamental theorem, both directions", "Substitution as reversing the chain rule"],
                math: "\\(\\int_a^b f(x)\\,dx=F(b)-F(a),\\quad F'=f\\)",
                ml: "Expectations are integrals; empirical risk replaces them with finite sample averages."
            },
            {
                video: "FnJqaIESC2s", duration: "12:39", scene: "area-slope",
                title: "What does area have to do with slope?",
                summary: "Unify the seemingly different pictures of area and slope by tracking how a moving boundary changes accumulated quantity.",
                concepts: ["Velocity area gives displacement", "Height controls marginal area", "Accumulator graphs", "Derivative and integral as inverse operations", "Constants lost under differentiation", "Initial conditions restore the constant"],
                math: "\\(s(t)=s(0)+\\int_0^t v(\\tau)\\,d\\tau\\)",
                ml: "Optimizer trajectories accumulate velocity-like updates; initialization supplies the starting condition."
            },
            {
                video: "BLkz5LGWihw", duration: "5:39", scene: "curvature",
                title: "Higher order derivatives",
                summary: "Differentiate the rate itself to describe acceleration, bending, and progressively finer local behavior.",
                concepts: ["Second derivative as change of slope", "Position, velocity, acceleration, and jerk", "Concavity and inflection", "Curvature intuition", "Derivative order and units", "Local behavior beyond a tangent line"],
                math: "\\(f(x+h)\\approx f(x)+f'(x)h+\\tfrac12 f''(x)h^2\\)",
                ml: "The Hessian collects second derivatives and describes loss curvature, conditioning, and step-size sensitivity."
            },
            {
                video: "3d6DsjIBzJ4", duration: "22:20", scene: "series",
                title: "Taylor series",
                summary: "Encode all derivatives at one point into polynomial coefficients so local differential information reconstructs nearby function behavior.",
                concepts: ["Matching value, slope, and higher derivatives", "Why factorials normalize repeated differentiation", "Taylor polynomials versus infinite series", "Expansion around an arbitrary center", "Approximation error and radius of convergence", "Examples for cos(x), e^x, and nonconvergent cases"],
                math: "\\(f(x)=\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(a)}{n!}(x-a)^n\\)",
                ml: "First- and second-order optimization are truncated Taylor models of the loss."
            },
            {
                video: "CfW845LNObM", duration: "14:26", scene: "local-map",
                title: "The other way to visualize derivatives",
                summary: "View a function as a transformation and its derivative as the local stretch factor that best approximates that transformation near a point.",
                concepts: ["Functions as transformations of space", "Local stretching and squishing", "Derivative as a linear map", "Orientation reversal for negative derivatives", "Zero derivative as local collapse", "Generalization toward Jacobian matrices"],
                math: "\\(f(x+dx)-f(x)\\approx f'(x)\\,dx\\)",
                ml: "Jacobians are the multidimensional version of local stretch and govern signal and gradient propagation."
            }
        ]
    },
    linear: {
        label: "Linear algebra",
        color: "#a78bfa",
        lectures: [
            {
                video: "fNk_zzaMoSs", duration: "9:52", scene: "vectors",
                title: "Vectors",
                summary: "Reconcile the physics, computer-science, and mathematical views of vectors as arrows, ordered lists, and abstract objects that can be added and scaled.",
                concepts: ["Magnitude and direction", "Coordinates as scaled basis vectors", "Vector addition tip-to-tail", "Scalar multiplication", "Physics versus data interpretations", "The abstract add-and-scale viewpoint"],
                math: "\\(\\mathbf v=v_1\\hat\\imath+v_2\\hat\\jmath\\)",
                ml: "Examples, parameters, embeddings, gradients, and activations are all represented as vectors."
            },
            {
                video: "k7RM-ot2NWY", duration: "9:59", scene: "span",
                title: "Linear combinations, span, and basis vectors",
                summary: "Describe every reachable vector by scaling and adding a small set of directions, and identify when one direction adds no new freedom.",
                concepts: ["Linear combinations", "Span as all reachable outputs", "Basis vectors", "Linear dependence and redundancy", "Plane, line, and origin spans", "Coordinates depend on a chosen basis"],
                math: "\\(\\operatorname{span}\\{\\mathbf v_1,\\ldots,\\mathbf v_k\\}=\\{\\sum_i c_i\\mathbf v_i\\}\\)",
                ml: "Feature spaces and low-rank models ask which directions span useful variation without redundancy."
            },
            {
                video: "kYB8IZa5AuE", duration: "10:59", scene: "transform",
                title: "Linear transformations and matrices",
                summary: "Interpret a matrix as a motion of all space that keeps grid lines straight and parallel and keeps the origin fixed.",
                concepts: ["Transformations as functions", "Linearity conditions", "Columns as transformed basis vectors", "Matrix-vector multiplication as a linear combination", "Reading geometry from entries", "Why four numbers control every 2D vector"],
                math: "\\(A\\mathbf x=x_1A\\hat\\imath+x_2A\\hat\\jmath\\)",
                ml: "Every dense layer begins with a learned linear transformation of its input features."
            },
            {
                video: "XkY2DOUCWMU", duration: "10:04", scene: "composition",
                title: "Matrix multiplication as composition",
                summary: "Understand a matrix product as applying one transformation and then another, with order encoded from right to left.",
                concepts: ["Successive transformations", "Right-to-left application order", "Columns of a product", "Why multiplication is generally noncommutative", "Associativity from function composition", "Rotation, shear, and scale examples"],
                math: "\\((AB)\\mathbf x=A(B\\mathbf x)\\)",
                ml: "Stacked linear layers collapse to one matrix unless nonlinearities are inserted between them."
            },
            {
                video: "rHLEWRxRGiM", duration: "4:46", scene: "transform3d",
                title: "Three-dimensional linear transformations",
                summary: "Extend the moving-grid picture to 3D, where a matrix is determined by the destinations of three basis vectors.",
                concepts: ["Three basis directions", "3×3 matrix columns", "Transforming a cube and its lattice", "Matrix-vector products in 3D", "Plane and volume deformation", "Dimensional extension of the 2D picture"],
                math: "\\(A\\mathbf x=x_1A\\hat\\imath+x_2A\\hat\\jmath+x_3A\\hat k\\)",
                ml: "High-dimensional layers use the same rule, even when the geometry cannot be drawn directly."
            },
            {
                video: "Ip3X9LOh2dk", duration: "10:03", scene: "area",
                title: "The determinant",
                summary: "Read determinant magnitude as area or volume scaling and its sign as whether a transformation reverses orientation.",
                concepts: ["Area scaling in 2D", "Volume scaling in 3D", "Signed orientation", "Zero determinant and dimensional collapse", "Multiplicative scaling under composition", "Geometric meaning of ad−bc"],
                math: "\\(\\det\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}=ad-bc\\)",
                ml: "Determinants appear in change-of-variables densities, invertible networks, covariance volumes, and log-det regularizers."
            },
            {
                video: "uQhTuRlWMxw", duration: "12:09", scene: "subspaces",
                title: "Inverse matrices, column space, and null space",
                summary: "Solve A x=v by asking which inputs land on v, then classify solutions through image, rank, and the directions crushed to zero.",
                concepts: ["Inverse transformation", "Linear systems as preimage questions", "Column space as reachable outputs", "Rank as output dimension", "Null space as inputs mapped to zero", "No, unique, or infinitely many solutions"],
                math: "\\(A^{-1}A=I,\\quad \\ker A=\\{\\mathbf x:A\\mathbf x=0\\}\\)",
                ml: "Null spaces expose lost information; rank controls representation capacity and parameter redundancy."
            },
            {
                video: "v8VSDg_WQlA", duration: "4:27", scene: "dimensions",
                title: "Nonsquare matrices as transformations between dimensions",
                summary: "See an m×n matrix as a map from n-dimensional inputs to m-dimensional outputs rather than an incomplete square array.",
                concepts: ["Input versus output dimension", "Columns live in the output space", "Projection to fewer dimensions", "Embedding into more dimensions", "Rank bounded by min(m,n)", "Shape-aware matrix multiplication"],
                math: "\\(A\\in\\mathbb R^{m\\times n}:\\mathbb R^n\\to\\mathbb R^m\\)",
                ml: "Neural layers routinely expand, compress, project, and embed vectors using nonsquare weight matrices."
            },
            {
                video: "LyGKycYT2v0", duration: "14:12", scene: "projection",
                title: "Dot products and duality",
                summary: "Connect the coordinate formula for a dot product to projection, then identify every linear scalar-valued measurement with a vector.",
                concepts: ["Projection length", "Cosine and alignment", "Dot product symmetry", "Linear functionals", "Row vectors as measurements", "Duality between vectors and scalar-valued linear maps"],
                math: "\\(\\mathbf v\\cdot\\mathbf w=\\|\\mathbf v\\|\\|\\mathbf w\\|\\cos\\theta\\)",
                ml: "Similarity search, logits, attention scores, and linear classifiers are built from dot products."
            },
            {
                video: "eu6i7WJeinw", duration: "8:54", scene: "cross",
                title: "Cross products",
                summary: "Construct a vector perpendicular to two 3D inputs whose magnitude equals their parallelogram area and whose sign follows orientation.",
                concepts: ["Perpendicular output direction", "Parallelogram area magnitude", "Right-hand orientation", "Antisymmetry", "Coordinate determinant mnemonic", "Zero for parallel vectors"],
                math: "\\(\\|\\mathbf v\\times\\mathbf w\\|=\\|\\mathbf v\\|\\|\\mathbf w\\|\\sin\\theta\\)",
                ml: "The geometric idea supports 3D vision, normals, rotations, robotics, and differentiable graphics."
            },
            {
                video: "BaM7OCEm3G0", duration: "13:10", scene: "duality3d",
                title: "Cross products in the light of linear transformations",
                summary: "Explain the cross-product coordinate formula by turning signed volume into a linear functional and using duality to recover its representing vector.",
                concepts: ["Signed parallelepiped volume", "Determinant as a function of one variable vector", "Linearity of that volume function", "Dual vector representation", "Cofactor formula from geometry", "Cross product as the dual of an area functional"],
                math: "\\((\\mathbf v\\times\\mathbf w)\\cdot\\mathbf u=\\det[\\mathbf u\\;\\mathbf v\\;\\mathbf w]\\)",
                ml: "Duality is the deeper pattern behind gradients: a linear sensitivity functional is represented as a vector."
            },
            {
                video: "jBsC34PxzoM", duration: "12:12", scene: "cramer",
                title: "Cramer's rule, explained geometrically",
                summary: "Solve a transformed-coordinate problem by comparing signed area or volume scaling before and after replacing one matrix column.",
                concepts: ["Linear systems as inverse transformations", "Coordinates as area ratios", "Replacing one column with the target", "Determinant ratios", "Singular systems and failure", "Geometric origin of Cramer's formula"],
                math: "\\(x_i=\\frac{\\det A_i}{\\det A}\\)",
                ml: "Direct determinant formulas are rarely used at scale, but their geometry clarifies identifiability and conditioning."
            },
            {
                video: "P2LTAUO1TdA", duration: "12:51", scene: "basis",
                title: "Change of basis",
                summary: "Separate a geometric vector from the coordinates used to describe it and derive how an operator changes when both input and output coordinates change.",
                concepts: ["Coordinates relative to a basis", "Basis matrix as a translator", "Converting into and out of alternate coordinates", "Similarity transformation", "Same operator, different matrix", "Choosing a basis that simplifies a map"],
                math: "\\([T]_{B}=B^{-1}[T]_{\\text{standard}}B\\)",
                ml: "PCA, Fourier features, eigenbases, and learned embeddings choose coordinates that expose useful structure."
            },
            {
                video: "PFDu9oVAE-g", duration: "17:16", scene: "eigen",
                title: "Eigenvectors and eigenvalues",
                summary: "Find directions that a transformation leaves on their own span and quantify the stretch or reversal along each one.",
                concepts: ["Invariant directions", "Eigenvalue as scale factor", "Repeated transformations", "Diagonal representation in an eigenbasis", "Rotations with no real eigenvectors", "Applications to dynamics and differential equations"],
                math: "\\(A\\mathbf v=\\lambda\\mathbf v\\)",
                ml: "Eigenvectors describe covariance directions, graph modes, recurrent dynamics, curvature, and long-run behavior."
            },
            {
                video: "e50Bj7jn9IQ", duration: "13:13", scene: "eigen-compute",
                title: "A quick trick for computing eigenvalues",
                summary: "Turn the search for invariant directions into the condition that A−λI collapses some nonzero vector to zero.",
                concepts: ["Rearranging A v=λv", "Nontrivial null space", "Characteristic determinant", "Characteristic polynomial", "Trace and determinant relationships in 2D", "Algebraic versus geometric multiplicity"],
                math: "\\(\\det(A-\\lambda I)=0\\)",
                ml: "Spectral radii predict exploding or vanishing dynamics in iterative and recurrent systems."
            },
            {
                video: "TgKwz5Ikpc8", duration: "16:46", scene: "abstract",
                title: "Abstract vector spaces",
                summary: "Strip away arrows and coordinates to keep only addition and scalar multiplication, revealing functions and other objects as genuine vectors.",
                concepts: ["Vector-space axioms", "Polynomials and functions as vectors", "Basis beyond coordinate arrows", "Linear transformations as structure-preserving maps", "Derivatives as linear operators", "Abstraction as reusable structure"],
                math: "\\(T(a\\mathbf u+b\\mathbf v)=aT(\\mathbf u)+bT(\\mathbf v)\\)",
                ml: "Kernels, function spaces, signals, and feature maps rely on vector-space structure beyond finite lists."
            }
        ]
    },
    neural: {
        label: "Neural networks",
        color: "#ff7a90",
        lectures: [
            {
                video: "aircAruvnKk", duration: "18:40", scene: "network",
                title: "But what is a neural network?",
                summary: "Assemble a digit classifier from neurons that take weighted sums, add biases, and apply nonlinear activations across successive representation layers.",
                concepts: ["784 pixel inputs and 10 digit outputs", "Hidden-layer activations", "Weights as connection strengths", "Bias as activation threshold", "Sigmoid nonlinearity", "Layer-by-layer feature hypothesis", "13,002 learned parameters in the example", "Why nonlinear composition is expressive"],
                math: "\\(\\mathbf a^{(l)}=\\sigma(W^{(l)}\\mathbf a^{(l-1)}+\\mathbf b^{(l)})\\)",
                ml: "The complete inference path is alternating linear algebra and nonlinear gating."
            },
            {
                video: "IHZwWFHWa-w", duration: "20:33", scene: "landscape",
                title: "Gradient descent, how neural networks learn",
                summary: "Turn wrong predictions into a scalar cost, interpret all parameters as one high-dimensional input, and follow the negative gradient.",
                concepts: ["Per-example squared error", "Average cost over training data", "Parameter-space landscape", "Gradient as steepest ascent", "Negative-gradient update", "Learning-rate tradeoff", "Local minima and saddle points", "Stochastic and mini-batch gradient descent", "Gradient components as parameter importance"],
                math: "\\(\\theta\\leftarrow\\theta-\\eta\\nabla_\\theta C\\)",
                ml: "Learning means changing weights and biases to reduce a data-defined objective."
            },
            {
                video: "Ilg3gGewQ5U", duration: "12:47", scene: "backprop",
                title: "Backpropagation, intuitively",
                summary: "Assign responsibility for output error by tracing which earlier activations and connections could most effectively change the result.",
                concepts: ["Desired output activation changes", "Positive and negative influence", "Active presynaptic neurons matter more", "Bias adjustments", "Propagating desired changes backward", "Combining effects across downstream paths", "Averaging gradients across examples", "Backprop as efficient credit assignment"],
                math: "\\(\\delta^{(l)}=(W^{(l+1)T}\\delta^{(l+1)})\\odot\\sigma'(z^{(l)})\\)",
                ml: "The algorithm efficiently computes every parameter's effect without perturbing parameters one by one."
            },
            {
                video: "tIeHLnjs5U8", duration: "10:18", scene: "backprop-calculus",
                title: "Backpropagation calculus",
                summary: "Write the intuitive backward influence as explicit chain-rule factors for weights, biases, weighted sums, activations, and cost.",
                concepts: ["Weighted input z=wa+b", "Activation derivative", "Cost derivative", "Chain rule for one weight", "Previous activation scales the weight gradient", "Bias derivative", "Multiple paths add", "Vectorized layer equations"],
                math: "\\(\\frac{\\partial C}{\\partial w}=\\frac{\\partial C}{\\partial a}\\frac{\\partial a}{\\partial z}\\frac{\\partial z}{\\partial w}\\)",
                ml: "Automatic differentiation implements these vector-Jacobian products over arbitrary computation graphs."
            },
            {
                video: "LPZh9BOjkQs", duration: "7:58", scene: "tokens",
                title: "Large Language Models explained briefly",
                summary: "Frame an LLM as a next-token prediction system whose scale, training data, and repeated prediction produce flexible language behavior.",
                concepts: ["Text split into tokens", "Conditional next-token probabilities", "Autoregressive generation", "Pretraining on large corpora", "Parameters as learned statistical structure", "Context window", "Sampling and temperature", "Fine-tuning and instruction following"],
                math: "\\(p(x_1,\\ldots,x_T)=\\prod_{t=1}^{T}p(x_t\\mid x_{<t})\\)",
                ml: "A single prediction objective can produce broad capabilities when paired with scale and rich data."
            },
            {
                video: "wjZofJX0v4M", duration: "27:14", scene: "transformer",
                title: "Transformers, the tech behind LLMs",
                summary: "Follow tokens through embedding space, attention, multilayer perceptrons, residual streams, and an unembedding that produces next-token logits.",
                concepts: ["Tokenization and vocabulary", "High-dimensional token embeddings", "Positional information", "Residual stream", "Attention blocks", "Feed-forward/MLP blocks", "Layer normalization", "Unembedding to logits", "Softmax probabilities", "Parameter count and repeated layers"],
                math: "\\(\\text{logits}=W_U\\,\\mathbf h_{\\text{final}}\\)",
                ml: "Transformers repeatedly edit contextual token representations while preserving information in a residual stream."
            },
            {
                video: "eMlx5fFNoYc", duration: "26:10", scene: "attention",
                title: "Attention in transformers, step-by-step",
                summary: "Derive self-attention as learned query-key matching followed by a weighted mixture of value vectors.",
                concepts: ["Query, key, and value projections", "Dot-product relevance scores", "Scale by √d_k", "Causal masking", "Softmax normalization", "Weighted value aggregation", "Multiple attention heads", "Head-specific learned relations", "Output projection and residual addition"],
                math: "\\(\\operatorname{Attention}(Q,K,V)=\\operatorname{softmax}(QK^T/\\sqrt{d_k})V\\)",
                ml: "Attention is content-dependent routing: each token decides which earlier information to retrieve."
            },
            {
                video: "9-Jl0dxWQs8", duration: "22:43", scene: "memory",
                title: "How might LLMs store facts?",
                summary: "Interpret transformer MLP layers as key-value memories that detect feature directions and write associated information back into the residual stream.",
                concepts: ["MLP expansion and contraction", "Input directions as feature detectors", "Nonlinear gating with ReLU/GELU", "Output directions as value writes", "Facts as distributed associations", "Superposition in high dimensions", "Polysemantic neurons", "Limits of a literal neuron-as-fact story"],
                math: "\\(\\operatorname{MLP}(\\mathbf x)=W_{out}\\,\\phi(W_{in}\\mathbf x+\\mathbf b_{in})+\\mathbf b_{out}\\)",
                ml: "Knowledge is distributed across directions and circuits, so interpretation requires more than inspecting single neurons."
            },
            {
                video: "iv-5mZ_9CPY", duration: "37:20", scene: "diffusion",
                title: "But how do AI images and videos actually work?",
                summary: "Explain generative image and video systems through compressed latent representations, iterative denoising, text conditioning, and learned visual-language alignment.",
                concepts: ["Autoencoder compression into latent space", "Forward diffusion adds scheduled Gaussian noise", "Denoiser predicts noise or score", "Reverse diffusion iteratively recovers structure", "Text embeddings and cross-attention conditioning", "Classifier-free guidance", "CLIP-style aligned image-text representations", "Sampling schedules", "Video adds temporal coherence and motion", "Training versus generation"],
                math: "\\(x_t=\\sqrt{\\bar\\alpha_t}x_0+\\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon\\)",
                ml: "Diffusion turns generation into a sequence of learned local denoising steps, closely related to time-dependent differential equations."
            }
        ]
    }
};
