(() => {
    'use strict';

    const microgradCore = `import math

class Value:
    """A scalar value plus the local rule needed for reverse-mode autodiff."""
    def __init__(self, data, children=(), op="", label=""):
        self.data = float(data)
        self.grad = 0.0
        self._prev = set(children)
        self._op = op
        self.label = label
        self._backward = lambda: None

    @staticmethod
    def wrap(value):
        return value if isinstance(value, Value) else Value(value)

    def __add__(self, other):
        other = Value.wrap(other)
        out = Value(self.data + other.data, (self, other), "+")
        def backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = backward
        return out

    def __mul__(self, other):
        other = Value.wrap(other)
        out = Value(self.data * other.data, (self, other), "*")
        def backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = backward
        return out

    def __pow__(self, exponent):
        out = Value(self.data ** exponent, (self,), f"**{exponent}")
        def backward():
            self.grad += exponent * self.data ** (exponent - 1) * out.grad
        out._backward = backward
        return out

    def exp(self):
        out = Value(math.exp(self.data), (self,), "exp")
        def backward():
            self.grad += out.data * out.grad
        out._backward = backward
        return out

    def log(self):
        out = Value(math.log(self.data), (self,), "log")
        def backward():
            self.grad += out.grad / self.data
        out._backward = backward
        return out

    def tanh(self):
        result = math.tanh(self.data)
        out = Value(result, (self,), "tanh")
        def backward():
            self.grad += (1.0 - result * result) * out.grad
        out._backward = backward
        return out

    def relu(self):
        out = Value(max(0.0, self.data), (self,), "relu")
        def backward():
            self.grad += (self.data > 0) * out.grad
        out._backward = backward
        return out

    def backward(self):
        order, visited = [], set()
        def build(node):
            if node not in visited:
                visited.add(node)
                for parent in node._prev:
                    build(parent)
                order.append(node)
        build(self)
        self.grad = 1.0
        for node in reversed(order):
            node._backward()

    def __neg__(self): return self * -1
    def __sub__(self, other): return self + (-Value.wrap(other))
    def __rsub__(self, other): return Value.wrap(other) + (-self)
    def __truediv__(self, other): return self * Value.wrap(other) ** -1
    def __rtruediv__(self, other): return Value.wrap(other) * self ** -1
    def __radd__(self, other): return self + other
    def __rmul__(self, other): return self * other
    def __repr__(self):
        return f"Value(data={self.data:.5f}, grad={self.grad:.5f})"
`;

    const microgradNetwork = `${microgradCore}
import random

class Neuron:
    def __init__(self, inputs, nonlinear=True):
        self.w = [Value(random.uniform(-1, 1)) for _ in range(inputs)]
        self.b = Value(0.0)
        self.nonlinear = nonlinear

    def __call__(self, x):
        activation = sum((wi * xi for wi, xi in zip(self.w, x)), self.b)
        return activation.tanh() if self.nonlinear else activation

    def parameters(self):
        return self.w + [self.b]

class Layer:
    def __init__(self, inputs, outputs, nonlinear=True):
        self.neurons = [Neuron(inputs, nonlinear) for _ in range(outputs)]

    def __call__(self, x):
        return [neuron(x) for neuron in self.neurons]

    def parameters(self):
        return [p for neuron in self.neurons for p in neuron.parameters()]

class MLP:
    def __init__(self, inputs, widths):
        sizes = [inputs] + widths
        self.layers = [Layer(sizes[i], sizes[i + 1], i < len(widths) - 1)
                       for i in range(len(widths))]

    def __call__(self, x):
        for layer in self.layers:
            x = layer(x)
        return x

    def parameters(self):
        return [p for layer in self.layers for p in layer.parameters()]

    def zero_grad(self):
        for p in self.parameters():
            p.grad = 0.0
`;

    const examples = {
        core: {
            goal: 'Goal: read Python as a data pipeline.',
            bridge: 'PyTorch bridge: names bind tensors/modules, functions define forward computations, and loops organize batches and epochs.',
            challenges: [
                'Predict every printed value and type before running.',
                'Change the threshold and explain which branch changes.',
                'Wrap the loop in a function that returns the readings.'
            ],
            code: `temperature = 21.5
is_warm = temperature > 20
label = "warm" if is_warm else "cool"

readings = []
for hour in range(3):
    adjusted = temperature + 0.5 * hour
    readings.append(adjusted)
    print(f"hour {hour}: {adjusted:.1f}°C → {label}")

print("types:", type(readings).__name__, type(readings[0]).__name__)
print("mean:", sum(readings) / len(readings))`
        },
        numpy: {
            goal: 'Goal: reason about tensor shape, strides, dtype, views, and broadcasting.',
            bridge: 'PyTorch bridge: torch.Tensor follows the same shape algebra while adding devices and automatic differentiation.',
            challenges: [
                'Change X from three rows to four and update no other line.',
                'Predict the shape of X[:, :1] and explain why bias broadcasts.',
                'Transpose X and compare its shape and strides.'
            ],
            code: `import numpy as np

# Three examples, two features per example.
X = np.array([[1.0, 2.0],
              [2.0, 0.5],
              [-1.0, 3.0]], dtype=np.float32)
W = np.array([[0.6, -0.2],
              [0.1,  0.8]], dtype=np.float32)
bias = np.array([0.4, -0.1], dtype=np.float32)

scores = X @ W + bias
view = X[:, :1]

print("X shape / dtype:", X.shape, X.dtype)
print("X strides (bytes):", X.strides)
print("W shape:", W.shape)
print("scores shape:", scores.shape)
print("broadcast result:\\n", np.round(scores, 3))
print("slice is a view:", np.shares_memory(X, view))`
        },
        autograd: {
            goal: 'Goal: build a dynamic computation graph and run reverse-mode autodiff.',
            bridge: 'PyTorch bridge: Tensor operations create grad_fn nodes; backward performs the same reverse topological chain rule at tensor scale.',
            challenges: [
                'Derive dy/da on paper and compare it with a.grad.',
                'Reuse a value twice in the graph and verify that gradients add.',
                'Add sigmoid using only exp, add, and division.'
            ],
            code: `${microgradCore}
a = Value(-4.0, label="a")
b = Value(2.0, label="b")
c = a * b + b ** 3
y = (c / 5.0).tanh()
y.backward()

print("forward y:", round(y.data, 6))
print("dy/da:", round(a.grad, 6))
print("dy/db:", round(b.grad, 6))
print("graph nodes carry data + grad + local backward")`
        },
        neuron: {
            goal: 'Goal: express a neuron as differentiable scalar operations.',
            bridge: 'PyTorch bridge: nn.Linear stores the weights and bias; an activation module supplies the nonlinear operation.',
            challenges: [
                'Compute the pre-activation by hand.',
                'Change tanh to ReLU and explain which gradients disappear.',
                'Take one gradient-descent step on every parameter.'
            ],
            code: `${microgradCore}
x = [2.0, -1.0]
w = [Value(-0.5, label="w0"), Value(1.0, label="w1")]
b = Value(0.25, label="bias")
target = 0.8

activation = sum((wi * xi for wi, xi in zip(w, x)), b)
prediction = activation.tanh()
loss = (prediction - target) ** 2
loss.backward()

print("activation:", round(activation.data, 5))
print("prediction:", round(prediction.data, 5))
print("loss:", round(loss.data, 5))
for parameter in w + [b]:
    print(parameter.label, "gradient =", round(parameter.grad, 5))`
        },
        mlp: {
            goal: 'Goal: compose neurons into modules and train every parameter with backpropagation.',
            bridge: 'PyTorch bridge: parameters() recursively finds registered nn.Parameter objects; zero_grad, backward, and step form the same loop.',
            challenges: [
                'Print the parameter count and derive it from layer widths.',
                'Remove one hidden layer and compare convergence.',
                'Replace tanh with ReLU and retune the learning rate.'
            ],
            code: `${microgradNetwork}
random.seed(7)
X = [[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]]
targets = [-1.0, 1.0, 1.0, -1.0]  # XOR encoded for tanh
model = MLP(2, [4, 4, 1])

for step in range(121):
    predictions = [model(row)[0] for row in X]
    loss = sum((prediction - target) ** 2
               for prediction, target in zip(predictions, targets)) / len(X)
    model.zero_grad()
    loss.backward()
    learning_rate = 0.08 if step < 70 else 0.035
    for parameter in model.parameters():
        parameter.data -= learning_rate * parameter.grad
    if step % 30 == 0:
        print(f"step {step:3d} | loss {loss.data:.5f}")

final = [model(row)[0].data for row in X]
print("parameters:", len(model.parameters()))
print("targets:    ", targets)
print("predictions:", [round(value, 3) for value in final])`
        },
        optimizers: {
            goal: 'Goal: see how optimizer state changes the same gradient signal.',
            bridge: 'PyTorch bridge: torch.optim objects hold momentum/moment state and mutate Parameters during step().',
            challenges: [
                'Increase the learning rate until plain SGD oscillates.',
                'Set both Adam beta values to zero and identify the resulting behavior.',
                'Plot each trajectory by writing values into _lesson_plot.'
            ],
            code: `import math

def loss(w):
    return (w - 4.0) ** 2 + 0.2 * math.sin(3.0 * w)

def grad(w):
    return 2.0 * (w - 4.0) + 0.6 * math.cos(3.0 * w)

def run(name, steps=60, lr=0.12):
    w, velocity, first, second = -3.0, 0.0, 0.0, 0.0
    beta1, beta2 = 0.9, 0.999
    for t in range(1, steps + 1):
        g = grad(w)
        if name == "SGD":
            update = g
        elif name == "Momentum":
            velocity = 0.9 * velocity + g
            update = velocity
        else:
            first = beta1 * first + (1 - beta1) * g
            second = beta2 * second + (1 - beta2) * g * g
            m_hat = first / (1 - beta1 ** t)
            v_hat = second / (1 - beta2 ** t)
            update = m_hat / (math.sqrt(v_hat) + 1e-8)
        step_size = 0.3 if name == "Adam" else lr
        w -= step_size * update
    return w, loss(w)

for optimizer in ("SGD", "Momentum", "Adam"):
    final_w, final_loss = run(optimizer)
    print(f"{optimizer:8s} w={final_w: .4f} loss={final_loss:.5f}")`
        },
        attention: {
            goal: 'Goal: construct causal scaled dot-product self-attention from matrix operations.',
            bridge: 'PyTorch bridge: F.scaled_dot_product_attention fuses this score, mask, softmax, and value aggregation path when possible.',
            challenges: [
                'Remove the scale factor and compare how sharp the probabilities become.',
                'Change the causal mask into a full-attention mask.',
                'Add a second head with independent projection matrices.'
            ],
            code: `import numpy as np

rng = np.random.default_rng(3)
tokens, width = 4, 6
x = rng.normal(size=(tokens, width))
Wq = rng.normal(scale=0.35, size=(width, width))
Wk = rng.normal(scale=0.35, size=(width, width))
Wv = rng.normal(scale=0.35, size=(width, width))

q, k, v = x @ Wq, x @ Wk, x @ Wv
scores = q @ k.T / np.sqrt(width)
causal_mask = np.triu(np.ones((tokens, tokens), dtype=bool), k=1)
scores = np.where(causal_mask, -np.inf, scores)

shifted = scores - np.max(scores, axis=-1, keepdims=True)
weights = np.exp(shifted)
weights /= weights.sum(axis=-1, keepdims=True)
context = weights @ v

print("attention weights (rows sum to one):")
print(np.round(weights, 3))
print("row sums:", weights.sum(axis=-1))
print("context shape:", context.shape)
print("future weight above diagonal:", weights[causal_mask].sum())`
        },
        transformer: {
            goal: 'Goal: assemble normalization, causal attention, residual paths, and an MLP into one Transformer block.',
            bridge: 'PyTorch bridge: Module parameters wrap these matrices; autograd supplies every backward rule; SDPA selects optimized attention kernels.',
            challenges: [
                'Delete each residual connection separately and compare output statistics.',
                'Change the MLP expansion from 4× to 2×.',
                'Split q, k, and v into two heads and concatenate the results.'
            ],
            code: `import numpy as np

rng = np.random.default_rng(11)
time, width = 5, 8
x = rng.normal(size=(time, width))

def layer_norm(z, eps=1e-5):
    mean = z.mean(axis=-1, keepdims=True)
    variance = ((z - mean) ** 2).mean(axis=-1, keepdims=True)
    return (z - mean) / np.sqrt(variance + eps)

def softmax(z):
    z = z - np.max(z, axis=-1, keepdims=True)
    values = np.exp(z)
    return values / values.sum(axis=-1, keepdims=True)

def gelu(z):
    return 0.5 * z * (1 + np.tanh(np.sqrt(2 / np.pi) *
           (z + 0.044715 * z ** 3)))

Wq, Wk, Wv, Wo = [rng.normal(scale=0.25, size=(width, width))
                    for _ in range(4)]
hidden = 4 * width
W1 = rng.normal(scale=0.2, size=(width, hidden))
W2 = rng.normal(scale=0.2, size=(hidden, width))

normalized = layer_norm(x)
q, k, v = normalized @ Wq, normalized @ Wk, normalized @ Wv
scores = q @ k.T / np.sqrt(width)
scores[np.triu_indices(time, k=1)] = -np.inf
attention = softmax(scores) @ v
x = x + attention @ Wo
x = x + gelu(layer_norm(x) @ W1) @ W2

print("block output shape:", x.shape)
print("per-token means:", np.round(x.mean(axis=-1), 3))
print("per-token norms:", np.round(np.linalg.norm(x, axis=-1), 3))`
        },
        minigpt: {
            goal: 'Goal: train the smallest autoregressive language model and generate one character at a time.',
            bridge: 'PyTorch bridge: GPT replaces this bigram table with a Transformer that makes logits depend on the entire causal context.',
            challenges: [
                'Increase the corpus and inspect which transitions improve.',
                'Change temperature during generation.',
                'Explain why this bigram cannot distinguish two contexts ending in the same character.'
            ],
            code: `import numpy as np

text = ("to be or not to be, that is the question.\\n" * 8)
chars = sorted(set(text))
to_id = {char: i for i, char in enumerate(chars)}
to_char = {i: char for char, i in to_id.items()}
x = np.array([to_id[a] for a, _ in zip(text, text[1:])])
y = np.array([to_id[b] for _, b in zip(text, text[1:])])
vocab = len(chars)

rng = np.random.default_rng(5)
W = rng.normal(scale=0.01, size=(vocab, vocab))
m = np.zeros_like(W)
v = np.zeros_like(W)

for step in range(241):
    logits = W[x]
    logits -= logits.max(axis=1, keepdims=True)
    probs = np.exp(logits)
    probs /= probs.sum(axis=1, keepdims=True)
    loss = -np.log(probs[np.arange(len(y)), y] + 1e-12).mean()
    grad_logits = probs
    grad_logits[np.arange(len(y)), y] -= 1
    grad_logits /= len(y)
    grad_W = np.zeros_like(W)
    np.add.at(grad_W, x, grad_logits)
    m = 0.9 * m + 0.1 * grad_W
    v = 0.999 * v + 0.001 * grad_W ** 2
    t = step + 1
    W -= 0.08 * (m / (1 - 0.9 ** t)) / (np.sqrt(v / (1 - 0.999 ** t)) + 1e-8)
    if step % 80 == 0:
        print(f"step {step:3d} | cross-entropy {loss:.4f}")

token = to_id["t"]
generated = [to_char[token]]
for _ in range(70):
    logits = W[token] / 0.7
    probabilities = np.exp(logits - logits.max())
    probabilities /= probabilities.sum()
    token = rng.choice(vocab, p=probabilities)
    generated.append(to_char[token])

print("generated:\\n" + "".join(generated))
print("limitation: a bigram reads one token; GPT attention reads a context")`
        },
        sampling: {
            goal: 'Goal: separate model logits from the decoding policy used at inference.',
            bridge: 'PyTorch bridge: divide logits by temperature, mask outside the candidate set, apply softmax, then use torch.multinomial.',
            challenges: [
                'Set temperature near zero and describe the limit.',
                'Compare top-k=2 with top-p=0.8.',
                'Add a repetition penalty before filtering.'
            ],
            code: `import numpy as np

tokens = np.array(["the", "a", "model", "cat", "runs", "thinks"])
logits = np.array([2.2, 1.4, 1.1, 0.8, 0.3, -0.2])
rng = np.random.default_rng(9)

def softmax(values):
    values = values - values.max()
    probs = np.exp(values)
    return probs / probs.sum()

def filtered_probs(logits, temperature=1.0, top_k=None, top_p=None):
    scaled = logits / max(temperature, 1e-6)
    keep = np.ones(len(scaled), dtype=bool)
    if top_k is not None:
        keep[np.argsort(scaled)[:-top_k]] = False
    if top_p is not None:
        order = np.argsort(scaled)[::-1]
        ordered_probs = softmax(scaled[order])
        remove = np.cumsum(ordered_probs) - ordered_probs > top_p
        keep[order[remove]] = False
    return softmax(np.where(keep, scaled, -np.inf))

for label, kwargs in [
    ("temperature 0.5", {"temperature": 0.5}),
    ("top-k 3", {"top_k": 3}),
    ("top-p 0.80", {"top_p": 0.80}),
]:
    probs = filtered_probs(logits, **kwargs)
    choice = rng.choice(tokens, p=probs)
    pairs = [(token, round(prob, 3)) for token, prob in zip(tokens, probs) if prob > 0]
    print(label, "→", pairs, "sample:", choice)`
        },
        churn: {
            goal: 'Goal: train and evaluate a customer-churn classifier without leaking test statistics.',
            bridge: 'PyTorch bridge: the matrix operations become nn.Linear, BCEWithLogitsLoss, an optimizer, and batched tensors.',
            project: 'Retention triage for a subscription service',
            dataset: '240 synthetic customer histories · 4 features · binary churn',
            skill: 'Train-only preprocessing and classification metrics',
            deliverable: 'A held-out metric card plus an intervention caveat',
            watchFor: 'accuracy can hide missed churners, and prediction does not prove which retention action will work',
            challenges: [
                'Fit the mean and scale on all rows and explain why that leaks information.',
                'Tune the decision threshold for a stated retention budget.',
                'Add a cohort metric for new customers with tenure below six months.'
            ],
            code: `import numpy as np

rng = np.random.default_rng(21)
n = 240
tenure = rng.integers(1, 73, n)
tickets = rng.poisson(2.2, n)
usage_change = rng.normal(-0.04, 0.22, n)
monthly_cost = rng.normal(68, 18, n)
X = np.column_stack((tenure, tickets, usage_change, monthly_cost))

# Synthetic ground truth: short tenure, support friction, falling use, and
# higher cost all raise churn risk.
true_logit = (-0.055 * (tenure - 24) + 0.38 * tickets
              - 3.2 * usage_change + 0.025 * (monthly_cost - 68) - 1.0)
probability = 1 / (1 + np.exp(-true_logit))
y = (rng.random(n) < probability).astype(float)

order = rng.permutation(n)
train_idx, test_idx = order[:180], order[180:]
X_train, X_test = X[train_idx], X[test_idx]
y_train, y_test = y[train_idx], y[test_idx]

# Learn preprocessing from training customers only.
mean = X_train.mean(axis=0)
scale = X_train.std(axis=0) + 1e-8
X_train = (X_train - mean) / scale
X_test = (X_test - mean) / scale
X_train = np.column_stack((np.ones(len(X_train)), X_train))
X_test = np.column_stack((np.ones(len(X_test)), X_test))

weights = np.zeros(X_train.shape[1])
for step in range(700):
    logits = np.clip(X_train @ weights, -30, 30)
    predictions = 1 / (1 + np.exp(-logits))
    gradient = X_train.T @ (predictions - y_train) / len(y_train)
    weights -= 0.12 * gradient

test_prob = 1 / (1 + np.exp(-np.clip(X_test @ weights, -30, 30)))
test_pred = test_prob >= 0.50
tp = int(((test_pred == 1) & (y_test == 1)).sum())
fp = int(((test_pred == 1) & (y_test == 0)).sum())
fn = int(((test_pred == 0) & (y_test == 1)).sum())
accuracy = (test_pred == y_test).mean()
precision = tp / max(tp + fp, 1)
recall = tp / max(tp + fn, 1)

print("train/test rows:", len(X_train), len(X_test))
print("held-out churn rate:", round(y_test.mean(), 3))
print(f"accuracy={accuracy:.3f} precision={precision:.3f} recall={recall:.3f}")
print("learned standardized weights:", np.round(weights, 2))
print("decision note: rank risk first; test retention actions causally")`
        },
        demand: {
            goal: 'Goal: forecast future demand with lagged features and a chronological evaluation boundary.',
            bridge: 'PyTorch bridge: a Windowed Dataset can emit lag tensors for a linear model, MLP, RNN, or dilated temporal network.',
            project: 'Daily staffing forecast for a service operation',
            dataset: '180 synthetic days · trend, weekly seasonality, promotions',
            skill: 'Lag engineering, chronological splits, and baseline comparison',
            deliverable: 'A leakage-safe MAE comparison against last week',
            watchFor: 'random splitting lets future seasonal regimes influence the past',
            challenges: [
                'Replace the chronological split with a random split and explain the misleading comparison.',
                'Remove lag 7 and measure how much weekly structure it carried.',
                'Report MAE separately for promotion and non-promotion days.'
            ],
            code: `import numpy as np

rng = np.random.default_rng(8)
days = np.arange(180)
promotion = ((days % 29) == 0).astype(float)
demand = (95 + 0.18 * days + 13 * np.sin(2 * np.pi * days / 7)
          + 20 * promotion + rng.normal(0, 3.5, len(days)))

rows, targets, target_day = [], [], []
for day in range(14, len(days)):
    rows.append([demand[day - 1], demand[day - 7], demand[day - 14],
                 promotion[day], day])
    targets.append(demand[day])
    target_day.append(day)
X = np.asarray(rows)
y = np.asarray(targets)
target_day = np.asarray(target_day)

# Every target before day 140 is training evidence; every later target is future.
train = target_day < 140
test = ~train
mean, scale = X[train].mean(axis=0), X[train].std(axis=0) + 1e-8
X_scaled = (X - mean) / scale
design = np.column_stack((np.ones(len(X_scaled)), X_scaled))
ridge = 0.8 * np.eye(design.shape[1])
ridge[0, 0] = 0.0
weights = np.linalg.solve(design[train].T @ design[train] + ridge,
                          design[train].T @ y[train])
forecast = design[test] @ weights
baseline = X[test, 1]  # same weekday last week

mae = lambda actual, predicted: np.abs(actual - predicted).mean()
print("train through day:", int(target_day[train][-1]))
print("test days:", int(target_day[test][0]), "to", int(target_day[test][-1]))
print(f"last-week baseline MAE: {mae(y[test], baseline):.2f}")
print(f"lagged ridge model MAE: {mae(y[test], forecast):.2f}")
print("first five forecasts:", np.round(forecast[:5], 1))
print("split rule: models the real direction of time")`
        },
        fraud: {
            goal: 'Goal: choose a classification threshold from business cost rather than accuracy alone.',
            bridge: 'PyTorch bridge: model logits create scores; threshold selection is a separate validation-time decision policy.',
            project: 'Fraud review queue with asymmetric mistakes',
            dataset: '800 synthetic transactions · about 5% fraud',
            skill: 'Confusion matrices, imbalance, and cost-sensitive thresholds',
            deliverable: 'A threshold recommendation with explicit cost assumptions',
            watchFor: 'the cheapest threshold changes when investigation capacity or fraud loss changes',
            challenges: [
                'Double the false-positive review cost and recompute the policy.',
                'Constrain review volume to at most 10% of transactions.',
                'Compare the selected policy with the threshold that maximizes accuracy.'
            ],
            code: `import random

random.seed(12)
transactions = []
for _ in range(800):
    fraud = random.random() < 0.05
    # Imperfect score: the two distributions overlap.
    center = 0.67 if fraud else 0.22
    score = min(0.99, max(0.01, random.gauss(center, 0.18)))
    transactions.append((score, fraud))

false_positive_cost = 8       # analyst review and customer friction
false_negative_cost = 400     # expected unrecovered fraud loss

def evaluate(threshold):
    tp = fp = tn = fn = 0
    for score, actual in transactions:
        predicted = score >= threshold
        tp += predicted and actual
        fp += predicted and not actual
        tn += (not predicted) and (not actual)
        fn += (not predicted) and actual
    cost = fp * false_positive_cost + fn * false_negative_cost
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    return cost, tp, fp, tn, fn, precision, recall

candidates = [step / 100 for step in range(5, 96, 5)]
best_threshold = min(candidates, key=lambda value: evaluate(value)[0])
cost, tp, fp, tn, fn, precision, recall = evaluate(best_threshold)
accuracy_cost = evaluate(0.50)

print("fraud prevalence:", round(sum(y for _, y in transactions) / len(transactions), 3))
print("selected threshold:", best_threshold)
print("confusion matrix: TP", tp, "FP", fp, "TN", tn, "FN", fn)
print(f"precision={precision:.3f} recall={recall:.3f} expected_cost={cost}")
print("cost at threshold 0.50:", accuracy_cost[0])
print("policy depends on review cost, loss, and operational capacity")`
        },
        diagnostics: {
            goal: 'Goal: diagnose saturation and imbalanced gradient flow using layerwise measurements.',
            bridge: 'PyTorch bridge: forward hooks inspect activations and parameter.grad records the backward signal after loss.backward().',
            project: 'Training-health review for a sensor anomaly network',
            dataset: '64 synthetic sensor windows · 24 measurements',
            skill: 'Activation saturation and gradient-balance diagnostics',
            deliverable: 'A layerwise health table and initialization recommendation',
            watchFor: 'a falling loss can coexist with dead, saturated, or highly imbalanced layers',
            challenges: [
                'Add ReLU and record the fraction of exactly zero activations.',
                'Increase network depth and compare the first-layer gradient norm.',
                'Implement one BatchNorm forward pass and re-run the report.'
            ],
            code: `import numpy as np

rng = np.random.default_rng(4)
X = rng.normal(size=(64, 24))
target = rng.normal(size=(64, 8))
widths = [24, 48, 48, 48, 8]

def health_report(label, gain):
    weights = [rng.normal(scale=gain / np.sqrt(fan_in), size=(fan_in, fan_out))
               for fan_in, fan_out in zip(widths, widths[1:])]
    activations = [X]
    preactivations = []
    for weight in weights:
        z = activations[-1] @ weight
        preactivations.append(z)
        activations.append(np.tanh(z))

    gradient = 2 * (activations[-1] - target) / target.size
    gradient_norms = []
    for layer in reversed(range(len(weights))):
        gradient = gradient * (1 - np.tanh(preactivations[layer]) ** 2)
        gradient_norms.append(np.linalg.norm(activations[layer].T @ gradient))
        gradient = gradient @ weights[layer].T
    gradient_norms.reverse()

    print("\\n" + label)
    for index, (activation, gradient_norm) in enumerate(zip(activations[1:], gradient_norms), 1):
        saturated = np.mean(np.abs(activation) > 0.97)
        print(f"layer {index}: act_std={activation.std():.3f} "
              f"saturated={saturated:5.1%} grad_norm={gradient_norm:.5f}")

health_report("overscaled initialization (gain=4.0)", 4.0)
health_report("Xavier-style initialization (gain=1.0)", 1.0)
print("diagnosis: compare every layer; saturation distorts gradient balance")`
        },
        bpe: {
            goal: 'Goal: learn byte-pair-style merges and inspect how a domain vocabulary emerges.',
            bridge: 'PyTorch bridge: token IDs index an embedding table; the tokenizer is a versioned model dependency, not preprocessing trivia.',
            project: 'Tokenizer prototype for customer-support requests',
            dataset: 'Repeated domain phrases plus an unseen request',
            skill: 'Vocabulary learning, merge application, and compression trade-offs',
            deliverable: 'A merge list and before/after tokenization card',
            watchFor: 'compression frequency does not guarantee semantic quality or equal behavior across languages',
            challenges: [
                'Add multilingual words and compare token counts by language.',
                'Train merges on one product area and test a different one.',
                'Reserve the base byte vocabulary and explain why unseen text remains representable.'
            ],
            code: `from collections import Counter

corpus = ("account reset account locked reset password "
          "account recovery password reset support ticket "
          "reset account access account access ") * 4
vocabulary = Counter(tuple(word) + ("</w>",) for word in corpus.split())

def pair_counts(vocab):
    counts = Counter()
    for symbols, frequency in vocab.items():
        for pair in zip(symbols, symbols[1:]):
            counts[pair] += frequency
    return counts

def merge_pair(vocab, pair):
    merged = Counter()
    for symbols, frequency in vocab.items():
        output, index = [], 0
        while index < len(symbols):
            if index + 1 < len(symbols) and tuple(symbols[index:index + 2]) == pair:
                output.append(symbols[index] + symbols[index + 1])
                index += 2
            else:
                output.append(symbols[index])
                index += 1
        merged[tuple(output)] += frequency
    return merged

merges = []
for _ in range(12):
    counts = pair_counts(vocabulary)
    if not counts:
        break
    pair, frequency = counts.most_common(1)[0]
    merges.append(pair)
    vocabulary = merge_pair(vocabulary, pair)
    print(f"merge {pair} seen {frequency} times")

def encode(word):
    symbols = list(word) + ["</w>"]
    for pair in merges:
        output, index = [], 0
        while index < len(symbols):
            if index + 1 < len(symbols) and tuple(symbols[index:index + 2]) == pair:
                output.append(symbols[index] + symbols[index + 1])
                index += 2
            else:
                output.append(symbols[index])
                index += 1
        symbols = output
    return symbols

for word in ("account", "reset", "recovery", "unseen"):
    print(word, "→", encode(word))
print("base symbols preserve coverage; merges improve domain compression")`
        },
        scaling: {
            goal: 'Goal: estimate GPT parameters, training-state memory, KV cache, and idealized step time.',
            bridge: 'PyTorch bridge: model parameters, optimizer states, activations, precision, and distributed sharding determine the real memory budget.',
            project: 'Feasibility plan for reproducing a decoder-only model',
            dataset: 'Three architecture configurations and explicit systems assumptions',
            skill: 'Parameter accounting and order-of-magnitude resource estimation',
            deliverable: 'A reproducible scaling budget with assumptions',
            watchFor: 'idealized arithmetic omits allocator overhead, temporary buffers, communication, and achieved hardware utilization',
            challenges: [
                'Untie the output embedding and measure the added parameters.',
                'Add activation checkpointing as a stated activation-memory factor.',
                'Estimate data-parallel versus fully sharded per-device state.'
            ],
            code: `def gpt_parameters(layers, width, vocab, context):
    embeddings = vocab * width + context * width
    transformer = layers * (12 * width * width + 13 * width)
    final_norm = 2 * width
    return embeddings + transformer + final_norm  # output weights are tied

def gib(bytes_value):
    return bytes_value / 1024 ** 3

configs = [
    ("teaching GPT", 6, 384, 10_000, 256, 8),
    ("GPT-2 124M", 12, 768, 50_257, 1024, 4),
    ("wider study", 24, 1024, 50_257, 2048, 2),
]

for name, layers, width, vocab, context, batch in configs:
    parameters = gpt_parameters(layers, width, vocab, context)
    # Mixed-precision Adam estimate: 2-byte weights + 2-byte gradients +
    # 4-byte master weights + two 4-byte optimizer moments.
    training_state = parameters * 16
    kv_cache = 2 * layers * batch * context * width * 2
    tokens_per_step = batch * context
    ideal_flops = 6 * parameters * tokens_per_step
    ideal_seconds_at_40tflops = ideal_flops / 40e12
    print(f"{name:13s} params={parameters / 1e6:7.1f}M "
          f"train_state={gib(training_state):5.2f}GiB "
          f"KV={gib(kv_cache):4.2f}GiB ideal_step={ideal_seconds_at_40tflops:6.3f}s")

print("assumptions: tied embeddings, Adam, mixed precision, 40 TFLOP/s achieved")
print("real runs also budget activations, temporary buffers, and communication")`
        }
    };

    const architectures = {
        mlp: {
            family: 'Dense feed-forward',
            title: 'Multilayer perceptron (MLP)',
            intuition: 'Every output feature can mix every input feature. Nonlinear activations let stacked affine maps form curved decision boundaries.',
            shape: '[batch, features] → [batch, classes]',
            use: 'Tabular baselines, projections, heads, and feature mixing.',
            blocks: 'Linear · GELU/ReLU · normalization · dropout',
            caution: 'Dense mixing ignores spatial and sequential structure unless features encode it.',
            code: `class MLP(nn.Module):
    def __init__(self, d_in, d_hidden, d_out):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d_in, d_hidden),
            nn.GELU(),
            nn.Linear(d_hidden, d_out),
        )

    def forward(self, x):
        return self.net(x)`
        },
        cnn: {
            family: 'Local spatial processing',
            title: 'Convolutional neural network (CNN)',
            intuition: 'A small learned kernel scans every location, sharing weights so the same feature can be recognized wherever it appears.',
            shape: '[B, channels, height, width] → feature maps / logits',
            use: 'Images, spectrograms, grids, and signals with local translation structure.',
            blocks: 'Conv1d/2d/3d · activation · pooling · normalization',
            caution: 'Receptive field, downsampling, padding, and channel order must match the task.',
            code: `class CNN(nn.Module):
    def __init__(self, classes):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
        )
        self.head = nn.Linear(64, classes)

    def forward(self, x):
        return self.head(self.features(x).flatten(1))`
        },
        resnet: {
            family: 'Residual convolutional',
            title: 'Residual network (ResNet)',
            intuition: 'A block learns a change to the identity path. The shortcut gives signals and gradients a direct route through deep stacks.',
            shape: '[B, C, H, W] → [B, C, H, W] within a same-width block',
            use: 'Deep vision backbones and any stack that benefits from residual refinement.',
            blocks: 'Conv · normalization · activation · identity/projection shortcut',
            caution: 'Shape-changing blocks need a projection; normalization and activation order affect behavior.',
            code: `class ResidualBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.path = nn.Sequential(
            nn.Conv2d(channels, channels, 3, padding=1),
            nn.BatchNorm2d(channels), nn.ReLU(),
            nn.Conv2d(channels, channels, 3, padding=1),
            nn.BatchNorm2d(channels),
        )

    def forward(self, x):
        return torch.relu(x + self.path(x))`
        },
        rnn: {
            family: 'Recurrent sequence model',
            title: 'RNN, GRU, and LSTM',
            intuition: 'The model folds a sequence into a hidden state one step at a time. Gates in GRUs/LSTMs regulate what to retain, write, and expose.',
            shape: '[B, time, features] → [B, time, hidden] plus final state',
            use: 'Streaming, compact state, time series, and sequence tasks with stepwise constraints.',
            blocks: 'RNN/GRU/LSTM · packed sequences · projection head',
            caution: 'Sequential execution limits parallelism; padding, state resets, and hidden-state shapes are common failure points.',
            code: `class SequenceClassifier(nn.Module):
    def __init__(self, features, hidden, classes):
        super().__init__()
        self.rnn = nn.GRU(features, hidden, batch_first=True)
        self.head = nn.Linear(hidden, classes)

    def forward(self, x):
        _, final_state = self.rnn(x)
        return self.head(final_state[-1])`
        },
        autoencoder: {
            family: 'Latent-variable representation',
            title: 'Autoencoder and variational autoencoder',
            intuition: 'An encoder compresses an input into a latent code; a decoder reconstructs it. A VAE regularizes a distribution over codes for generative sampling.',
            shape: 'input x → latent z → reconstruction x_hat',
            use: 'Compression, denoising, anomaly signals, representation learning, and latent generation.',
            blocks: 'Encoder · bottleneck · decoder · reconstruction/KL objective',
            caution: 'A powerful decoder may ignore the latent; reconstruction quality alone does not guarantee useful representation.',
            code: `class Autoencoder(nn.Module):
    def __init__(self, width, latent):
        super().__init__()
        self.encode = nn.Sequential(nn.Linear(width, 128), nn.ReLU(),
                                    nn.Linear(128, latent))
        self.decode = nn.Sequential(nn.Linear(latent, 128), nn.ReLU(),
                                    nn.Linear(128, width))

    def forward(self, x):
        z = self.encode(x)
        return self.decode(z), z`
        },
        unet: {
            family: 'Encoder–decoder with skip features',
            title: 'U-Net',
            intuition: 'The encoder builds context while the decoder restores resolution. Skip connections recover precise local detail lost during downsampling.',
            shape: '[B, C, H, W] → [B, output_channels, H, W]',
            use: 'Segmentation, denoising, restoration, diffusion backbones, and dense prediction.',
            blocks: 'Down blocks · bottleneck · up blocks · channel-wise skip concatenation',
            caution: 'Spatial sizes must align at every skip; cropping, padding, and interpolation choices affect boundaries.',
            code: `class UpBlock(nn.Module):
    def __init__(self, low_channels, skip_channels, out_channels):
        super().__init__()
        self.conv = nn.Conv2d(low_channels + skip_channels,
                              out_channels, 3, padding=1)

    def forward(self, low, skip):
        low = F.interpolate(low, size=skip.shape[-2:],
                            mode="bilinear", align_corners=False)
        return F.relu(self.conv(torch.cat((low, skip), dim=1)))`
        },
        gnn: {
            family: 'Relational message passing',
            title: 'Graph neural network (GNN)',
            intuition: 'Nodes update their state by aggregating messages from neighbors, sharing one update rule across an irregular graph.',
            shape: '[nodes, features] + edge_index → [nodes, hidden/output]',
            use: 'Molecules, recommender graphs, networks, physical systems, and relational reasoning.',
            blocks: 'Message · aggregation · update · graph/node readout',
            caution: 'Graph batching, degree effects, oversmoothing, edge direction, and leakage through graph construction need explicit handling.',
            code: `class MeanMessagePassing(nn.Module):
    def __init__(self, width):
        super().__init__()
        self.update = nn.Linear(2 * width, width)

    def forward(self, nodes, adjacency):
        degree = adjacency.sum(-1, keepdim=True).clamp_min(1)
        neighbor_mean = adjacency @ nodes / degree
        return torch.relu(self.update(
            torch.cat((nodes, neighbor_mean), dim=-1)
        ))`
        },
        transformer: {
            family: 'Content-addressed sequence processing',
            title: 'Transformer encoder',
            intuition: 'Every token can retrieve a weighted mixture of other tokens, then transform the result with a position-wise MLP.',
            shape: '[B, time, width] → [B, time, width]',
            use: 'Bidirectional representations, classification, retrieval encoders, and multimodal fusion.',
            blocks: 'Embedding · multihead attention · MLP · residual · LayerNorm',
            caution: 'Mask semantics, padding, quadratic attention cost, and positional representation must be explicit.',
            code: `class Encoder(nn.Module):
    def __init__(self, width, heads, layers):
        super().__init__()
        block = nn.TransformerEncoderLayer(
            width, heads, 4 * width,
            batch_first=True, norm_first=True,
        )
        self.layers = nn.TransformerEncoder(block, layers)

    def forward(self, x, padding_mask=None):
        return self.layers(x, src_key_padding_mask=padding_mask)`
        },
        gpt: {
            family: 'Decoder-only autoregressive Transformer',
            title: 'GPT-style language model',
            intuition: 'Causal attention lets each token read only its prefix. The model learns one conditional next-token distribution and reuses it repeatedly to generate.',
            shape: 'token IDs [B, T] → vocabulary logits [B, T, V]',
            use: 'Text/code generation, completion, in-context learning, and autoregressive multimodal models.',
            blocks: 'Token/position embedding · causal attention · MLP · LM head',
            caution: 'Context length, tokenizer, data quality, sampling, KV-cache memory, and post-training define real system behavior.',
            code: `class GPTBlock(nn.Module):
    def __init__(self, width, heads):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(width), nn.LayerNorm(width)
        self.attn = CausalSelfAttention(width, heads)
        self.mlp = nn.Sequential(nn.Linear(width, 4 * width),
                                 nn.GELU(), nn.Linear(4 * width, width))

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        return x + self.mlp(self.ln2(x))`
        }
    };

    window.PyTorchCourseData = { examples, architectures };
})();
