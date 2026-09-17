from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "app_error") -> None:
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, 404, "not_found")


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Please sign in to continue") -> None:
        super().__init__(message, 401, "unauthorized")


class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have access to this resource") -> None:
        super().__init__(message, 403, "forbidden")


class InsufficientCreditsError(AppError):
    def __init__(self, required: int, available: int) -> None:
        super().__init__(
            f"This action needs {required} credits. You currently have {available}.",
            402,
            "insufficient_credits",
        )
        self.required = required
        self.available = available


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        payload: dict = {"error": {"code": exc.code, "message": exc.message}}
        if isinstance(exc, InsufficientCreditsError):
            payload["error"]["required"] = exc.required
            payload["error"]["available"] = exc.available
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(ValidationError)
    async def validation_handler(_: Request, exc: ValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "validation_error", "message": str(exc)}},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": "http_error", "message": exc.detail}},
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(_: Request, exc: Exception) -> JSONResponse:
        if isinstance(exc, StarletteHTTPException):
            raise exc
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "internal_error",
                    "message": "Something went wrong. Please try again.",
                }
            },
        )
