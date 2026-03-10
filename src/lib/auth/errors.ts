export class AuthSessionRequiredError extends Error {
  constructor(message = "A backend auth session is required.") {
    super(message)
    this.name = "AuthSessionRequiredError"
  }
}

export class AuthSessionInvalidError extends Error {
  constructor(message = "The backend auth session is invalid or expired.") {
    super(message)
    this.name = "AuthSessionInvalidError"
  }
}

export function isRecoverableAuthSessionError(error: unknown) {
  return error instanceof AuthSessionRequiredError || error instanceof AuthSessionInvalidError
}
