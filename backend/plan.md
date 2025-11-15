# JWT Authentication Implementation Plan

This document outlines the plan for implementing JWT-based authentication in the FastAPI backend.

## 1. New Dependencies

The following Python libraries will be added to `requirements.txt`:

- `python-jose[cryptography]`: For encoding, decoding, and verifying JWT tokens.
- `passlib[bcrypt]`: For securely hashing and verifying user passwords.
- `python-multipart`: To handle form data for the token endpoint.

## 2. Proposed File Structure

To maintain a clean and scalable architecture, the authentication logic will be organized into a new `auth` module:

```
NKO_govna/backend/
├── auth/
│   ├── __init__.py
│   ├── crud.py          # Functions for user data operations (e.g., get_user).
│   ├── database.py      # In-memory user "database" for initial implementation.
│   ├── models.py        # Pydantic models for User, Token, etc.
│   ├── security.py      # Password hashing and JWT handling utilities.
│   └── router.py        # Authentication-related API endpoints (/token, /users/me).
├── core/
│   └── config.py        # Application settings (JWT secret, algorithm, etc.).
└── main.py              # Main application file.
```

## 3. New API Endpoints

The following endpoints will be created under an `/auth` prefix:

- **`POST /auth/token`**:
    - **Description**: Authenticates a user and returns an access token.
    - **Request**: `application/x-www-form-urlencoded` with `username` and `password`.
    - **Response**: A JSON object containing the `access_token` and `token_type`.

- **`POST /auth/register`**:
    - **Description**: Creates a new user.
    - **Request**: A JSON object with user details (e.g., `username`, `password`, `email`).
    - **Response**: The newly created user object.

- **`GET /users/me`**:
    - **Description**: A protected endpoint to retrieve the current authenticated user's details.
    - **Request**: Requires a `Bearer` token in the `Authorization` header.
    - **Response**: The current user's information.

## 4. Configuration

A new file, `core/config.py`, will be created to manage settings using Pydantic's `BaseSettings`. This will include:

- `SECRET_KEY`: The secret key for signing JWTs.
- `ALGORITHM`: The algorithm to use (e.g., `HS256`).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: The token's expiration time.

These settings will be loaded from environment variables for security and flexibility.

## 5. Mermaid Diagram of Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant FastAPI
    participant AuthRouter
    participant Security
    participant Database

    User->>FastAPI: POST /auth/token (username, password)
    FastAPI->>AuthRouter: /token endpoint
    AuthRouter->>Database: Get user by username
    Database-->>AuthRouter: User data (with hashed password)
    AuthRouter->>Security: Verify password(plain_password, hashed_password)
    Security-->>AuthRouter: Password OK
    AuthRouter->>Security: Create access token(user_data)
    Security-->>AuthRouter: JWT Token
    AuthRouter-->>FastAPI: {access_token: "...", token_type: "bearer"}
    FastAPI-->>User: JWT Token