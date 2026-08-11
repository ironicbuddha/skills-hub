/** A validation failure raised before a durable lifecycle boundary is called. */
export class CandidateValidationError extends Error {
  override readonly name = "CandidateValidationError";
}

/** A valid lifecycle command that is blocked by a governance rule. */
export class CandidateTransitionError extends Error {
  override readonly name = "CandidateTransitionError";
}
