import type { Writable } from "node:stream";

import {
  approvalAttemptContextSchema,
  approvalCommandSchema,
  captureCandidateCommandSchema,
  materialRevisionCommandSchema,
  rejectionCommandSchema,
  reviewAttemptContextSchema,
  reviewSubmissionCommandSchema,
} from "./operational-lessons-schema.ts";

/** A fact category permitted at the sanitized capture boundary. */
export type FactClass = "operation" | "observed-outcome" | "trust-boundary" | "impact";

/** The identity performing capture and the authority under which it acts. */
export interface Actor {
  identity: string;
  authority: string;
  kind: "human" | "service";
}

/** A stable reference to an operation or incident that produced the candidate. */
export interface SourceEvent {
  sourceId: string;
  sourceKind: string;
  observedAt: string;
}

/** One bounded, allowlisted fact rather than raw incident material. */
export interface IncidentFact {
  factClass: FactClass;
  summary: string;
}

/** Evidence that the allowlist sanitizer ran before capture. */
export interface SanitizationMetadata {
  method: "incident-fact-allowlist";
  version: string;
  actor: string;
  sanitizedAt: string;
  allowlistedFactClasses: FactClass[];
  prohibitedContentExcluded: true;
}

/** A protected pointer to source evidence, excluding the unsafe evidence itself. */
export interface EvidenceReferenceInput {
  evidenceId: string;
  kind: "source";
  sanitizedSummary: string;
  classification: string;
  accessBoundary: string;
  observedAt: string;
  collector: string;
  immutableLocator: string;
  retention: string;
}

/** A protected evidence pointer bound immutably to one candidate revision. */
export interface EvidenceReference extends EvidenceReferenceInput {
  supportedRevision: number;
}

/** Evidential confidence, kept separate from human approval. */
export interface Confidence {
  level: "hypothesis" | "supported" | "demonstrated";
  rationale: string;
}

/** The complete storage-neutral command accepted by the capture boundary. */
export interface CaptureCandidateCommand {
  lessonId: string;
  schemaVersion: string;
  title: string;
  actor: Actor;
  occurredAt: string;
  sourceEvents: SourceEvent[];
  incidentFacts: IncidentFact[];
  failureMode: string;
  sanitization: SanitizationMetadata;
  evidenceSummary: string;
  evidenceReferences: EvidenceReferenceInput[];
  confidence: Confidence;
  recurrenceSignature: string;
  invariant: string;
  guidance: string;
  owner: string;
}

/** Immutable content shared by sanitized Candidate Lesson revisions. */
interface CandidateLessonFields {
  lessonId: string;
  schemaVersion: string;
  revision: number;
  revisionId: string;
  title: string;
  createdAt: string;
  createdBy: string;
  revisionCreatedAt: string;
  revisionCreatedBy: string;
  sourceEvents: readonly SourceEvent[];
  incidentFacts: readonly IncidentFact[];
  failureMode: string;
  sanitization: Readonly<SanitizationMetadata>;
  evidenceSummary: string;
  evidenceReferences: readonly EvidenceReference[];
  confidence: Readonly<Confidence>;
  recurrenceSignature: string;
  invariant: string;
  guidance: string;
  owner: string;
  predecessorRevisionId?: string;
  changeSummary?: string;
}

/** A captured revision that has not yet entered accountable review. */
export interface CapturedCandidateLesson extends CandidateLessonFields {
  state: "captured";
}

/** A complete assignment of an exact revision to named human reviewers. */
export interface ReviewAssignment {
  reviewers: { identity: string; kind: "human" }[];
  requiredAuthority: string;
  assignedBy: string;
  assignedAt: string;
  provenance: string;
  status: "assigned";
}

/** A candidate revision currently assigned for accountable human review. */
export interface UnderReviewCandidateLesson extends CandidateLessonFields {
  state: "under_review";
  reviewAssignment: Readonly<ReviewAssignment>;
}

/** A terminal candidate outcome recorded by an accountable human reviewer. */
export interface RejectedCandidateLesson extends CandidateLessonFields {
  state: "rejected";
  reviewAssignment: Readonly<ReviewAssignment>;
  disposition: "rejected" | "withdrawn";
  dispositionReason: string;
  dispositionBy: string;
  dispositionAt: string;
}

