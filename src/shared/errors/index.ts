/**
 * Base errors of the shared kernel.
 *
 * `DomainError` signals a violated invariant or business rule (raised from
 * `domain/` or shared value objects). `ApplicationError` signals a use-case
 * level failure (not found, not allowed, conflict). Handlers discriminate
 * with `instanceof` to map them to HTTP/UI responses.
 *
 * `code` is a stable machine-readable identifier, namespaced by area,
 * e.g. `measurement/invalid-value`, `org/not-found`.
 */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class ApplicationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
