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
        },
        nanogpt_batch: {
            goal: 'Goal: see exactly why a language-model target is the input stream shifted by one token.',
            bridge: 'nanoGPT bridge: get_batch slices block_size tokens for x and the immediately following tokens for y, then stacks B independent windows.',
            project: 'Inspect nanoGPT data preparation and batching',
            dataset: 'One synthetic token stream · 3 sampled windows · context 8',
            skill: 'Teacher-forcing alignment and tensor shape reasoning',
            deliverable: 'A plotted x/y alignment plus leakage test',
            watchFor: 'y must be shifted by one in the original stream; shifting by zero exposes the answer',
            challenges: [
                'Change block_size and derive the required source slice length.',
                'Add a start index at the last valid location and prove it stays in bounds.',
                'Explain why windows may overlap without violating causal masking.'
            ],
            code: `import numpy as np

stream = np.array([11, 4, 9, 2, 8, 8, 3, 7, 1, 6, 5, 10,
                   4, 2, 9, 0, 3, 8, 6, 1, 7, 5, 2, 4], dtype=np.int64)
block_size = 8
starts = [0, 6, 14]
x = np.stack([stream[i:i + block_size] for i in starts])
y = np.stack([stream[i + 1:i + 1 + block_size] for i in starts])

print("stream shape:", stream.shape)
print("batch x/y shapes:", x.shape, y.shape)
for row, start in enumerate(starts):
    print(f"row {row} start={start:2d} x={x[row].tolist()}")
    print(f"                 y={y[row].tolist()}")
print("alignment holds:", bool(np.all(x[:, 1:] == y[:, :-1])))

_lesson_plot = {
    "title": "One nanoGPT window: every target is the next token",
    "x": list(range(block_size)),
    "series": [
        {"label": "input x[t]", "y": x[0].tolist()},
        {"label": "target y[t]", "y": y[0].tolist()},
    ],
    "points": [{"x": 0, "y": int(y[0, 0]), "label": "predict this from x[0]"}],
}`
        },
        nanogpt_parameters: {
            goal: 'Goal: derive nanoGPT parameter count from vocabulary, context, width, and layer count.',
            bridge: 'PyTorch bridge: numel() counts registered Parameter entries; tied weights appear once because both modules reference the same Parameter.',
            project: 'Audit a GPT-2 124M-style configuration',
            dataset: 'V=50,304 · T=1,024 · L=12 · C=768 · bias disabled',
            skill: 'Transformer parameter accounting and weight tying',
            deliverable: 'A component budget that reconciles with model.parameters()',
            watchFor: 'activation memory and optimizer state are not model parameters',
            challenges: [
                'Enable every Linear and LayerNorm bias and add the missing terms.',
                'Untie the language head and measure the extra V×C matrix.',
                'Change MLP expansion from 4C to 8C and identify the dominant component.'
            ],
            code: `V, T, L, C = 50_304, 1_024, 12, 768

token_embedding = V * C
position_embedding = T * C
attention_per_layer = 3 * C * C + C * C
mlp_per_layer = C * (4 * C) + (4 * C) * C
norms_per_layer = 2 * C  # two scale vectors; bias=False
blocks = L * (attention_per_layer + mlp_per_layer + norms_per_layer)
final_norm = C
components = [token_embedding, position_embedding, blocks, final_norm]
labels = ["tied token/head", "position", "12 blocks", "final norm"]

running, cumulative = 0, []
for label, count in zip(labels, components):
    running += count
    cumulative.append(running / 1e6)
    print(f"{label:16s} {count / 1e6:8.3f}M")

print(f"registered total: {running / 1e6:.3f}M")
print(f"weight tying saves: {token_embedding / 1e6:.3f}M parameters")

_lesson_plot = {
    "title": "Cumulative nanoGPT parameter budget",
    "x": [1, 2, 3, 4],
    "series": [{"label": "millions of parameters", "y": cumulative}],
    "points": [{"x": 4, "y": cumulative[-1], "label": "total"}],
}`
        },
        nanogpt_forward: {
            goal: 'Goal: trace a nanoGPT forward pass and visualize one causal attention head.',
            bridge: 'PyTorch bridge: Embedding, Linear, LayerNorm, SDPA, GELU, residual addition, and the tied language head perform these same array operations.',
            project: 'Shape audit for a tiny decoder block',
            dataset: 'B=2 · T=5 · C=8 · H=2 · V=13 synthetic tensors',
            skill: 'Head reshaping, causal softmax, and residual contracts',
            deliverable: 'A complete shape trace and attention plot',
            watchFor: 'a transpose bug can preserve element count while changing the meaning of every axis',
            challenges: [
                'Remove the causal mask and find the first nonzero future attention weight.',
                'Change H from 2 to 4 and verify that C=H×D still holds.',
                'Add a second decoder block and confirm the residual shape never changes.'
            ],
            code: `import numpy as np

rng = np.random.default_rng(17)
B, T, C, H, V = 2, 5, 8, 2, 13
D = C // H
idx = rng.integers(0, V, size=(B, T))
token_embedding = rng.normal(scale=0.2, size=(V, C))
position_embedding = rng.normal(scale=0.2, size=(T, C))
W_qkv = rng.normal(scale=0.25, size=(C, 3 * C))
W_out = rng.normal(scale=0.25, size=(C, C))
W_up = rng.normal(scale=0.2, size=(C, 4 * C))
W_down = rng.normal(scale=0.2, size=(4 * C, C))
W_vocab = token_embedding.T  # tied token embedding / language head

def layer_norm(values, eps=1e-5):
    mean = values.mean(axis=-1, keepdims=True)
    variance = ((values - mean) ** 2).mean(axis=-1, keepdims=True)
    return (values - mean) / np.sqrt(variance + eps)

x = token_embedding[idx] + position_embedding[None, :, :]
qkv = layer_norm(x) @ W_qkv
q, k, v = np.split(qkv, 3, axis=-1)
reshape_heads = lambda z: z.reshape(B, T, H, D).transpose(0, 2, 1, 3)
q, k, v = map(reshape_heads, (q, k, v))
scores = q @ k.transpose(0, 1, 3, 2) / np.sqrt(D)
future = np.triu(np.ones((T, T), dtype=bool), k=1)
scores = np.where(future[None, None, :, :], -1e9, scores)
weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
weights /= weights.sum(axis=-1, keepdims=True)
context = weights @ v
context = context.transpose(0, 2, 1, 3).reshape(B, T, C)
x = x + context @ W_out
hidden = np.tanh(layer_norm(x) @ W_up) @ W_down
x = x + hidden
logits = layer_norm(x) @ W_vocab

print("idx:", idx.shape)
print("embedded stream:", (B, T, C))
print("q/k/v per head:", q.shape)
print("attention matrix:", weights.shape)
print("reassembled context:", context.shape)
print("vocabulary logits:", logits.shape)
print("future attention mass:", float(weights[..., future].sum()))

_lesson_plot = {
    "title": "Causal attention weights · batch 0, head 0",
    "x": list(range(T)),
    "series": [
        {"label": f"query {query}", "y": weights[0, 0, query].tolist()}
        for query in range(T)
    ],
}`
        },
        nanogpt_loss: {
            goal: 'Goal: connect next-token probability, per-token surprise, mean loss, and perplexity.',
            bridge: 'PyTorch bridge: F.cross_entropy(logits.view(-1,V), targets.view(-1)) computes a stable mean of these negative log probabilities.',
            project: 'Audit the language-model objective position by position',
            dataset: '8 positions · 7-token vocabulary · synthetic logits',
            skill: 'Cross-entropy and perplexity interpretation',
            deliverable: 'A token-level loss plot and aggregate perplexity',
            watchFor: 'perplexity is exponential in mean natural-log loss and is only comparable under the same tokenizer/data domain',
            challenges: [
                'Increase one correct-target logit by 2 and measure only that position’s loss change.',
                'Give every vocabulary item equal logits and derive perplexity analytically.',
                'Mask one target with ignore_index logic and recompute the correct mean.'
            ],
            code: `import numpy as np

rng = np.random.default_rng(23)
T, V = 8, 7
logits = rng.normal(size=(T, V))
targets = np.array([1, 4, 3, 0, 6, 2, 5, 1])
logits[np.arange(T), targets] += np.linspace(0.3, 2.0, T)

shifted = logits - logits.max(axis=-1, keepdims=True)
probabilities = np.exp(shifted)
probabilities /= probabilities.sum(axis=-1, keepdims=True)
target_probability = probabilities[np.arange(T), targets]
token_loss = -np.log(target_probability + 1e-12)
mean_loss = token_loss.mean()
perplexity = np.exp(mean_loss)

for position in range(T):
    print(f"t={position} target={targets[position]} "
          f"p={target_probability[position]:.3f} loss={token_loss[position]:.3f}")
print(f"mean cross-entropy={mean_loss:.3f} perplexity={perplexity:.3f}")

_lesson_plot = {
    "title": "Next-token loss reveals the difficult positions",
    "x": list(range(T)),
    "series": [{"label": "negative log p(target)", "y": token_loss.tolist()}],
    "points": [{"x": int(token_loss.argmax()), "y": float(token_loss.max()), "label": "hardest token"}],
}`
        },
        nanogpt_accumulation: {
            goal: 'Goal: prove that scaled microbatch gradients reproduce one larger mean gradient.',
            bridge: 'nanoGPT bridge: loss/gradient_accumulation_steps followed by repeated backward calls accumulates one logical update while controlling activation memory.',
            project: 'Verify nanoGPT gradient accumulation arithmetic',
            dataset: '8 regression examples · 4 equal microbatches',
            skill: 'Gradient reductions, accumulation, and effective token batch size',
            deliverable: 'An equivalence error plot and token/update calculation',
            watchFor: 'unequal microbatch sizes require weighting by example/token count, not blindly dividing by the number of microsteps',
            challenges: [
                'Make the last microbatch smaller and repair the weighting.',
                'Remove the division by A and measure the gradient scale factor.',
                'Add world_size to the effective batch calculation and explain DDP averaging.'
            ],
            code: `import numpy as np

X = np.array([[1.0, 0.2], [1.0, 0.8], [1.0, 1.2], [1.0, 1.8],
              [1.0, 2.1], [1.0, 2.8], [1.0, 3.2], [1.0, 3.9]])
y = np.array([0.5, 1.1, 1.6, 2.3, 2.8, 3.6, 4.0, 4.9])
w = np.array([0.1, 0.4])

def mean_gradient(features, targets):
    error = features @ w - targets
    return 2 * features.T @ error / len(features)

full_gradient = mean_gradient(X, y)
microbatches = np.array_split(np.arange(len(X)), 4)
accumulated = np.zeros_like(w)
errors = []
for micro_step, indices in enumerate(microbatches, 1):
    accumulated += mean_gradient(X[indices], y[indices]) / len(microbatches)
    error = np.linalg.norm(accumulated - full_gradient)
    errors.append(error)
    print(f"microstep {micro_step}: accumulated={np.round(accumulated, 4)} "
          f"distance_to_full={error:.6f}")

batch_size, block_size, accumulation, world_size = 2, 128, 4, 2
tokens = batch_size * block_size * accumulation * world_size
print("full gradient:", np.round(full_gradient, 6))
print("final equality:", np.allclose(accumulated, full_gradient))
print("effective tokens/update:", tokens)

_lesson_plot = {
    "title": "Accumulated gradient converges to the full-batch gradient",
    "x": [1, 2, 3, 4],
    "series": [{"label": "distance to full gradient", "y": errors}],
    "points": [{"x": 4, "y": errors[-1], "label": "equivalent update"}],
}`
        },
        nanogpt_schedule: {
            goal: 'Goal: visualize nanoGPT’s linear warmup, cosine decay, and minimum learning-rate floor.',
            bridge: 'PyTorch bridge: nanoGPT assigns the computed scalar to every optimizer param_group; an equivalent scheduler can encapsulate the same rule.',
            project: 'Review an optimizer learning-rate policy',
            dataset: '100 optimizer steps · 10-step warmup',
            skill: 'Piecewise schedules and optimizer-step semantics',
            deliverable: 'A schedule plot with boundary tests',
            watchFor: 'the schedule advances per optimizer update, not per accumulation microbatch',
            challenges: [
                'Double warmup length without changing the decay endpoint.',
                'Set min_lr to zero and compare the final quarter.',
                'Convert the x-axis from optimizer steps to processed tokens.'
            ],
            code: `import math

max_lr = 6e-4
min_lr = 6e-5
warmup_iters = 10
decay_iters = 100

def get_lr(step):
    if step < warmup_iters:
        return max_lr * (step + 1) / (warmup_iters + 1)
    if step > decay_iters:
        return min_lr
    ratio = (step - warmup_iters) / (decay_iters - warmup_iters)
    coefficient = 0.5 * (1 + math.cos(math.pi * ratio))
    return min_lr + coefficient * (max_lr - min_lr)

steps = list(range(0, 111))
rates = [get_lr(step) for step in steps]
print("first lr:", f"{rates[0]:.7f}")
print("warmup peak:", f"{rates[warmup_iters]:.7f}")
print("decay end:", f"{rates[decay_iters]:.7f}")
print("after decay:", f"{rates[-1]:.7f}")

_lesson_plot = {
    "title": "nanoGPT warmup + cosine learning-rate schedule (×10⁴)",
    "x": steps,
    "series": [{"label": "learning rate ×10⁴", "y": [rate * 1e4 for rate in rates]}],
    "points": [
        {"x": warmup_iters, "y": rates[warmup_iters] * 1e4, "label": "warmup ends"},
        {"x": decay_iters, "y": rates[decay_iters] * 1e4, "label": "floor"},
    ],
}`
        },
        nanogpt_optimizer: {
            goal: 'Goal: understand nanoGPT’s AdamW parameter groups and decoupled weight decay.',
            bridge: 'PyTorch bridge: AdamW accepts param_group dictionaries with independent weight_decay values and optional fused CUDA execution.',
            project: 'Audit which GPT parameters should decay',
            dataset: 'Representative nanoGPT parameter names and shapes',
            skill: 'Optimizer grouping and decoupled regularization',
            deliverable: 'A decay/no-decay inventory plus norm trajectory',
            watchFor: 'embedding and matrix weights decay; bias and LayerNorm vectors do not in nanoGPT’s dimensionality rule',
            challenges: [
                'Add a scalar Parameter and predict its group.',
                'Set weight_decay to zero and confirm the trajectories coincide.',
                'Explain why tied embedding/head weight appears only once in named_parameters().'
            ],
            code: `parameters = {
    "transformer.wte.weight": (50_304, 768),
    "transformer.wpe.weight": (1_024, 768),
    "transformer.h.0.ln_1.weight": (768,),
    "transformer.h.0.attn.c_attn.weight": (2_304, 768),
    "transformer.h.0.attn.c_proj.weight": (768, 768),
    "transformer.h.0.mlp.c_fc.weight": (3_072, 768),
    "transformer.h.0.mlp.c_proj.weight": (768, 3_072),
}

decay = [name for name, shape in parameters.items() if len(shape) >= 2]
no_decay = [name for name, shape in parameters.items() if len(shape) < 2]
print("decay group:")
for name in decay:
    print("  ", name)
print("no-decay group:")
for name in no_decay:
    print("  ", name)

# Isolate AdamW's decoupled decay effect after the adaptive update.
learning_rate, weight_decay, adaptive_update = 0.05, 0.1, 0.02
matrix_weight = norm_weight = 1.0
matrix_history, norm_history = [], []
for _ in range(30):
    matrix_weight = (matrix_weight - learning_rate * adaptive_update) * (1 - learning_rate * weight_decay)
    norm_weight = norm_weight - learning_rate * adaptive_update
    matrix_history.append(abs(matrix_weight))
    norm_history.append(abs(norm_weight))

print("final decayed matrix magnitude:", round(matrix_weight, 4))
print("final non-decayed norm magnitude:", round(norm_weight, 4))

_lesson_plot = {
    "title": "Decoupled AdamW decay changes matrix-weight magnitude",
    "x": list(range(1, 31)),
    "series": [
        {"label": "matrix / embedding", "y": matrix_history},
        {"label": "norm / bias", "y": norm_history},
    ],
}`
        },
        nanogpt_sampling: {
            goal: 'Goal: visualize how temperature and top-k transform one fixed logit vector.',
            bridge: 'nanoGPT bridge: divide final-position logits by temperature, mask below the kth value, softmax, then torch.multinomial.',
            project: 'Tune an autoregressive decoder policy',
            dataset: '8 candidate token logits from one fictional prompt',
            skill: 'Temperature, top-k filtering, entropy, and sampling',
            deliverable: 'A probability comparison with an explicit diversity trade-off',
            watchFor: 'temperature must be positive; filtering occurs on logits before softmax',
            challenges: [
                'Approach temperature zero and explain the limiting distribution.',
                'Change top-k from 3 to 1 and compare with greedy decoding.',
                'Add nucleus top-p filtering and compare the candidate set.'
            ],
            code: `import numpy as np

tokens = ["the", "a", "model", "system", "user", "runs", "learns", "fails"]
logits = np.array([2.4, 1.7, 1.25, 0.9, 0.4, 0.1, -0.2, -0.8])

def probabilities(temperature=1.0, top_k=None):
    values = logits / temperature
    if top_k is not None:
        threshold = np.sort(values)[-top_k]
        values = np.where(values < threshold, -np.inf, values)
    values = values - np.max(values)
    weights = np.exp(values)
    return weights / weights.sum()

cold = probabilities(0.5)
neutral = probabilities(1.0)
warm = probabilities(1.5)
top3 = probabilities(1.0, top_k=3)

def entropy(p):
    positive = p[p > 0]
    return float(-(positive * np.log(positive)).sum())

for label, p in [("temp 0.5", cold), ("temp 1.0", neutral),
                 ("temp 1.5", warm), ("top-k 3", top3)]:
    print(label, "entropy=", round(entropy(p), 3),
          "top=", tokens[int(np.argmax(p))], round(float(p.max()), 3))

_lesson_plot = {
    "title": "Temperature redistributes probability; top-k removes candidates",
    "x": list(range(len(tokens))),
    "series": [
        {"label": "temperature 0.5", "y": cold.tolist()},
        {"label": "temperature 1.0", "y": neutral.tolist()},
        {"label": "temperature 1.5", "y": warm.tolist()},
        {"label": "top-k 3", "y": top3.tolist()},
    ],
}`
        },
        nanogpt_cache: {
            goal: 'Goal: quantify the repeated attention-score work in nanoGPT’s uncached generation loop.',
            bridge: 'PyTorch bridge: original GPT.generate recomputes the cropped prefix; a production decoder can pass per-layer past K/V tensors and process only the newest token.',
            project: 'Capacity estimate for token-by-token inference',
            dataset: 'Prompt length 16 · generate 32 tokens · one representative layer/head factor removed',
            skill: 'Autoregressive complexity and KV-cache memory/compute trade-offs',
            deliverable: 'A cumulative score-work comparison and cache boundary statement',
            watchFor: 'a KV cache reduces repeated projection/attention work but consumes memory that grows with layers, batch, context, and width',
            challenges: [
                'Double prompt length and compare the final work ratio.',
                'Add a finite block_size and show when the uncached curve changes regime.',
                'Estimate KV bytes for L=12, B=4, T=1024, C=768 in bf16.'
            ],
            code: `prompt_tokens = 16
new_tokens = 32
steps = list(range(1, new_tokens + 1))

uncached_cumulative = []
cached_cumulative = []
uncached_total = cached_total = 0
for step in steps:
    context = prompt_tokens + step - 1
    # nanoGPT recomputes a full T×T attention score grid per layer/head.
    uncached_total += context * context
    # A KV cache scores only the new query against the cached prefix.
    cached_total += context
    uncached_cumulative.append(uncached_total)
    cached_cumulative.append(cached_total)

ratio = uncached_total / cached_total
layers, batch, context, width, bytes_per_value = 12, 4, 1024, 768, 2
kv_bytes = 2 * layers * batch * context * width * bytes_per_value
print("cumulative uncached score entries:", uncached_total)
print("cumulative cached score entries:", cached_total)
print("work ratio at 32 generated tokens:", round(ratio, 1), "x")
print("example bf16 KV cache:", round(kv_bytes / 1024**2, 1), "MiB")
print("source fact: nanoGPT generate() has no past-key-value cache")

_lesson_plot = {
    "title": "Cumulative attention-score work during generation",
    "x": steps,
    "series": [
        {"label": "nanoGPT recompute", "y": uncached_cumulative},
        {"label": "KV-cached decoder", "y": cached_cumulative},
    ],
    "points": [{"x": steps[-1], "y": uncached_cumulative[-1], "label": f"{ratio:.1f}× score work"}],
}`
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