export interface RegressionClaim {
  expectedNonOccurrence: string;
  falsePositiveBoundary: string;
}

export interface ApprovalCommand {
  actor: Actor;
  occurredAt: string;
  revisionId: string;
  rationale: string;
  conditions: string[];
  waivers: string[];
  recurrenceEvidence?: string[] | undefined;
  severeFirstOccurrence?: { justification: string; deterministicRegressionEvidence: string[] } | undefined;
  evidenceReferences: {
    evidenceId: string;
    kind: "recurrence" | "regression";
    supportedRevision: number;
    sanitizedSummary: string;
    classification: string;
    accessBoundary: string;
    observedAt: string;
    collector: string;
    immutableLocator: string;
    retention: string;
  }[];
  regressionClaims: RegressionClaim[];
  applicability: string;
  exclusions: string[];
  scopeClass: string;
  severity: "low" | "medium" | "high" | "critical";
  failureBehavior: string;
  reviewAt: string;
  expiresAt?: string | undefined;
  expiryRationale?: string | undefined;
  conflictReferences: string[];
  conflictRecords: {
    conflictId: string;
    revisionIds: string[];
    overlappingScope: string;
    contradictoryObligations: string[];
    discoveredAt: string;
    discoveredBy: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "resolved" | "excepted";
    owner: string;
    resolutionRationale: string | null;
    resolutionAuthority: string | null;
    exceptionExpiresAt: string | null;
    resultingRevisionIds: string[];
  }[];
  requiredEnforcementClasses: string[];
  enforcementLinks: {
    linkId: string;
    controlClass: string;
    target: string;
    owner: string;
    implementedRevisionId: string;
    deploymentState: "planned" | "ready" | "active" | "drifted" | "disabled" | "removed";
    verification: string;
    bypassPolicy: string;
    rollbackOperation: string;
  }[];
  rollbackPlan: { affectedProjections: string[]; recoveryAction: string; verification: string };
}

export interface ApprovalRecord extends Omit<ApprovalCommand, "actor" | "occurredAt"> {
  approver: string;
  authority: string;
  approvedAt: string;
}

export interface ApprovedLesson extends CandidateLessonFields {
  state: "approved";
  reviewAssignment: Readonly<ReviewAssignment>;
  approval: Readonly<ApprovalRecord>;
}

export type CandidateLesson =
  | CapturedCandidateLesson
  | UnderReviewCandidateLesson
  | RejectedCandidateLesson;

export type OperationalLesson = CandidateLesson | ApprovedLesson;

/** The append-only audit event emitted for a successful capture. */
export interface CaptureLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: null;
  toState: "captured";
  revision: 1;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "sanitized candidate captured";
  evidenceReferences: readonly string[];
}


export interface ReviewLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "captured";
  toState: "under_review";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "candidate submitted for human review";
  reviewAssignment: Readonly<ReviewAssignment>;
  outcome: "completed";
}

export interface BlockedReviewLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "captured";
  toState: "captured";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "review assignment is incomplete or has invalid provenance";
  outcome: "blocked";
}

export interface RevisionLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "under_review";
  toState: "captured";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "material candidate revision created";
  predecessorRevisionId: string;
  changeSummary: string;
  outcome: "completed";
}

export interface BlockedRevisionLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "under_review";
  toState: "under_review";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "material revision contained no changed value";
  outcome: "blocked";
}

export interface RejectionLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "under_review";
  toState: "rejected";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: string;
  disposition: "rejected" | "withdrawn";
  outcome: "completed";
}

export interface BlockedRejectionLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "under_review";
  toState: "under_review";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "actor is not an assigned human reviewer with the required authority";
  attemptedDisposition: "rejected" | "withdrawn";
  outcome: "blocked";
}

export interface ApprovalLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "under_review";
  toState: "approved";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: "human";
  occurredAt: string;
  reason: string;
  approval: Readonly<ApprovalRecord>;
  outcome: "completed";
}

export interface BlockedApprovalLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "under_review";
  toState: "under_review";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "approval contract was not satisfied";
  outcome: "blocked";
}

