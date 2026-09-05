package io.github.machinelearner;

import java.util.Objects;

public final class LearningDestination {
    private final String chapterId;
    private final String anchorId;
    private final String title;
    private final String subtitle;

    public LearningDestination(String chapterId, String anchorId, String title, String subtitle) {
        this.chapterId = Objects.requireNonNull(chapterId);
        this.anchorId = Objects.requireNonNull(anchorId);
        this.title = Objects.requireNonNull(title);
        this.subtitle = Objects.requireNonNull(subtitle);
    }

    public String getChapterId() {
        return chapterId;
    }

    public String getAnchorId() {
        return anchorId;
    }

    public String getTitle() {
        return title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public String getDisplayLabel() {
        return title + "\n" + subtitle;
    }
}
