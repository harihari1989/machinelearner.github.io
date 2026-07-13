window.MathLectureGuides = {
    accumulation: {
        formula: "Read the integral as a running total. Moving the right boundary by a tiny amount adds a thin strip whose area is approximately height times width, so dividing by that width reveals the boundary height.",
        observe: "Watch the rectangles become thinner while their combined area stabilizes. The important change is not the number of pieces; it is the error shrinking as the largest piece width approaches zero.",
        check: "If the upper boundary moves twice as fast, which factor in the rate of accumulated area must change?"
    },
    tangent: {
        formula: "The numerator is an output change and the denominator is the input nudge that caused it. The derivative is the stable ratio approached by finite secant slopes, not a literal division by zero.",
        observe: "Track the second point as it approaches the first. The chord still uses two distinct points at every frame, while its orientation settles toward one local linear prediction.",
        check: "Why can two functions share the same value at a point but have different derivatives there?"
    },
    geometry: {
        formula: "Expanding a changed square, cube, or higher-dimensional box separates first-order slabs from corners containing two or more tiny factors. After division by the nudge, only the first-order pieces survive the limit.",
        observe: "Compare the long thin strips with the tiny corner. As the nudge contracts, the corner loses area quadratically while each strip loses area only linearly.",
        check: "For x cubed, how many first-order slabs appear, and why does that count become the coefficient 3?"
    },
    chain: {
        formula: "Each derivative is a local conversion factor: input change to intermediate change, then intermediate change to output change. Multiplying the factors converts end-to-end; contributions from separate paths add.",
        observe: "Follow the bright pulse through the dependency graph. At each node, imagine its amplitude being multiplied by that node's local slope before it continues.",
        check: "When one variable influences the loss through two downstream paths, why are those two gradient contributions added?"
    },
    growth: {
        formula: "An exponential turns equal additions in time into equal multiplications in value. Its derivative therefore has the same shape, scaled by a constant; choosing base e makes that constant exactly one.",
        observe: "Compare curve height with tangent steepness as the point moves right. They grow together, so the curve continually reproduces its own current scale.",
        check: "Why does a negative exponent produce decay while preserving the same proportional-rate rule?"
    },
    constraint: {
        formula: "The total differential adds the change contributed through every input. Remaining on the constraint forces that total to be zero, so one variable's motion must cancel the other's.",
        observe: "The point can move along the circle but not away from it. Its velocity is tangent to the curve and therefore perpendicular to the constraint gradient.",
        check: "What fails when the partial derivative in the denominator is zero, and what geometric situation does that indicate?"
    },
    limit: {
        formula: "Epsilon specifies the output accuracy demanded; delta is an input distance sufficient to guarantee it. The order of the quantifiers matters: every requested accuracy must receive a working input tolerance.",
        observe: "Imagine tightening the horizontal output band first, then shrinking the permitted input window until the graph inside it fits entirely in that band.",
        check: "Why is the value at the center point excluded when a limit only describes nearby behavior?"
    },
    curvature: {
        formula: "The linear term records slope; the quadratic term records how that slope itself changes. Its one-half factor compensates for differentiating a squared displacement twice.",
        observe: "Compare a tangent line with the curve over wider neighborhoods. Their separation grows like the square of the horizontal displacement when curvature is nonzero.",
        check: "How can the gradient be zero while the second derivative still distinguishes a minimum from a maximum?"
    },
    series: {
        formula: "Each coefficient is chosen so the polynomial's next derivative matches the target at the expansion point. Factorials undo the repeated multipliers produced by differentiating powers.",
        observe: "Watch higher odd orders cling to sine over a wider interval. Local derivative agreement improves first near the center and only then farther away.",
        check: "Why can matching every derivative at one point still fail to reconstruct some functions away from that point?"
    },
    "local-map": {
        formula: "A derivative is the linear map whose error becomes negligible relative to the input nudge. In one dimension it is a scale factor; in many dimensions it becomes a Jacobian matrix.",
        observe: "Mentally zoom into the highlighted neighborhood. Curvature becomes less visible, leaving an almost uniform stretch, flip, or collapse.",
        check: "What does a zero derivative say about the best first-order map, and what information might second order restore?"
    },
    vectors: {
        formula: "Coordinates are instructions for scaling chosen basis directions and adding the results. The geometric vector is the final displacement; its coordinate list changes when the basis changes.",
        observe: "Read each colored basis arrow as one reusable direction, then complete the parallelogram to see component-wise addition become geometric motion.",
        check: "Which properties of addition and scaling let the same vector language describe pixels, gradients, and physical forces?"
    },
    span: {
        formula: "The coefficients are free choices. Varying them sweeps every reachable linear combination; dependence means one listed direction can already be built from the others.",
        observe: "Imagine both coefficients sliding. Independent directions cover a plane, while aligned directions only move back and forth along one line.",
        check: "How can adding another vector leave the span unchanged?"
    },
    transform: {
        formula: "Each matrix column is where one basis vector lands. A general input is already a combination of basis vectors, so linearity sends it to the same combination of transformed columns.",
        observe: "Follow the two basis arrows first, then the grid. Straight parallel lines remain straight and parallel because every point obeys the same linear combination rule.",
        check: "Why is knowing the transformed basis enough to predict the image of every vector?"
    },
    composition: {
        formula: "The rightmost matrix acts first. Matrix multiplication packages the columns produced after the second transformation is applied to the first transformation's columns.",
        observe: "Picture the grid moving through two stages. Swapping those stages usually changes the final orientation, exposing why multiplication order matters.",
        check: "Under what special geometric conditions might two transformation matrices commute?"
    },
    transform3d: {
        formula: "Three columns specify the images of the three basis directions. Their linear combinations move every point in space and determine how an infinitesimal cube is stretched, sheared, or flattened.",
        observe: "Use the three arrows as the edges of a transformed unit box. If they fall into one plane, all input volume collapses to zero.",
        check: "What matrix property tells you whether the three-dimensional transformation can be reversed?"
    },
    area: {
        formula: "The determinant is the signed scale factor for oriented area or volume. Magnitude measures stretch, a negative sign records orientation reversal, and zero means dimensional collapse.",
        observe: "Track the unit square as its basis edges shear. Ordinary area changes continuously, while the sign flips only when the shape passes through zero area.",
        check: "Why does a shear that slides one edge parallel to the other preserve determinant magnitude?"
    },
    subspaces: {
        formula: "The column space contains every possible matrix output. The null space contains inputs erased to zero; rank and nullity divide the input dimensions into visible and lost directions.",
        observe: "Watch a grid flatten toward a line. Multiple input points now share one output because their differences lie in the null space.",
        check: "How does a nontrivial null space make an inverse impossible?"
    },
    dimensions: {
        formula: "An m-by-n matrix accepts n coordinates and returns m coordinates. Its rank counts independent output directions, bounded by both the input and output dimensions.",
        observe: "Treat the columns as vectors living in the output space. Even many input coordinates cannot span more independent output directions than that space contains.",
        check: "For a tall matrix with independent columns, what can be unique even though a two-sided inverse does not exist?"
    },
    projection: {
        formula: "The dot product with a unit direction is the signed length of a projection. Multiplying that scalar by the direction reconstructs the projected vector itself.",
        observe: "Drop a perpendicular from the moving vector to the reference line. The shadow length grows with alignment and vanishes at a right angle.",
        check: "Why must the reference vector's length be divided out when it is not a unit vector?"
    },
    cross: {
        formula: "The cross product packages an oriented parallelogram area into a perpendicular vector. Its magnitude is base times perpendicular height, and the right-hand rule chooses the sign direction.",
        observe: "Rotate one input toward the other. The spanned area shrinks while the normal keeps tracking the orientation of their plane.",
        check: "Why does swapping the two input vectors negate the cross product?"
    },
    duality3d: {
        formula: "A linear signed-volume measurement of a third vector can be represented by a dot product with one special vector. That representing vector is the cross product of the first two.",
        observe: "See the gold normal as a compact encoding of the oriented base area. Projecting a third vector onto it supplies the missing height and sign.",
        check: "How does this dual view explain both perpendicularity and magnitude at once?"
    },
    cramer: {
        formula: "Replacing one matrix column with the target creates an area or volume whose determinant isolates the matching solution coordinate. Dividing by the original determinant normalizes by the basis volume.",
        observe: "Compare the original basis parallelogram with the one containing the target vector. Their signed area ratio reads one coordinate directly.",
        check: "Why does Cramer's rule break down precisely when the determinant is zero?"
    },
    basis: {
        formula: "A change-of-basis matrix translates coordinates between two languages for the same vector. Similar matrices describe one transformation in different coordinate systems, not different underlying actions.",
        observe: "Hold the vector fixed while the coordinate grid moves. Its numeric components change because the unit directions used to describe it have changed.",
        check: "Which quantities of a linear transformation remain unchanged under a mere change of basis?"
    },
    eigen: {
        formula: "An eigenvector is sent to a scalar multiple of itself. Subtracting that scalar times the identity asks for a nonzero vector in a null space, which requires a zero determinant.",
        observe: "Most arrows rotate under the transformation; the highlighted eigen-directions remain on their original lines and only stretch, shrink, or reverse.",
        check: "Why do eigenvectors make repeated application of a matrix much easier to understand?"
    },
    abstract: {
        formula: "Vector-space axioms retain only addition and scalar multiplication. Once those rules hold, basis, dimension, linear maps, and eigen-behavior apply to functions or polynomials just as they do to arrows.",
        observe: "Treat each object in the side panel as a possible vector. Ask what adding two objects and scaling one object mean, rather than looking for a physical arrow.",
        check: "What structure is lost if the allowed set is not closed under addition or scalar multiplication?"
    },
    field: {
        formula: "A differential equation assigns a velocity to every state. A solution curve is special because its tangent agrees with that assigned velocity at every point along the curve.",
        observe: "Follow a particle that repeatedly reads the nearby arrow and takes a small step. Smaller steps reduce the numerical mismatch between the polygonal path and the true trajectory.",
        check: "How can one direction field contain an entire family of solutions?"
    },
    pde: {
        formula: "A partial differential equation evolves a whole function, not a single state vector. Spatial derivatives couple neighboring locations while the time derivative records how the profile changes.",
        observe: "Focus on one point and its neighbors. Local curvature determines whether information flows into or out of that point as the full curve evolves.",
        check: "Why are boundary and initial conditions needed in addition to the differential equation?"
    },
    heat: {
        formula: "Each spatial sine mode is an eigenfunction of the second derivative. Its amplitude decays exponentially at a rate proportional to frequency squared, so fine detail disappears first.",
        observe: "Compare the fast-decaying ripples with the slow broad wave. Smoothing is the unequal decay of frequency components, not a separate averaging trick.",
        check: "Why does doubling a mode's spatial frequency make it decay four times as fast?"
    },
    fourier: {
        formula: "Complex exponentials form rotating basis directions indexed by frequency. Fourier coefficients say how much of each direction is needed, while superposition adds them into the signal.",
        observe: "Watch the rotating arrows add tip-to-tail. The endpoint traces the reconstructed waveform because every frequency contributes simultaneously.",
        check: "What do coefficient magnitude and phase control separately?"
    },
    complex: {
        formula: "Euler's formula turns complex exponentiation into rotation. Differentiation multiplies by the imaginary frequency, rotating velocity by a quarter turn and producing circular or oscillatory motion.",
        observe: "Follow the rotating vector and compare its position with its tangent velocity. The velocity remains perpendicular and proportional in magnitude.",
        check: "How do the real and imaginary coordinates recover cosine and sine solutions?"
    },
    laplace: {
        formula: "The transform measures a signal against decaying complex exponentials. Differentiation in time becomes multiplication by the transform variable, turning many differential equations into algebraic equations.",
        observe: "Read each fading curve as a probe with a different decay and oscillation. Strong alignment produces a larger transformed response.",
        check: "Where do initial conditions enter when transforming a time derivative?"
    },
    "matrix-exp": {
        formula: "The matrix exponential sums every repeated power of the generator. It is the limit of infinitely many tiny linear updates and therefore advances a linear system continuously in time.",
        observe: "Compare the flow arrows with the spiral trajectory. The local matrix action is repeated everywhere, and its eigenstructure controls growth, decay, and rotation.",
        check: "Why does a diagonal matrix make the matrix exponential reduce to ordinary scalar exponentials?"
    },
    network: {
        formula: "Each layer first applies an affine map and then a nonlinear activation. Matrix rows define neuron detectors, biases shift their thresholds, and nonlinearity prevents the whole stack from collapsing into one matrix.",
        observe: "Follow the moving activation pulse from pixels to hidden features to output. Edge strengths decide how much evidence reaches the next neuron.",
        check: "What expressive power would be lost if every activation function were the identity?"
    },
    landscape: {
        formula: "The gradient contains one partial derivative per parameter and points toward steepest local increase. Subtracting it takes the most rapidly decreasing first-order step, scaled by the learning rate.",
        observe: "Watch the parameter point move across contour lines. Closely spaced contours imply a steeper slope, while curved valleys can make one global step size difficult.",
        check: "Why can a very large learning rate increase loss even when the gradient direction is correct locally?"
    },
    backprop: {
        formula: "The downstream error is multiplied by transposed weights to distribute responsibility backward, then gated elementwise by the activation derivative. Shared upstream nodes sum responsibility from every outgoing path.",
        observe: "Reverse the visual flow: prediction error reaches later edges first, then spreads toward earlier neurons in proportion to both influence and local sensitivity.",
        check: "Why are forward activations cached for use during the backward pass?"
    },
    tokens: {
        formula: "The joint probability of a sequence factors into a product of next-token probabilities conditioned on the prefix. Generation repeatedly samples one factor and appends its outcome to the next prefix.",
        observe: "Trace the pipeline from token identity to embedding, contextual representation, logits, and normalized probabilities. Each sampled token changes every later conditional distribution.",
        check: "How does temperature alter sampling without retraining the probability model?"
    },
    transformer: {
        formula: "The final residual representation is multiplied by an unembedding matrix to produce one logit per vocabulary item. Earlier attention and MLP blocks repeatedly read from and write to that same information stream.",
        observe: "Follow one token vector through alternating routing and feature-transformation blocks. Residual additions preserve an identity path while each block contributes an update.",
        check: "Why are logits converted with softmax only after the model has produced relative scores for the whole vocabulary?"
    },
    attention: {
        formula: "Queries compare with keys through dot products, scaling controls variance, masking removes forbidden positions, and softmax turns scores into weights used to mix value vectors.",
        observe: "Read each heat-map row as one token's retrieval plan. Bright cells identify sources receiving more weight, and each row sums to one after softmax.",
        check: "Why can two heads learn different relations even when they read the same residual stream?"
    },
    memory: {
        formula: "The input matrix tests many feature directions, the nonlinearity gates their responses, and the output matrix converts active features into vectors written back to the residual stream.",
        observe: "Treat the middle neurons as conditional switches rather than isolated facts. Several can activate together, and their output directions superpose into one update.",
        check: "Why does superposition make single-neuron interpretations incomplete?"
    },
    diffusion: {
        formula: "The forward equation mixes clean data with Gaussian noise according to a time-dependent schedule. A learned reverse process estimates how to remove the appropriate noise at each step.",
        observe: "Scan the stages from noise toward structure. Each transition makes a small conditioned correction, allowing global composition to emerge from local denoising decisions.",
        check: "What different roles do the noise schedule, denoiser, and text conditioning play during sampling?"
    }
};