export type LifecycleEvent =
  | CaptureLifecycleEvent
  | ReviewLifecycleEvent
  | BlockedReviewLifecycleEvent
  | RevisionLifecycleEvent
  | BlockedRevisionLifecycleEvent
  | RejectionLifecycleEvent
  | BlockedRejectionLifecycleEvent
  | ApprovalLifecycleEvent
  | BlockedApprovalLifecycleEvent;

/**
 * Durable boundary for capture. Implementations atomically append both records
 * and reject an existing revision ID or event ID; no partial append is allowed.
 */
export interface CaptureSink {
  appendCapture(revision: CapturedCandidateLesson, event: CaptureLifecycleEvent): void;
}

export interface ReviewSink {
  appendReviewTransition(revision: UnderReviewCandidateLesson, event: ReviewLifecycleEvent): void;
  appendBlockedReviewAttempt(event: BlockedReviewLifecycleEvent): void;
}

export interface RevisionSink {
  appendRevision(revision: CapturedCandidateLesson, event: RevisionLifecycleEvent): void;
  appendBlockedRevision(event: BlockedRevisionLifecycleEvent): void;
}

export interface RejectionSink {
  appendRejection(revision: RejectedCandidateLesson, event: RejectionLifecycleEvent): void;
  appendBlockedRejection(event: BlockedRejectionLifecycleEvent): void;
}

export interface ApprovalSink {
  appendApproval(revision: ApprovedLesson, event: ApprovalLifecycleEvent): void;
  appendBlockedApproval(event: BlockedApprovalLifecycleEvent): void;
}

export interface SubmitForReviewCommand {
  actor: Actor;
  occurredAt: string;
  assignment: ReviewAssignment;
}

export interface MaterialRevisionCommand {
  actor: Actor;
  occurredAt: string;
  changeSummary: string;
  changes: Partial<
    Pick<
      CandidateLessonFields,
      | "title"
      | "failureMode"
      | "evidenceSummary"
      | "confidence"
      | "recurrenceSignature"
      | "invariant"
      | "guidance"
      | "owner"
    >
  >;
}

/** A validation failure raised before the durable capture boundary is called. */
export class CandidateValidationError extends Error {
  override readonly name = "CandidateValidationError";
}

/** A valid lifecycle command that is blocked by a governance rule. */
export class CandidateTransitionError extends Error {
  override readonly name = "CandidateTransitionError";
}

/**
 * Captures immutable revision 1 from allowlisted, sanitized incident facts.
 * Validation completes before the sink receives the revision and event pair.
 */
export function captureCandidate(input: unknown, sink: CaptureSink): CapturedCandidateLesson {
  const parsed = captureCandidateCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }

  const command: CaptureCandidateCommand = parsed.data;
  const evidenceReferences = command.evidenceReferences.map((reference) => ({
    ...reference,
    supportedRevision: 1 as const,
  }));
  const candidate = createCandidate(command, evidenceReferences);
  const event = createCaptureEvent(command, evidenceReferences);

  sink.appendCapture(candidate, event);
  return candidate;
}

/** Assigns a captured revision to named human reviewers and records the transition atomically. */
export function submitCandidateForReview(
  candidate: CapturedCandidateLesson,
  input: unknown,
  sink: ReviewSink,
): UnderReviewCandidateLesson {
  const parsed = reviewSubmissionCommandSchema.safeParse(input);
  if (!parsed.success) {
    const attempt = reviewAttemptContextSchema.safeParse(input);
    if (attempt.success) {
      const blockedEvent = deepFreeze({
        eventId: `${candidate.lessonId}:${candidate.revision}:review-blocked:${attempt.data.occurredAt}`,
        lessonId: candidate.lessonId,
        fromState: "captured" as const,
        toState: "captured" as const,
        revision: candidate.revision,
        actor: attempt.data.actor.identity,
        actorAuthority: attempt.data.actor.authority,
        actorKind: attempt.data.actor.kind,
        occurredAt: attempt.data.occurredAt,
        reason: "review assignment is incomplete or has invalid provenance" as const,
        outcome: "blocked" as const,
      });
      sink.appendBlockedReviewAttempt(blockedEvent);
      throw new CandidateTransitionError(blockedEvent.reason);
    }
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }

  const command: SubmitForReviewCommand = parsed.data;
  const underReview = deepFreeze({
    ...candidate,
    state: "under_review" as const,
    reviewAssignment: command.assignment,
  });
  const event = deepFreeze({
    eventId: `${candidate.lessonId}:${candidate.revision}:review-submitted`,
    lessonId: candidate.lessonId,
    fromState: "captured" as const,
    toState: "under_review" as const,
    revision: candidate.revision,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: command.actor.kind,
    occurredAt: command.occurredAt,
    reason: "candidate submitted for human review" as const,
    reviewAssignment: command.assignment,
    outcome: "completed" as const,
  });

  sink.appendReviewTransition(underReview, event);
  return underReview;
}

