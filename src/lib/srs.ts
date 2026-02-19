export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSData {
    interval: number; // Days until next review
    repetition: number; // Number of successful reviews
    efactor: number; // Easiness Factor (SM-2 standard: starts at 2.5)
    dueDate: number; // Timestamp
}

/**
 * Enhanced SM-2 Algorithm
 * Inputs: Current SRS state + Rating
 * Output: New SRS state
 */
export const calculateReview = (
    current: SRSData | undefined,
    rating: ReviewRating
): SRSData => {
    // Default initial state
    const prev = current || {
        interval: 0,
        repetition: 0,
        efactor: 2.5,
        dueDate: Date.now()
    };

    let newInterval = 0;
    let newRepetition = 0;
    let newEfactor = prev.efactor;

    if (rating === 'again') {
        newRepetition = 0;
        newInterval = 1; // 1 day (or could be 10 mins if we had intra-day logic)
        // Penalize EF slightly less than comprehensive reset
        newEfactor = Math.max(1.3, prev.efactor - 0.2);
    } else {
        // Successful review ('hard', 'good', 'easy')

        // 1. Update E-Factor
        // SM-2 Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        // q: 3=Hard, 4=Good, 5=Easy
        let q = 4;
        if (rating === 'hard') q = 3;
        if (rating === 'easy') q = 5;

        newEfactor = prev.efactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        if (newEfactor < 1.3) newEfactor = 1.3; // Floor

        // 2. Update Repetition
        newRepetition = prev.repetition + 1;

        // 3. Calculate Interval
        if (newRepetition === 1) {
            newInterval = 1;
        } else if (newRepetition === 2) {
            newInterval = 6;
        } else {
            newInterval = Math.round(prev.interval * newEfactor);
        }

        // Hard penalty: if 'hard', reduce interval slightly compared to standard flow?
        // Standard SM-2 doesn't do this explicitly other than via EF, but we can clamp.
        if (rating === 'hard' && newInterval > prev.interval * 1.2) {
            newInterval = Math.round(prev.interval * 1.2);
        }
    }

    // Convert days to milliseconds for dueDate
    const nextReviewDate = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

    return {
        interval: newInterval,
        repetition: newRepetition,
        efactor: newEfactor,
        dueDate: nextReviewDate
    };
};

/**
 * Helper to check if a card is due
 */
export const isDue = (card: { srs?: SRSData }): boolean => {
    if (!card.srs) return true; // New cards are due
    return card.srs.dueDate <= Date.now();
};
