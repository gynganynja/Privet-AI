import type { FlashcardData } from "@/types/flashcard";

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

// Initial SRS state for a new card
export const INITIAL_SRS_STATE: NonNullable<FlashcardData['srs']> = {
    nextReview: 0, // Ready immediately
    interval: 0,
    easeFactor: 2.5,
    reviewCount: 0,
    status: 'new'
};

/**
 * Calculates the next review schedule based on the modified SM-2 algorithm.
 * 
 * @param card The current flashcard data
 * @param rating User's rating: 'again' (fail), 'hard', 'good', 'easy'
 * @returns Updated SRS metadata object
 */
export function calculateReview(
    currentSrs: FlashcardData['srs'] = INITIAL_SRS_STATE,
    rating: ReviewRating
): NonNullable<FlashcardData['srs']> {
    let { interval, easeFactor, reviewCount, status } = currentSrs;
    const now = Date.now();

    // 1. Update Status & Review Count
    reviewCount++;

    if (rating === 'again') {
        status = 'relearning';
        interval = 0; // Reset interval
        easeFactor = Math.max(1.3, easeFactor - 0.2); // Penalty

        // Schedule for 1 minute later (essentially "now" for next refresh)
        return {
            nextReview: now + 60 * 1000,
            interval: 0,
            easeFactor,
            reviewCount,
            status
        };
    }

    // Rating is Hard/Good/Easy
    if (status === 'new' || status === 'relearning') {
        status = 'learning';
        interval = 1; // Start with 1 day
    } else {
        // Standard SM-2 calculation for 'review'/'learning' status
        status = 'review';

        if (reviewCount === 1) {
            interval = 1;
        } else if (reviewCount === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
    }

    // Adjust ease factor based on rating
    // SM-2 formula: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
    // Mapped ratings: Again=0 (handled above), Hard=3, Good=4, Easy=5
    let q = 4; // Default 'good'
    if (rating === 'hard') q = 3;
    if (rating === 'easy') q = 5;

    // Apply modifiers
    if (rating === 'hard') {
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        interval = Math.max(1, Math.floor(interval * 0.8)); // Hard penalty on interval
    } else if (rating === 'easy') {
        easeFactor += 0.15;
        interval = Math.floor(interval * 1.3); // Easy bonus
    } else {
        // Good: strict SM-2 slight adjustment? Or keep stable?
        // SM-2 actually changes EF even for Good.
        // EF' = EF + (0.1 - (1)*(0.08 + 0.02)) = EF
        // Actually q=4 means (5-4)=1. Formula: 0.1 - 1*(0.1) = 0. No change for Good.
    }

    // Day in ms
    const DAY_MS = 24 * 60 * 60 * 1000;

    return {
        nextReview: now + (interval * DAY_MS),
        interval,
        easeFactor,
        reviewCount,
        status: reviewCount > 4 ? 'graduated' : status
    };
}

/**
 * Helper to check if a card is due
 */
export function isCardDue(card: FlashcardData): boolean {
    if (!card.srs) return true; // No SRS data = New = Due
    return Date.now() >= card.srs.nextReview;
}

/**
 * Helper to get a human-readable due string
 */
export function getDueString(nextReview: number): string {
    const diff = nextReview - Date.now();
    if (diff <= 0) return "Now";

    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}d`;
}
