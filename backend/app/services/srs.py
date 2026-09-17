from datetime import datetime, timedelta, timezone

from app.models.enums import ReviewRating

# SM-2 spaced repetition. Isolated so the review UI never owns the algorithm.


def review_card(
    *,
    rating: ReviewRating,
    ease: float,
    interval_days: int,
    repetitions: int,
) -> tuple[float, int, int, datetime]:
    now = datetime.now(timezone.utc)
    if rating == ReviewRating.AGAIN:
        return max(1.3, ease - 0.2), 0, 0, now + timedelta(minutes=10)

    new_ease = ease
    if rating == ReviewRating.HARD:
        new_ease = max(1.3, ease - 0.15)
        interval = 1 if repetitions == 0 else max(1, int(interval_days * 1.2))
    elif rating == ReviewRating.GOOD:
        interval = 1 if repetitions == 0 else (6 if repetitions == 1 else int(interval_days * ease))
    else:
        new_ease = ease + 0.15
        interval = 1 if repetitions == 0 else int(interval_days * ease * 1.3)

    return new_ease, interval, repetitions + 1, now + timedelta(days=interval)