/** Creates a new immutable candidate revision; review and approval never cross revisions. */
export function reviseCandidate(
  candidate: UnderReviewCandidateLesson,
  input: unknown,
  sink: RevisionSink,
): CapturedCandidateLesson {
  const parsed = materialRevisionCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }

  const command = parsed.data;
  const changedFields = Object.fromEntries(
    Object.entries(command.changes).filter(([, value]) => value !== undefined),
  ) as MaterialRevisionCommand["changes"];
  const hasMaterialChange = Object.entries(changedFields).some(([field, value]) => {
    const priorValue = candidate[field as keyof MaterialRevisionCommand["changes"]];
    return JSON.stringify(value) !== JSON.stringify(priorValue);
  });
  if (!hasMaterialChange) {
    const blockedEvent = deepFreeze({
      eventId: `${candidate.lessonId}:${candidate.revision}:revision-blocked:${command.occurredAt}`,
      lessonId: candidate.lessonId,
      fromState: "under_review" as const,
      toState: "under_review" as const,
      revision: candidate.revision,
      actor: command.actor.identity,
      actorAuthority: command.actor.authority,
      actorKind: command.actor.kind,
      occurredAt: command.occurredAt,
      reason: "material revision contained no changed value" as const,
      outcome: "blocked" as const,
    });
    sink.appendBlockedRevision(blockedEvent);
    throw new CandidateTransitionError(blockedEvent.reason);
  }
  const { reviewAssignment: _priorReview, ...priorRevision } = candidate;
  const revision = candidate.revision + 1;
  const evidenceReferences = candidate.evidenceReferences.map((reference) => ({
    ...reference,
    supportedRevision: revision,
  }));
  const revised = deepFreeze({
    ...priorRevision,
    ...changedFields,
    revision,
    revisionId: `${candidate.lessonId}:${revision}`,
    state: "captured" as const,
    revisionCreatedAt: command.occurredAt,
    revisionCreatedBy: command.actor.identity,
    evidenceReferences,
    predecessorRevisionId: candidate.revisionId,
    changeSummary: command.changeSummary,
  });
  const event = deepFreeze({
    eventId: `${candidate.lessonId}:${revision}:material-revision`,
    lessonId: candidate.lessonId,
    fromState: "under_review" as const,
    toState: "captured" as const,
    revision,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: command.actor.kind,
    occurredAt: command.occurredAt,
    reason: "material candidate revision created" as const,
    predecessorRevisionId: candidate.revisionId,
    changeSummary: command.changeSummary,
    outcome: "completed" as const,
  });

  sink.appendRevision(revised, event);
  return revised;
}

