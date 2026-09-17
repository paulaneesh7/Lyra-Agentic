"""Payment provider abstraction. Razorpay/Stripe can implement this later.

No live charges in the MVP — plans are placeholders on the Credits page.
"""

from abc import ABC, abstractmethod


class PaymentProvider(ABC):
    name: str

    @abstractmethod
    def create_checkout(self, *, user_id: str, plan_code: str) -> dict:
        raise NotImplementedError


class PlaceholderPaymentProvider(PaymentProvider):
    name = "placeholder"

    def create_checkout(self, *, user_id: str, plan_code: str) -> dict:
        return {
            "status": "not_implemented",
            "message": "Payments are not enabled. Credit packs are shown for product design only.",
            "user_id": user_id,
            "plan_code": plan_code,
        }


def get_payment_provider() -> PaymentProvider:
    return PlaceholderPaymentProvider()
