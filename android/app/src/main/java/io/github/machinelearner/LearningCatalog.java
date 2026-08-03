package io.github.machinelearner;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public final class LearningCatalog {
    private static final List<LearningDestination> DESTINATIONS = Collections.unmodifiableList(Arrays.asList(
            new LearningDestination("foundations", "learning-roadmap", "Start Here", "The seven-step learning path"),
            new LearningDestination("math-deep-dive", "math-atlas", "Math Foundations", "Vectors, gradients, probability, and loss"),
            new LearningDestination("python", "python-mental-model", "Python & PyTorch", "Code, arrays, tensors, and training"),
            new LearningDestination("ml", "ml-intro", "Machine Learning", "Algorithms, evaluation, and inference"),
            new LearningDestination("kaggle-ml", "kaggle-ml-roadmap", "Practice Project", "Build and validate a housing model"),
            new LearningDestination("neural", "neural-network", "Neural Networks", "One neuron through sequence models"),
            new LearningDestination("llm-foundations", "transformer-map", "Transformers", "Attention, GPT, and the research path")
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

    public static boolean containsChapter(String chapterId) {
        if (chapterId == null) return false;
        for (LearningDestination destination : DESTINATIONS) {
            if (destination.getChapterId().equals(chapterId)) return true;
        }
        return false;
    }

    public static LearningDestination at(int index) {
        int safeIndex = Math.max(0, Math.min(index, DESTINATIONS.size() - 1));
        return DESTINATIONS.get(safeIndex);
    }
}