/** Records a human rejection; withdrawal uses the same rejected state with its own disposition. */
export function rejectCandidate(
  candidate: UnderReviewCandidateLesson,
  input: unknown,
  sink: RejectionSink,
): RejectedCandidateLesson {
  const parsed = rejectionCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }

  const command = parsed.data;
  const isAssignedReviewer = candidate.reviewAssignment.reviewers.some(
    (reviewer) => reviewer.identity === command.actor.identity,
  );
  const hasRequiredAuthority = command.actor.authority === candidate.reviewAssignment.requiredAuthority;
  const isHuman = command.actor.kind === "human";
  if (!isAssignedReviewer || !hasRequiredAuthority || !isHuman) {
    const blockedEvent = deepFreeze({
      eventId: `${candidate.lessonId}:${candidate.revision}:rejection-blocked:${command.occurredAt}`,
      lessonId: candidate.lessonId,
      fromState: "under_review" as const,
      toState: "under_review" as const,
      revision: candidate.revision,
      actor: command.actor.identity,
      actorAuthority: command.actor.authority,
      actorKind: command.actor.kind,
      occurredAt: command.occurredAt,
      reason: "actor is not an assigned human reviewer with the required authority" as const,
      attemptedDisposition: command.disposition,
      outcome: "blocked" as const,
    });
    sink.appendBlockedRejection(blockedEvent);
    throw new CandidateTransitionError(blockedEvent.reason);
  }

  const rejected = deepFreeze({
    ...candidate,
    state: "rejected" as const,
    disposition: command.disposition,
    dispositionReason: command.reason,
    dispositionBy: command.actor.identity,
    dispositionAt: command.occurredAt,
  });
  const event = deepFreeze({
    eventId: `${candidate.lessonId}:${candidate.revision}:${command.disposition}`,
    lessonId: candidate.lessonId,
    fromState: "under_review" as const,
    toState: "rejected" as const,
    revision: candidate.revision,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: command.actor.kind,
    occurredAt: command.occurredAt,
    reason: command.reason,
    disposition: command.disposition,
    outcome: "completed" as const,
  });

  sink.appendRejection(rejected, event);
  return rejected;
}

/** Approves one exact revision after every governance gate is explicitly satisfied. */
export function approveCandidate(
  candidate: UnderReviewCandidateLesson,
  input: unknown,
  sink: ApprovalSink,
): ApprovedLesson {
  const parsed = approvalCommandSchema.safeParse(input);
  const attempt = approvalAttemptContextSchema.safeParse(input);
  const evidenceIsBound = parsed.success
    && parsed.data.evidenceReferences.every(({ supportedRevision }) => supportedRevision === candidate.revision)
    && (!parsed.data.recurrenceEvidence || parsed.data.recurrenceEvidence.every((evidenceId) =>
      parsed.data.evidenceReferences.some((reference) =>
        reference.evidenceId === evidenceId && reference.kind === "recurrence")))
    && (!parsed.data.severeFirstOccurrence || parsed.data.severeFirstOccurrence.deterministicRegressionEvidence.every(
      (evidenceId) => parsed.data.evidenceReferences.some((reference) =>
        reference.evidenceId === evidenceId && reference.kind === "regression"),
    ));
  const conflictsAreBound = parsed.success
    && parsed.data.conflictReferences.every((conflictId) => parsed.data.conflictRecords.some((record) =>
      record.conflictId === conflictId && record.revisionIds.includes(candidate.revisionId)))
    && parsed.data.conflictRecords.every((record) =>
      record.revisionIds.includes(candidate.revisionId)
      && parsed.data.conflictReferences.includes(record.conflictId)
      && (record.status === "open" || Boolean(record.resolutionRationale && record.resolutionAuthority))
      && (record.status !== "excepted"
        || Boolean(record.exceptionExpiresAt
          && Date.parse(record.exceptionExpiresAt) > Date.parse(parsed.data.occurredAt))));
  const enforcementIsBound = parsed.success
    && parsed.data.enforcementLinks.every(({ implementedRevisionId }) => implementedRevisionId === candidate.revisionId)
    && parsed.data.requiredEnforcementClasses.every((controlClass) =>
      parsed.data.enforcementLinks.some((link) => link.controlClass === controlClass));
  const severeExceptionIsValid = parsed.success && (!parsed.data.severeFirstOccurrence
    || parsed.data.severity === "high" || parsed.data.severity === "critical");
  const timingIsValid = parsed.success
    && Date.parse(parsed.data.occurredAt) >= Date.parse(candidate.reviewAssignment.assignedAt)
    && Date.parse(parsed.data.occurredAt) >= Date.parse(candidate.revisionCreatedAt)
    && parsed.data.evidenceReferences.every(({ observedAt }) =>
      Date.parse(observedAt) <= Date.parse(parsed.data.occurredAt))
    && Date.parse(parsed.data.reviewAt) > Date.parse(parsed.data.occurredAt)
    && (!parsed.data.expiresAt || Date.parse(parsed.data.expiresAt) > Date.parse(parsed.data.reviewAt));
  const authorized = parsed.success
    && parsed.data.actor.kind === "human"
    && parsed.data.revisionId === candidate.revisionId
    && parsed.data.actor.authority === candidate.reviewAssignment.requiredAuthority
    && candidate.reviewAssignment.reviewers.some(({ identity }) => identity === parsed.data.actor.identity)
    && evidenceIsBound
    && conflictsAreBound
    && enforcementIsBound
    && severeExceptionIsValid
    && timingIsValid;

  if (!parsed.success || !authorized) {
    if (!attempt.success) {
      throw new CandidateValidationError(parsed.success ? "invalid approval actor context" : parsed.error.issues.map(({ message }) => message).join("; "));
    }
    const blockedEvent = deepFreeze({
      eventId: `${candidate.lessonId}:${candidate.revision}:approval-blocked:${attempt.data.occurredAt}`,
      lessonId: candidate.lessonId,
      fromState: "under_review" as const,
      toState: "under_review" as const,
      revision: candidate.revision,
      actor: attempt.data.actor.identity,
      actorAuthority: attempt.data.actor.authority,
      actorKind: attempt.data.actor.kind,
      occurredAt: attempt.data.occurredAt,
      reason: "approval contract was not satisfied" as const,
      outcome: "blocked" as const,
    });
    sink.appendBlockedApproval(blockedEvent);
    throw new CandidateTransitionError(blockedEvent.reason);
  }

  const command: ApprovalCommand = parsed.data;
  const { actor, occurredAt, ...approvedContract } = command;
  const approval = deepFreeze({
    ...approvedContract,
    approver: actor.identity,
    authority: actor.authority,
    approvedAt: occurredAt,
  });
  const approved = deepFreeze({ ...candidate, state: "approved" as const, approval });
  const event = deepFreeze({
    eventId: `${candidate.lessonId}:${candidate.revision}:approved`,
    lessonId: candidate.lessonId,
    fromState: "under_review" as const,
    toState: "approved" as const,
    revision: candidate.revision,
    actor: actor.identity,
    actorAuthority: actor.authority,
    actorKind: "human" as const,
    occurredAt,
    reason: command.rationale,
    approval,
    outcome: "completed" as const,
  });
  sink.appendApproval(approved, event);
  return approved;
}

