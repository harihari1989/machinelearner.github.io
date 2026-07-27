package io.github.machinelearner;

import org.junit.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public final class LearningCatalogTest {
    @Test
    public void catalogContainsTheFullLearningJourney() {
        List<LearningDestination> destinations = LearningCatalog.all();
        assertEquals(10, destinations.size());
        assertEquals("foundations", destinations.get(0).getChapterId());
        assertEquals("notebook", destinations.get(destinations.size() - 1).getChapterId());
    }

    @Test
    public void chapterIdsAndAnchorsAreUnique() {
        Set<String> chapters = new HashSet<>();
        Set<String> anchors = new HashSet<>();
        for (LearningDestination destination : LearningCatalog.all()) {
            assertTrue(chapters.add(destination.getChapterId()));
            assertTrue(anchors.add(destination.getAnchorId()));
            assertFalse(destination.getTitle().isEmpty());
            assertFalse(destination.getSubtitle().isEmpty());
        }
    }

    @Test
    public void lookupAndBoundsHaveSafeFallbacks() {
        assertEquals(5, LearningCatalog.indexOfChapter("python"));
        assertEquals(0, LearningCatalog.indexOfChapter("missing"));
        assertEquals("foundations", LearningCatalog.at(-3).getChapterId());
        assertEquals("notebook", LearningCatalog.at(99).getChapterId());
    }
}
