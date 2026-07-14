window.MathLectureDerivations = {
    accumulation: [
        { math: "\\Delta A = \\sum_i f(t_i)\\,\\Delta t", text: "Approximate the accumulated quantity with finitely many thin rectangles." },
        { math: "A(x+\\Delta x)-A(x) \\approx f(x)\\,\\Delta x", text: "Moving the boundary adds one marginal strip whose height is the current function value." },
        { math: "A'(x)=\\lim_{\\Delta x\\to0}\\frac{\\Delta A}{\\Delta x}=f(x)", text: "The strip error vanishes relative to its width, revealing the fundamental theorem." }
    ],
    integration: [
        { math: "S(P)=\\sum_i f(x_i^*)\\,\\Delta x_i", text: "A tagged partition replaces continuous accumulation with finitely many signed rectangles." },
        { math: "\\int_a^b f(x)\\,dx=\\lim_{\\|P\\|\\to0}S(P)", text: "The integral is the stable value reached as the widest subinterval shrinks to zero." },
        { math: "A(x)=\\int_a^x f(t)\\,dt\\quad\\Rightarrow\\quad A'(x)=f(x)", text: "A moving endpoint adds one marginal strip, so the accumulator's slope equals the current height." },
        { math: "\\int_a^b f(x)\\,dx=F(b)-F(a),\\quad F'=f", text: "An antiderivative records all accumulated local changes; evaluating its endpoint difference gives the total signed area." },
        { math: "u=g(x),\\quad du=g'(x)dx", text: "Substitution reverses the chain rule by changing both the coordinate and the infinitesimal width." }
    ],
    "area-slope": [
        { math: "\\Delta s\\approx v(t)\\,\\Delta t", text: "Over a short time interval, velocity is nearly constant and contributes one thin displacement rectangle." },
        { math: "s(t)=s(0)+\\int_0^t v(\\tau)\\,d\\tau", text: "Adding every signed rectangle accumulates velocity into total displacement from the initial position." },
        { math: "\\frac{ds}{dt}=v(t)", text: "Moving the time boundary exposes the new rectangle's height, so area on the velocity graph becomes slope on the position graph." },
        { math: "\\frac{d}{dt}(s(t)+C)=v(t)", text: "Differentiation loses constants; an initial condition supplies the vertical placement that area alone cannot recover." }
    ],
    tangent: [
        { math: "m_h=\\frac{f(x+h)-f(x)}{h}", text: "Two distinct points define an ordinary secant slope for every nonzero h." },
        { math: "f(x+h)=f(x)+m_hh", text: "The secant line predicts the nearby output using a finite input nudge." },
        { math: "f'(x)=\\lim_{h\\to0}m_h", text: "As the second point approaches, the finite slopes settle to the best local linear prediction." }
    ],
    geometry: [
        { math: "(x+dx)^2=x^2+2x\\,dx+(dx)^2", text: "A changed square contains two first-order strips and one second-order corner." },
        { math: "\\frac{d(x^2)}{dx}=2x+dx", text: "Divide the area change by the side-length change before taking a limit." },
        { math: "dx\\to0\\quad\\Longrightarrow\\quad \\frac{d(x^2)}{dx}=2x", text: "The corner shrinks one order faster; the surviving slabs give the power rule." }
    ],
    chain: [
        { math: "du\\approx g'(x)\\,dx", text: "The first local map converts a small input change into an intermediate change." },
        { math: "dy\\approx f'(u)\\,du", text: "The second local map converts that intermediate change into an output change." },
        { math: "\\frac{dy}{dx}=\\frac{dy}{du}\\frac{du}{dx}", text: "Substitution multiplies conversion factors; parallel dependency paths are added." }
    ],
    growth: [
        { math: "a^{t+h}=a^t a^h", text: "An additive time step becomes the same multiplicative growth factor at every starting time." },
        { math: "\\frac{a^{t+h}-a^t}{h}=a^t\\frac{a^h-1}{h}", text: "The current height factors out, so the derivative must be proportional to the function." },
        { math: "\\lim_{h\\to0}\\frac{e^h-1}{h}=1\\quad\\Rightarrow\\quad \\frac{d}{dt}e^t=e^t", text: "The base e is chosen so the proportionality constant is exactly one." }
    ],
    constraint: [
        { math: "F(x,y)=0", text: "The curve is the set of inputs that keep one multivariable output fixed." },
        { math: "dF=F_x\\,dx+F_y\\,dy=0", text: "Allowed motion must make the contributions from x and y cancel." },
        { math: "\\frac{dy}{dx}=-\\frac{F_x}{F_y}", text: "Solving the balance gives the tangent slope wherever F_y is nonzero." }
    ],
    limit: [
        { math: "|f(x)-L|<\\varepsilon", text: "Begin by demanding an output accuracy, represented as a horizontal band around L." },
        { math: "0<|x-a|<\\delta", text: "Choose an input window narrow enough that every nearby graph point enters that band." },
        { math: "\\forall\\varepsilon>0\\;\\exists\\delta>0", text: "A limit exists when every requested accuracy has a working input tolerance." }
    ],
    curvature: [
        { math: "f(x+h)\\approx f(x)+f'(x)h", text: "First order gives a tangent-line prediction." },
        { math: "f'(x+h)\\approx f'(x)+f''(x)h", text: "Second order measures how the tangent slope itself changes." },
        { math: "f(x+h)\\approx f(x)+f'(x)h+\\tfrac12 f''(x)h^2", text: "Integrating the changing slope produces the quadratic correction and its one-half factor." }
    ],
    series: [
        { math: "P_n(x)=c_0+c_1(x-a)+\\cdots+c_n(x-a)^n", text: "Build a polynomial around the point where derivative information is known." },
        { math: "P_n^{(k)}(a)=k!\\,c_k=f^{(k)}(a)", text: "At the center, each derivative isolates one coefficient; the factorial cancels repeated power-rule factors." },
        { math: "f(x)\\sim\\sum_{k=0}^{\\infty}\\frac{f^{(k)}(a)}{k!}(x-a)^k", text: "Adding matched derivatives widens local agreement, subject to convergence and remainder error." }
    ],
    "local-map": [
        { math: "f(x+h)-f(x)=L(h)+r(h)", text: "Separate the output change into a linear prediction and a residual error." },
        { math: "L(h)=f'(x)h", text: "In one dimension the best linear map is multiplication by the local stretch factor." },
        { math: "\\lim_{h\\to0}\\frac{|r(h)|}{|h|}=0", text: "Differentiability means the residual becomes negligible compared with the input nudge." }
    ],
    vectors: [
        { math: "\\mathbf v=v_1\\hat{\\mathbf i}+v_2\\hat{\\mathbf j}", text: "Coordinates are instructions for scaling and adding chosen basis directions." },
        { math: "\\|\\mathbf v\\|=\\sqrt{v_1^2+v_2^2}", text: "The Pythagorean theorem turns coordinate components into geometric magnitude." },
        { math: "\\mathbf u+\\mathbf v", text: "Tip-to-tail addition combines displacements while scalar multiplication changes length and possibly direction." }
    ],
    span: [
        { math: "a\\mathbf v+b\\mathbf w", text: "Let the coefficients vary to sweep every reachable linear combination." },
        { math: "\\mathbf w=c\\mathbf v", text: "If one direction is built from another, both coefficients still reach only a line." },
        { math: "\\operatorname{span}\\{\\mathbf v,\\mathbf w\\}=\\mathbb R^2", text: "Two independent planar directions reach the whole plane and form a basis." }
    ],
    transform: [
        { math: "\\mathbf x=x_1\\hat{\\mathbf i}+x_2\\hat{\\mathbf j}", text: "Resolve the input into basis directions before moving any grid point." },
        { math: "A\\mathbf x=x_1A\\hat{\\mathbf i}+x_2A\\hat{\\mathbf j}", text: "Linearity preserves the same coefficients after the basis vectors move." },
        { math: "A=\\begin{bmatrix}|&|\\\\A\\hat{\\mathbf i}&A\\hat{\\mathbf j}\\\\|&|\\end{bmatrix}", text: "The matrix columns record the transformed basis and therefore determine the entire map." }
    ],
    composition: [
        { math: "\\mathbf y=B\\mathbf x", text: "The rightmost transformation acts on the input first." },
        { math: "\\mathbf z=A\\mathbf y=A(B\\mathbf x)", text: "The second map acts on the already transformed vector and grid." },
        { math: "\\mathbf z=(AB)\\mathbf x", text: "Matrix multiplication compresses the two-stage motion into one linear transformation; order generally matters." }
    ],
    transform3d: [
        { math: "\\mathbf x=x_1\\hat{\\mathbf i}+x_2\\hat{\\mathbf j}+x_3\\hat{\\mathbf k}", text: "Three coordinates scale the three basis directions of space." },
        { math: "A\\mathbf x=x_1A\\hat{\\mathbf i}+x_2A\\hat{\\mathbf j}+x_3A\\hat{\\mathbf k}", text: "The three matrix columns are the new edges of the transformed unit cube." },
        { math: "\\det A=0", text: "If those edges become coplanar, volume collapses and the transformation loses a dimension." }
    ],
    area: [
        { math: "A\\hat{\\mathbf i}=(a,c),\\quad A\\hat{\\mathbf j}=(b,d)", text: "The columns form the sides of the transformed unit parallelogram." },
        { math: "\\text{signed area}=ad-bc", text: "Subtract the oppositely oriented triangular contributions to measure oriented area." },
        { math: "\\det(AB)=\\det A\\det B", text: "Successive transformations multiply their signed area or volume scale factors." }
    ],
    subspaces: [
        { math: "\\operatorname{Col}(A)=\\{A\\mathbf x\\}", text: "The column space contains every output reachable through linear combinations of the columns." },
        { math: "\\ker(A)=\\{\\mathbf x:A\\mathbf x=0\\}", text: "The null space contains directions the transformation erases completely." },
        { math: "\\dim\\ker A+\\operatorname{rank}A=n", text: "Rank-nullity partitions input freedom into visible and lost directions." }
    ],
    dimensions: [
        { math: "A\\in\\mathbb R^{m\\times n}", text: "There are n input coordinates and m output coordinates." },
        { math: "A\\mathbf x=\\sum_{j=1}^{n}x_j\\mathbf a_j", text: "Every column is an m-dimensional output vector weighted by one input coordinate." },
        { math: "\\operatorname{rank}A\\le\\min(m,n)", text: "Independent output directions cannot exceed either the available inputs or the output-space dimension." }
    ],
    projection: [
        { math: "\\cos\\theta=\\frac{\\text{adjacent}}{\\text{hypotenuse}}", text: "On the unit circle, cosine is the horizontal coordinate and the signed shadow of a unit radius." },
        { math: "\\operatorname{comp}_{\\mathbf v}\\mathbf w=\\|\\mathbf w\\|\\cos\\theta", text: "Scale that unit-circle shadow by the length of the vector being projected." },
        { math: "\\mathbf v\\cdot\\mathbf w=\\|\\mathbf v\\|\\|\\mathbf w\\|\\cos\\theta", text: "The dot product adds the reference-vector scale and records signed alignment." }
    ],
    cross: [
        { math: "\\sin\\theta=\\frac{\\text{opposite}}{\\text{hypotenuse}}", text: "On the unit circle, sine is the vertical coordinate and therefore the perpendicular-height fraction." },
        { math: "\\text{area}=\\|\\mathbf v\\|\\bigl(\\|\\mathbf w\\|\\sin\\theta\\bigr)", text: "Use one vector as the base and the sine component of the other as the height." },
        { math: "\\|\\mathbf v\\times\\mathbf w\\|=\\|\\mathbf v\\|\\|\\mathbf w\\|\\sin\\theta", text: "Package the oriented parallelogram area into a perpendicular vector selected by the right-hand rule." }
    ],
    duality3d: [
        { math: "F(\\mathbf u)=\\det[\\mathbf u\\;\\mathbf v\\;\\mathbf w]", text: "Holding two vectors fixed makes signed volume a linear measurement of the third." },
        { math: "F(\\mathbf u)=\\mathbf p\\cdot\\mathbf u", text: "Every linear scalar measurement in Euclidean space has a representing dual vector." },
        { math: "\\mathbf p=\\mathbf v\\times\\mathbf w", text: "The representing vector is perpendicular to the base plane and has magnitude equal to its area." }
    ],
    cramer: [
        { math: "A\\mathbf x=\\mathbf b=x_1\\mathbf a_1+\\cdots+x_n\\mathbf a_n", text: "The solution coordinates describe the target in the transformed basis." },
        { math: "\\det A_i=x_i\\det A", text: "Replacing column i with the target leaves only the matching coordinate's volume contribution." },
        { math: "x_i=\\frac{\\det A_i}{\\det A}", text: "Normalize by the original basis volume; a zero denominator signals a singular system." }
    ],
    basis: [
        { math: "\\mathbf v=B[\\mathbf v]_B", text: "The basis matrix translates B-coordinates into standard coordinates." },
        { math: "[T\\mathbf v]_B=B^{-1}TB[\\mathbf v]_B", text: "Translate in, apply the geometric transformation, then translate back." },
        { math: "[T]_B=B^{-1}TB", text: "Similar matrices encode the same operator in different coordinate languages." }
    ],
    eigen: [
        { math: "A\\mathbf v=\\lambda\\mathbf v", text: "An eigenvector remains on its own line while the eigenvalue controls stretch, reversal, or collapse." },
        { math: "(A-\\lambda I)\\mathbf v=0", text: "Move the scaled vector to the left to reveal a nontrivial null-space condition." },
        { math: "\\det(A-\\lambda I)=0", text: "A nonzero eigenvector exists only when the shifted transformation is singular." }
    ],
    "eigen-compute": [
        { math: "A\\mathbf v=\\lambda\\mathbf v\\iff(A-\\lambda I)\\mathbf v=0", text: "An eigenvalue is a shift that makes the matrix erase at least one nonzero direction." },
        { math: "p(\\lambda)=\\det(A-\\lambda I)=0", text: "The characteristic polynomial locates exactly those singular shifts." },
        { math: "\\lambda^2-(\\operatorname{tr}A)\\lambda+\\det A=0", text: "For a two-by-two matrix, trace is the eigenvalue sum and determinant is their product." },
        { math: "(A-\\lambda I)\\mathbf v=0", text: "After finding each eigenvalue, solve its null-space equation to recover the invariant direction." }
    ],
    abstract: [
        { math: "\\mathbf u+\\mathbf v\\in V,\\quad c\\mathbf v\\in V", text: "Closure keeps addition and scaling inside the collection of objects." },
        { math: "T(a\\mathbf u+b\\mathbf v)=aT\\mathbf u+bT\\mathbf v", text: "A linear map preserves the two vector-space operations." },
        { math: "p(x),\\;f(t),\\;\\mathbf x\\in V", text: "Polynomials, functions, signals, and coordinate lists share the same reusable structure." }
    ],
    field: [
        { math: "s=L\\theta,\\quad a_{\\text{tangent}}=-g\\sin\\theta", text: "The unit circle shows sin theta as the vertical component that produces the pendulum's restoring acceleration." },
        { math: "\\ddot\\theta=-\\frac{g}{L}\\sin\\theta", text: "Divide tangential acceleration by the pendulum length to obtain angular acceleration." },
        { math: "\\dot\\theta=\\omega,\\quad\\dot\\omega=-\\frac{g}{L}\\sin\\theta", text: "Introduce angular velocity to turn the second-order equation into a first-order phase-space field." }
    ],
    pde: [
        { math: "T=T(x,t)", text: "The evolving state is an entire temperature profile, not one scalar trajectory." },
        { math: "T_{xx}(x,t)\\approx\\frac{T(x+h)-2T(x)+T(x-h)}{h^2}", text: "The second spatial derivative measures deviation from the local neighbor average." },
        { math: "T_t=\\alpha T_{xx}", text: "Local curvature determines the instantaneous flow of heat, coupling infinitely many nearby ODEs." }
    ],
    heat: [
        { math: "T(x,0)=\\sum_n b_n\\sin(nx)", text: "Decompose the initial profile into orthogonal spatial frequency modes." },
        { math: "\\frac{d}{dt}a_n(t)=-\\alpha n^2a_n(t)", text: "Each sine mode is an eigenfunction of the second derivative and evolves independently." },
        { math: "T(x,t)=\\sum_n b_ne^{-\\alpha n^2t}\\sin(nx)", text: "High frequencies decay quadratically faster, leaving a smooth low-frequency profile." }
    ],
    fourier: [
        { math: "e^{i\\theta}=\\cos\\theta+i\\sin\\theta", text: "A point on the unit circle packages cosine and sine as the horizontal and vertical coordinates of rotation." },
        { math: "c_n=\\int f(t)e^{-2\\pi int}\\,dt", text: "Counter-rotate by frequency n and average; matching rotation leaves a nonzero coefficient." },
        { math: "f(t)=\\sum_n c_ne^{2\\pi int}", text: "Add all rotating basis vectors tip-to-tail to reconstruct the signal or path." }
    ],
    complex: [
        { math: "(x,y)=(\\cos\\theta,\\sin\\theta),\\quad x^2+y^2=1", text: "A radius at angle theta lands on the unit circle; cosine is its horizontal coordinate and sine is its vertical coordinate." },
        { math: "\\sin\\theta=\\frac{y}{r},\\quad\\cos\\theta=\\frac{x}{r}", text: "The right triangle formed by projection gives the familiar ratios; on a unit circle r equals one." },
        { math: "e^{i\\theta}=\\cos\\theta+i\\sin\\theta", text: "Complex exponentiation records the same rotating radius, with real and imaginary parts equal to its two projections." },
        { math: "\\frac{d}{d\\theta}e^{i\\theta}=ie^{i\\theta}", text: "Multiplication by i turns the radius ninety degrees, making velocity tangent to the circle." }
    ],
    laplace: [
        { math: "F(s)=\\int_0^\\infty f(t)e^{-st}\\,dt", text: "Measure the signal against an exponential probe with decay and oscillation encoded by complex s." },
        { math: "\\mathcal L\\{f'\\}=sF(s)-f(0)", text: "Integration by parts converts time differentiation into multiplication plus the initial condition." },
        { math: "f'\\text{ or }f''\\quad\\longrightarrow\\quad\\text{algebra in }s", text: "Solve the transformed algebraic equation, then invert to recover time-domain modes, poles, and stability." }
    ],
    "laplace-use": [
        { math: "y''+ay'+by=g(t),\\quad y(0)=y_0,\\;y'(0)=v_0", text: "Start with an initial-value problem whose derivatives and forcing are coupled in time." },
        { math: "(s^2+as+b)Y(s)=G(s)+sy_0+v_0+ay_0", text: "Transform derivatives into powers of s while carrying the initial conditions into the algebraic equation." },
        { math: "Y(s)=\\sum_k\\frac{c_k}{s-p_k}", text: "Factor the denominator and use partial fractions to expose one pole p_k for each dynamical mode." },
        { math: "y(t)=\\sum_k c_ke^{p_kt}+\\text{forced response}", text: "Invert each standard pair; negative-real-part poles decay, imaginary parts oscillate, and positive-real-part poles grow." }
    ],
    "matrix-exp": [
        { math: "\\mathbf x(t+dt)\\approx(I+A\\,dt)\\mathbf x(t)", text: "A linear differential equation advances through one tiny transformation." },
        { math: "\\mathbf x(t)\\approx(I+A\\,t/n)^n\\mathbf x(0)", text: "Repeat the small update n times while shrinking its step size." },
        { math: "e^{At}=\\sum_{k=0}^{\\infty}\\frac{(At)^k}{k!}", text: "The limit is the matrix exponential; eigenvectors evolve independently by scalar exponentials." }
    ],
    network: [
        { math: "\\mathbf z^{(l)}=W^{(l)}\\mathbf a^{(l-1)}+\\mathbf b^{(l)}", text: "Each row of the weight matrix measures one learned feature and the bias shifts its threshold." },
        { math: "\\mathbf a^{(l)}=\\sigma(\\mathbf z^{(l)})", text: "A nonlinear activation gates the measured features." },
        { math: "\\mathbf a^{(L)}=f_{W^{(L)}}\\circ\\cdots\\circ f_{W^{(1)}}(\\mathbf x)", text: "Layer composition builds expressive feature hierarchies that cannot collapse into one linear map." }
    ],
    landscape: [
        { math: "\\nabla C=(\\partial C/\\partial\\theta_1,\\ldots,\\partial C/\\partial\\theta_n)", text: "The gradient collects one local sensitivity for every parameter and points uphill." },
        { math: "C(\\theta+\\Delta\\theta)\\approx C(\\theta)+\\nabla C\\cdot\\Delta\\theta", text: "The dot product predicts the first-order cost change for any proposed parameter step." },
        { math: "\\theta\\leftarrow\\theta-\\eta\\nabla C", text: "The negative gradient gives the steepest local decrease; eta controls how far that local prediction is trusted." }
    ],
    backprop: [
        { math: "\\delta^{(L)}=\\nabla_{\\mathbf a}C\\odot\\sigma'(\\mathbf z^{(L)})", text: "Start from output error and gate it by the local activation sensitivity." },
        { math: "\\delta^{(l)}=(W^{(l+1)T}\\delta^{(l+1)})\\odot\\sigma'(\\mathbf z^{(l)})", text: "Transpose weights distribute downstream responsibility backward; shared paths add." },
        { math: "\\frac{\\partial C}{\\partial W^{(l)}}=\\delta^{(l)}\\mathbf a^{(l-1)T}", text: "Combine the local error with the cached input activation to obtain every weight gradient at once." }
    ],
    "backprop-calculus": [
        { math: "z_j=\\sum_i w_{ji}a_i+b_j,\\quad a_j=\\sigma(z_j)", text: "Write one neuron's weighted input and activation as explicit intermediate variables in a computation graph." },
        { math: "\\frac{\\partial C}{\\partial w_{ji}}=\\frac{\\partial C}{\\partial a_j}\\frac{\\partial a_j}{\\partial z_j}\\frac{\\partial z_j}{\\partial w_{ji}}", text: "The chain rule multiplies the three local sensitivities along the weight-to-cost path." },
        { math: "\\frac{\\partial z_j}{\\partial w_{ji}}=a_i,\\quad\\frac{\\partial a_j}{\\partial z_j}=\\sigma'(z_j)", text: "The forward activation and local nonlinearity slope are the reusable ingredients for that edge's gradient." },
        { math: "\\delta_j=\\frac{\\partial C}{\\partial z_j},\\quad\\frac{\\partial C}{\\partial w_{ji}}=\\delta_j a_i", text: "Cache the downstream derivative as an error signal, then combine it with each incoming activation." },
        { math: "\\delta^{(l)}=(W^{(l+1)T}\\delta^{(l+1)})\\odot\\sigma'(z^{(l)})", text: "Vectorization simultaneously sums every downstream path and reuses the same reverse pass for all parameters." }
    ],
    tokens: [
        { math: "x_{1:T}\\mapsto(e_1,\\ldots,e_T)", text: "Tokenization turns text pieces into indices, then an embedding table turns each index into a vector." },
        { math: "p(x_{1:T})=\\prod_{t=1}^{T}p(x_t\\mid x_{<t})", text: "The chain rule of probability factors sequence likelihood into next-token predictions." },
        { math: "x_{t+1}\\sim\\operatorname{softmax}(z_t/\\tau)", text: "Sampling appends one token and changes the prefix that conditions every later distribution." }
    ],
    transformer: [
        { math: "\\mathbf h_0=\\text{token embedding}+\\text{position}", text: "Each token begins as a vector containing identity and positional information." },
        { math: "\\mathbf h_{l+1}=\\mathbf h_l+\\operatorname{Attention}(\\mathbf h_l)+\\operatorname{MLP}(\\cdot)", text: "Attention routes context and MLPs transform features while residual paths preserve the shared stream." },
        { math: "\\text{logits}=W_U\\mathbf h_{\\text{final}}", text: "Unembedding measures the final token state against every vocabulary direction before softmax." }
    ],
    attention: [
        { math: "Q=XW_Q,\\quad K=XW_K,\\quad V=XW_V", text: "Learned projections turn each token into a question, an address, and a candidate update." },
        { math: "S=QK^T/\\sqrt{d_k}+M", text: "Dot products score relevance, scaling controls variance, and the causal mask blocks forbidden future positions." },
        { math: "A=\\operatorname{softmax}(S),\\quad Y=AV", text: "Each score row becomes a probability distribution used to blend value vectors into a contextual update." }
    ],
    memory: [
        { math: "\\mathbf h=W_{in}\\mathbf x+\\mathbf b_{in}", text: "The expansion layer tests many learned feature directions in the residual stream." },
        { math: "\\mathbf g=\\phi(\\mathbf h)", text: "GELU or another nonlinearity gates which detected features are active." },
        { math: "\\Delta\\mathbf x=W_{out}\\mathbf g+\\mathbf b_{out}", text: "Active features write a superposed vector update back to the residual stream." }
    ],
    diffusion: [
        { math: "x_t=\\sqrt{\\bar\\alpha_t}x_0+\\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon", text: "The forward process mixes clean data with a scheduled amount of Gaussian noise." },
        { math: "\\varepsilon_\\theta(x_t,t,c)\\approx\\varepsilon", text: "A conditioned denoiser learns to estimate the noise or score at every time level." },
        { math: "x_T\\to x_{T-1}\\to\\cdots\\to x_0", text: "Generation composes many small reverse corrections; guidance steers them toward the text condition." }
    ]
};