/** Returns guidance only for consumer-eligible revisions; candidates yield none. */
export function selectConsumerGuidance(lesson: OperationalLesson): null {
  void lesson;
  return null;
}

/** Writes Markdown as data without constructing interpreter source. */
export function publishMarkdown(markdown: string, destination: Writable): void {
  destination.write(markdown);
}

function createCandidate(
  command: CaptureCandidateCommand,
  evidenceReferences: EvidenceReference[],
): CapturedCandidateLesson {
  return deepFreeze({
    lessonId: command.lessonId,
    schemaVersion: command.schemaVersion,
    revision: 1,
    revisionId: `${command.lessonId}:1`,
    state: "captured",
    title: command.title,
    createdAt: command.occurredAt,
    createdBy: command.actor.identity,
    revisionCreatedAt: command.occurredAt,
    revisionCreatedBy: command.actor.identity,
    sourceEvents: command.sourceEvents,
    incidentFacts: command.incidentFacts,
    failureMode: command.failureMode,
    sanitization: command.sanitization,
    evidenceSummary: command.evidenceSummary,
    evidenceReferences,
    confidence: command.confidence,
    recurrenceSignature: command.recurrenceSignature,
    invariant: command.invariant,
    guidance: command.guidance,
    owner: command.owner,
  });
}

function createCaptureEvent(
  command: CaptureCandidateCommand,
  evidenceReferences: EvidenceReference[],
): CaptureLifecycleEvent {
  return deepFreeze({
    eventId: `${command.lessonId}:1:capture`,
    lessonId: command.lessonId,
    fromState: null,
    toState: "captured",
    revision: 1,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: command.actor.kind,
    occurredAt: command.occurredAt,
    reason: "sanitized candidate captured",
    evidenceReferences: evidenceReferences.map(({ evidenceId }) => evidenceId),
  });
}

// Captured records own their parsed values, so recursive freezing cannot mutate caller input.
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
