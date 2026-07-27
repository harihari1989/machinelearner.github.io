package io.github.machinelearner;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public final class LearningCatalog {
    private static final List<LearningDestination> DESTINATIONS = Collections.unmodifiableList(Arrays.asList(
            new LearningDestination("foundations", "ai-categories", "Foundations", "AI, vectors, probability, and optimization"),
            new LearningDestination("math-deep-dive", "math-atlas", "Math Deep Dive", "Calculus, algebra, probability, and proofs"),
            new LearningDestination("ml", "ml-intro", "Machine Learning", "Algorithms, workflows, and evaluation"),
            new LearningDestination("kaggle-ml", "kaggle-ml-roadmap", "Practical ML Lab", "Seven guided pandas and scikit-learn projects"),
            new LearningDestination("neural", "neural-network", "Neural Networks", "Backpropagation and transformer intuition"),
            new LearningDestination("python", "python-mental-model", "Python for ML", "Python, NumPy, PyTorch, and nanoGPT"),
            new LearningDestination("llm-foundations", "llm-tutorial", "Large Language Models", "Transformers, prompting, retrieval, and agents"),
            new LearningDestination("reasoning-planning", "rp-roadmap", "Reasoning & Planning", "Causality, calibration, memory, and plans"),
            new LearningDestination("reinforcement-learning", "rl-fundamentals", "Reinforcement Learning", "Bandits, value methods, and deep RL"),
            new LearningDestination("notebook", "ipython-notebook", "Notebook Lab", "Editable Python exercises and ONNX inference")
    ));

    private LearningCatalog() {
    }

    public static List<LearningDestination> all() {
        return DESTINATIONS;
    }

    public static int indexOfChapter(String chapterId) {
        if (chapterId == null) return 0;
        for (int index = 0; index < DESTINATIONS.size(); index += 1) {
            if (DESTINATIONS.get(index).getChapterId().equals(chapterId)) return index;
        }
        return 0;
    }

    public static LearningDestination at(int index) {
        int safeIndex = Math.max(0, Math.min(index, DESTINATIONS.size() - 1));
        return DESTINATIONS.get(safeIndex);
    }
}
