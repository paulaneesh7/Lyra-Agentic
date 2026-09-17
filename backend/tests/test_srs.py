from app.models.enums import ReviewRating
from app.services.srs import review_card


def test_again_resets_interval():
    ease, interval, reps, _ = review_card(
        rating=ReviewRating.AGAIN, ease=2.5, interval_days=6, repetitions=3
    )
    assert interval == 0
    assert reps == 0
    assert ease < 2.5


def test_good_increments_repetitions():
    _, interval, reps, nxt = review_card(
        rating=ReviewRating.GOOD, ease=2.5, interval_days=0, repetitions=0
    )
    assert reps == 1
    assert interval == 1
    assert nxt is not None
