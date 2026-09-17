from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import InsufficientCreditsError
from app.models.credits import CreditCost, CreditTransaction, CreditWallet
from app.models.enums import CreditTransactionType
from app.models.user import User

DEFAULT_COSTS = {
    "evaluation": (10, "AI solution evaluation"),
    "flashcard_generation": (5, "AI flashcard generation"),
    "ai_tutor_message": (1, "AI tutor message"),
    "question_generation": (3, "AI question generation"),
    "mock_analysis": (4, "AI mock-test analysis"),
}


class CreditService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def ensure_wallet(self, user: User) -> CreditWallet:
        wallet = self.db.scalar(select(CreditWallet).where(CreditWallet.user_id == user.id))
        if wallet:
            return wallet
        wallet = CreditWallet(user_id=user.id, balance=0)
        self.db.add(wallet)
        self.db.flush()
        self.grant(
            user,
            settings.starter_credits,
            CreditTransactionType.STARTER_CREDIT,
            note="Welcome credits",
        )
        return wallet

    def get_cost(self, action_key: str) -> int:
        row = self.db.scalar(
            select(CreditCost).where(CreditCost.action_key == action_key, CreditCost.is_active.is_(True))
        )
        if row:
            return row.credits
        if action_key in DEFAULT_COSTS:
            return DEFAULT_COSTS[action_key][0]
        raise ValueError(f"Unknown credit action: {action_key}")

    def grant(
        self,
        user: User,
        amount: int,
        tx_type: CreditTransactionType,
        *,
        reference_id: str | None = None,
        note: str | None = None,
    ) -> CreditTransaction:
        wallet = self._lock_wallet(user)
        wallet.balance += amount
        wallet.lifetime_granted += amount
        return self._record(wallet, user, amount, tx_type, reference_id, note)

    def charge(
        self,
        user: User,
        action_key: str,
        tx_type: CreditTransactionType,
        *,
        reference_id: str | None = None,
        note: str | None = None,
    ) -> CreditTransaction:
        cost = self.get_cost(action_key)
        wallet = self._lock_wallet(user)
        if wallet.balance < cost:
            raise InsufficientCreditsError(cost, wallet.balance)
        wallet.balance -= cost
        wallet.lifetime_spent += cost
        return self._record(wallet, user, -cost, tx_type, reference_id, note)

    def refund(
        self,
        user: User,
        amount: int,
        *,
        reference_id: str | None = None,
        note: str | None = None,
    ) -> CreditTransaction:
        return self.grant(
            user,
            amount,
            CreditTransactionType.REFUND,
            reference_id=reference_id,
            note=note,
        )

    def _lock_wallet(self, user: User) -> CreditWallet:
        wallet = self.db.scalar(
            select(CreditWallet).where(CreditWallet.user_id == user.id).with_for_update()
        )
        if wallet is None:
            wallet = CreditWallet(user_id=user.id, balance=0)
            self.db.add(wallet)
            self.db.flush()
        return wallet

    def _record(
        self,
        wallet: CreditWallet,
        user: User,
        amount: int,
        tx_type: CreditTransactionType,
        reference_id: str | None,
        note: str | None,
    ) -> CreditTransaction:
        tx = CreditTransaction(
            wallet_id=wallet.id,
            user_id=user.id,
            amount=amount,
            balance_after=wallet.balance,
            transaction_type=tx_type,
            reference_id=reference_id,
            note=note,
        )
        self.db.add(tx)
        self.db.flush()
        return tx
