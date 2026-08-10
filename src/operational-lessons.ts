import type { Writable } from "node:stream";

import {
  activationAttemptContextSchema,
  activationCommandSchema,
  activeRevisionCommandSchema,
  activeLessonDeadlineCommandSchema,
  activeLessonReviewCommandSchema,
  approvalAttemptContextSchema,
  approvalCommandSchema,
  captureCandidateCommandSchema,
  enforcementLinkTransitionCommandSchema,
  materialRevisionCommandSchema,
  rejectionCommandSchema,
  reviewAttemptContextSchema,
  reviewSubmissionCommandSchema,
  terminalDispositionCommandSchema,
} from "./operational-lessons-schema.ts";
import type {
  ConflictRecord,
  ConflictSuspensionLifecycleEvent,
  LessonRevisionReference,
} from "./operational-lesson-conflicts.ts";

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

export type EnforcementDeploymentState = "planned" | "ready" | "active" | "drifted" | "disabled" | "removed";

export interface EnforcementVerificationEvidence {
  evidenceId: string;
  kind: "deployment" | "drift" | "disablement" | "removal";
  outcome: "passed" | "failed";
  verifiedAt: string;
  immutableLocator: string;
}

export interface EnforcementDeployment {
  version: string;
  deployedAt: string;
}

/** One independently deployed projection or control derived from an exact Lesson Revision. */
export interface EnforcementLink {
  linkId: string;
  controlClass: string;
  target: string;
  owner: string;
  implementedRevisionId: string;
  deploymentState: EnforcementDeploymentState;
  verificationEvidence: EnforcementVerificationEvidence | null;
  deployment: EnforcementDeployment | null;
  bypassPolicy: string;
  rollbackOperation: string;
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
    lessonRevisions: LessonRevisionReference[];
    overlappingScope: string;
    contradictoryObligations: string[];
    discoveredAt: string;
    discoveredBy: string;
    discoveryProvenance: string;
    severity: "low" | "medium" | "high" | "critical";
    blocking: boolean;
    credibleHarm: boolean;
    status: "open" | "resolved" | "excepted";
    owner: string;
    resolutionRationale: string | null;
    resolutionAuthority: string | null;
    exceptionExpiresAt: string | null;
    resultingLessonRevisions: LessonRevisionReference[];
  }[];
  requiredEnforcementClasses: string[];
  enforcementLinks: EnforcementLink[];
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

export interface NonDeterminismRationale {
  rationale: string;
  approvedBy: string;
  authority: string;
  approvedAt: string;
}

export interface EnforcementWaiver {
  controlClass: string;
  reason: string;
  approvedBy: string;
  authority: string;
  approvedAt: string;
  expiresAt: string;
}

export interface ActivationCommand {
  actor: Actor;
  occurredAt: string;
  revisionId: string;
  regressionEvidence?: string[] | undefined;
  nonDeterminismRationale?: NonDeterminismRationale | undefined;
  enforcementWaivers: EnforcementWaiver[];
}

export interface EnforcementLinkTransitionCommand {
  actor: Actor;
  occurredAt: string;
  deploymentState: EnforcementDeploymentState;
  verificationEvidence: EnforcementVerificationEvidence | null;
  deployment: EnforcementDeployment | null;
  reason: string;
}

export interface ActiveLesson extends CandidateLessonFields {
  state: "active";
  reviewAssignment: Readonly<ReviewAssignment>;
  approval: Readonly<ApprovalRecord>;
  activatedAt: string;
  replaces?: readonly Readonly<{ lessonId: string; revisionId: string }>[];
}

/** A previously active revision retained for lineage after its successor replaces it. */
export interface SupersededLesson extends CandidateLessonFields {
  state: "superseded";
  reviewAssignment: Readonly<ReviewAssignment>;
  approval: Readonly<ApprovalRecord>;
  activatedAt: string;
  supersededAt: string;
  supersededByLessonId: string;
  supersededByRevisionId: string;
}

/** An active replacement carrying the reverse side of cross-lesson lineage. */
export interface ActiveReplacementLesson extends ActiveLesson {
  replaces: readonly Readonly<{ lessonId: string; revisionId: string }>[];
}

/** Active guidance ended by a human without a replacement. */
export interface RetiredLesson extends CandidateLessonFields {
  state: "retired";
  reviewAssignment: Readonly<ReviewAssignment>;
  approval: Readonly<ApprovalRecord>;
  activatedAt: string;
  retiredAt: string;
  retiredBy: string;
  retirementReason: string;
}

export type CandidateLesson =
  | CapturedCandidateLesson
  | UnderReviewCandidateLesson
  | RejectedCandidateLesson;

export type OperationalLesson = CandidateLesson | ApprovedLesson | ActiveLesson | SupersededLesson | RetiredLesson;

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

/** Audit event for creating an under-review successor to an active revision. */
export interface ActiveRevisionLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "active";
  toState: "under_review";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "active lesson revision submitted for human review";
  predecessorRevisionId: string;
  changeSummary: string;
  reviewAssignment: Readonly<ReviewAssignment>;
  outcome: "completed";
}

/** Audit event for an active revision attempt with no material change. */
export interface BlockedActiveRevisionLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "active";
  toState: "active";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "active revision contained no changed value";
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

export interface ActivationLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "approved";
  toState: "active";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "activation gates satisfied";
  regressionEvidence: readonly string[];
  enforcementWaivers: readonly Readonly<EnforcementWaiver>[];
  outcome: "completed";
}

export interface BlockedActivationLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "approved";
  toState: "approved";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "activation gates were not satisfied";
  outcome: "blocked";
}

/** Audit event for one independently tracked control deployment transition. */
export interface EnforcementLinkLifecycleEvent {
  eventId: string;
  lessonId: string;
  revision: number;
  lessonState: ApprovedLesson["state"] | ActiveLesson["state"] | SupersededLesson["state"] | RetiredLesson["state"];
  fromState: EnforcementLinkLifecycleEvent["lessonState"];
  toState: EnforcementLinkLifecycleEvent["lessonState"];
  linkId: string;
  target: string;
  fromDeploymentState: EnforcementDeploymentState;
  toDeploymentState: EnforcementDeploymentState;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: string;
  verificationEvidence: Readonly<EnforcementVerificationEvidence> | null;
  deployment: Readonly<EnforcementDeployment> | null;
  outcome: "completed";
}

/** Audit event covering both sides of one successful revision replacement. */
export interface ReplacementLifecycleEvent {
  eventId: string;
  lessonId: string;
  predecessorRevisionId: string;
  predecessorFromState: "active";
  predecessorToState: "superseded";
  successorRevisionId: string;
  successorFromState: "approved";
  successorToState: "active";
  fromState: "approved";
  toState: "active";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "approved successor replaced active predecessor";
  unreconciledEnforcementLinks: readonly string[];
  outcome: "completed";
}

/** Audit event for ending one lesson in favor of a separately active lesson. */
export interface CrossLessonSupersessionLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "active";
  toState: "superseded";
  revision: number;
  replacementLessonId: string;
  replacementRevisionId: string;
  actor: string;
  actorAuthority: string;
  actorKind: "human";
  occurredAt: string;
  reason: "active lesson superseded by cross-lesson replacement";
  dispositionReason: string;
  unreconciledEnforcementLinks: readonly string[];
  outcome: "completed";
}

/** Audit event for ending active guidance without a replacement. */
export interface RetirementLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "active";
  toState: "retired";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: "human";
  occurredAt: string;
  reason: "active lesson retired without replacement";
  dispositionReason: string;
  unreconciledEnforcementLinks: readonly string[];
  outcome: "completed";
}

/** Detectable alert that leaves the active revision and its semantics unchanged. */
export interface OverdueReviewLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "active";
  toState: "active";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "active lesson review is overdue";
  reviewAt: string;
  outcome: "alerted";
}

/** Audit record for an accountable periodic review of active guidance. */
export interface ActiveLessonReviewLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "active";
  toState: "active";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: "human";
  occurredAt: string;
  reason: "active lesson review completed";
  reviewOutcome: string;
  evidenceConsidered: readonly string[];
  nextReviewAt?: string | undefined;
  expiresAt?: string | undefined;
  outcome: "completed";
}

/** Automatic terminal transition once the approved hard expiry is reached. */
export interface ExpiryLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "active";
  toState: "retired";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "active lesson approval expired";
  expiresAt: string;
  retirementReason: "expired";
  unreconciledEnforcementLinks: readonly string[];
  outcome: "completed";
}

/** Audit event emitted when successor activation or lineage blocks replacement. */
export type BlockedReplacementLifecycleEvent = Omit<BlockedActivationLifecycleEvent, "reason"> & {
  reason: "replacement activation gates were not satisfied";
};

export type LifecycleEvent =
  | CaptureLifecycleEvent
  | ReviewLifecycleEvent
  | BlockedReviewLifecycleEvent
  | RevisionLifecycleEvent
  | BlockedRevisionLifecycleEvent
  | ActiveRevisionLifecycleEvent
  | BlockedActiveRevisionLifecycleEvent
  | RejectionLifecycleEvent
  | BlockedRejectionLifecycleEvent
  | ApprovalLifecycleEvent
  | BlockedApprovalLifecycleEvent
  | ActivationLifecycleEvent
  | BlockedActivationLifecycleEvent
  | EnforcementLinkLifecycleEvent
  | ReplacementLifecycleEvent
  | BlockedReplacementLifecycleEvent
  | CrossLessonSupersessionLifecycleEvent
  | RetirementLifecycleEvent
  | OverdueReviewLifecycleEvent
  | ActiveLessonReviewLifecycleEvent
  | ExpiryLifecycleEvent
  | ConflictSuspensionLifecycleEvent;

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

/** Durable boundary for creating an under-review successor while its predecessor stays active. */
export interface ActiveRevisionSink {
  appendActiveRevision(revision: UnderReviewCandidateLesson, event: ActiveRevisionLifecycleEvent): void;
  appendBlockedActiveRevision(event: BlockedActiveRevisionLifecycleEvent): void;
}

export interface RejectionSink {
  appendRejection(revision: RejectedCandidateLesson, event: RejectionLifecycleEvent): void;
  appendBlockedRejection(event: BlockedRejectionLifecycleEvent): void;
}

export interface ApprovalSink {
  appendApproval(revision: ApprovedLesson, event: ApprovalLifecycleEvent): void;
  appendBlockedApproval(event: BlockedApprovalLifecycleEvent): void;
}

export interface ActivationSink {
  /** Atomically makes this revision the lesson's sole active revision and appends the event. */
  activateAsSoleRevision(revision: ActiveLesson, event: ActivationLifecycleEvent): void;
  appendBlockedActivation(event: BlockedActivationLifecycleEvent): void;
}

type GovernedLesson = ApprovedLesson | ActiveLesson | SupersededLesson | RetiredLesson;

/** Atomic boundary for replacing one control record and appending its audit event. */
export interface EnforcementLinkSink {
  replaceEnforcementLink(
    prior: Readonly<EnforcementLink>,
    updated: Readonly<EnforcementLink>,
    event: EnforcementLinkLifecycleEvent,
  ): void;
}

/** Durable boundary for committing both consumer-visible sides of a lesson replacement. */
export interface ReplacementSink {
  /** Atomically supersedes the predecessor, activates the successor, and appends the event. */
  replaceActiveRevision(
    predecessor: SupersededLesson,
    successor: ActiveLesson,
    event: ReplacementLifecycleEvent,
  ): void;
  appendBlockedReplacement(event: BlockedReplacementLifecycleEvent): void;
}

/** Durable boundary preserving both historical revisions and both lineage directions. */
export interface CrossLessonSupersessionSink {
  supersedeWithActiveReplacement(
    superseded: SupersededLesson,
    replacement: ActiveReplacementLesson,
    event: CrossLessonSupersessionLifecycleEvent,
  ): void;
}

/** Durable boundary appending a retired revision and its Lifecycle Event. */
export interface RetirementSink {
  retireActiveRevision(retired: RetiredLesson, event: RetirementLifecycleEvent): void;
}

/** Atomic boundary for deadline alerts and any automatic expiry transition. */
export interface ActiveLessonDeadlineSink {
  applyDeadlineOutcome(
    lesson: ActiveLesson | RetiredLesson,
    events: readonly (OverdueReviewLifecycleEvent | ExpiryLifecycleEvent)[],
  ): void;
}

/** Durable boundary for an accountable review that does not mutate the revision. */
export interface ActiveLessonReviewSink {
  appendCompletedReview(active: ActiveLesson, event: ActiveLessonReviewLifecycleEvent): void;
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
  changes: {
    [Field in keyof Pick<
      CandidateLessonFields,
      | "title" | "failureMode" | "evidenceSummary" | "confidence"
      | "recurrenceSignature" | "invariant" | "guidance" | "owner"
    >]?: CandidateLessonFields[Field] | undefined;
  };
}

type DefinedMaterialChanges = Partial<Pick<
  CandidateLessonFields,
  | "title" | "failureMode" | "evidenceSummary" | "confidence"
  | "recurrenceSignature" | "invariant" | "guidance" | "owner"
>>;

/** Material revision and accountable review assignment for an active lesson. */
export interface ActiveRevisionCommand extends MaterialRevisionCommand {
  assignment: ReviewAssignment;
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
  const changedFields = materialChangesFrom(candidate, command.changes);
  if (!changedFields) {
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

/** Creates an under-review successor without changing the active predecessor. */
export function reviseActiveLesson(
  predecessor: ActiveLesson,
  input: unknown,
  sink: ActiveRevisionSink,
): UnderReviewCandidateLesson {
  const parsed = activeRevisionCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }
  const command: ActiveRevisionCommand = parsed.data;
  const changedFields = materialChangesFrom(predecessor, command.changes);
  if (!changedFields) {
    const blockedEvent = deepFreeze({
      eventId: `${predecessor.lessonId}:${predecessor.revision}:active-revision-blocked:${command.occurredAt}`,
      lessonId: predecessor.lessonId,
      fromState: "active" as const,
      toState: "active" as const,
      revision: predecessor.revision,
      actor: command.actor.identity,
      actorAuthority: command.actor.authority,
      actorKind: command.actor.kind,
      occurredAt: command.occurredAt,
      reason: "active revision contained no changed value" as const,
      outcome: "blocked" as const,
    });
    sink.appendBlockedActiveRevision(blockedEvent);
    throw new CandidateTransitionError(blockedEvent.reason);
  }
  const successor = createActiveSuccessor(predecessor, command, changedFields);
  const event = createActiveRevisionEvent(predecessor, command, successor.revision);
  sink.appendActiveRevision(successor, event);
  return successor;
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
      record.conflictId === conflictId && record.lessonRevisions.some(({ lessonId, revisionId }) =>
        lessonId === candidate.lessonId && revisionId === candidate.revisionId)))
    && parsed.data.conflictRecords.every((record) =>
      record.lessonRevisions.some(({ lessonId, revisionId }) =>
        lessonId === candidate.lessonId && revisionId === candidate.revisionId)
      && parsed.data.conflictReferences.includes(record.conflictId)
      && (record.status === "open" || Boolean(record.resolutionRationale && record.resolutionAuthority))
      && (record.status !== "excepted"
        || Boolean(record.exceptionExpiresAt
          && Date.parse(record.exceptionExpiresAt) > Date.parse(parsed.data.occurredAt))));
  const enforcementIsBound = parsed.success
    && new Set(parsed.data.enforcementLinks.map(({ linkId }) => linkId)).size === parsed.data.enforcementLinks.length
    && parsed.data.enforcementLinks.every(({ implementedRevisionId }) => implementedRevisionId === candidate.revisionId)
    && parsed.data.enforcementLinks.every(({ deployment, verificationEvidence }) =>
      (!deployment || Date.parse(deployment.deployedAt) <= Date.parse(parsed.data.occurredAt))
      && (!verificationEvidence
        || Date.parse(verificationEvidence.verifiedAt) <= Date.parse(parsed.data.occurredAt)))
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
  const approved = deepFreeze({
    ...candidate,
    state: "approved" as const,
    approval,
  });
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

/** Activates an approved exact revision only after all deployment gates pass. */
export function activateApprovedLesson(
  approved: ApprovedLesson,
  input: unknown,
  sink: ActivationSink,
  enforcementLinks: readonly Readonly<EnforcementLink>[] = approved.approval.enforcementLinks,
): ActiveLesson {
  const parsed = activationCommandSchema.safeParse(input);
  const attempt = activationAttemptContextSchema.safeParse(input);
  const command = parsed.success ? parsed.data : undefined;
  const approval = approved.approval;
  const approvalIsCurrent = command?.revisionId === approved.revisionId
    && approval.revisionId === approved.revisionId;
  const enforcementLinksAreBound = enforcementLinksMatchApproval(approved, enforcementLinks);
  const regressionEvidenceIsValid = Boolean(command && (
    command.regressionEvidence?.every((evidenceId) => approval.evidenceReferences.some((reference) =>
      reference.evidenceId === evidenceId
      && reference.kind === "regression"
      && reference.supportedRevision === approved.revision
      && Date.parse(reference.observedAt) <= Date.parse(command.occurredAt)))
    || (command.nonDeterminismRationale
      && isAuthorizedAttestation(command.nonDeterminismRationale, approval, command.occurredAt))
  ));
  const hasNoOpenBlockingConflict = Boolean(command && approval.conflictRecords.every((conflict) =>
    !conflict.blocking
    || conflict.status === "resolved"
    || (conflict.status === "excepted"
      && conflict.exceptionExpiresAt
      && Date.parse(conflict.exceptionExpiresAt) > Date.parse(command.occurredAt))));
  const enforcementIsReady = Boolean(command && approval.requiredEnforcementClasses.every((controlClass) => {
    const readyLink = enforcementLinks.some((link) =>
      link.controlClass === controlClass
      && link.implementedRevisionId === approved.revisionId
      && (link.deploymentState === "ready" || link.deploymentState === "active"));
    const waiver = command.enforcementWaivers.find((candidate) => candidate.controlClass === controlClass);
    const validWaiver = waiver
      && isAuthorizedAttestation(waiver, approval, command.occurredAt)
      && Date.parse(waiver.expiresAt) > Date.parse(command.occurredAt);
    return readyLink || Boolean(validWaiver);
  }));
  const timingIsValid = Boolean(command
    && Date.parse(command.occurredAt) >= Date.parse(approval.approvedAt)
    && (!approval.expiresAt || Date.parse(command.occurredAt) < Date.parse(approval.expiresAt)));

  if (!parsed.success || !approvalIsCurrent || !regressionEvidenceIsValid
    || !hasNoOpenBlockingConflict || !enforcementLinksAreBound || !enforcementIsReady || !timingIsValid) {
    if (!attempt.success) {
      throw new CandidateValidationError(parsed.success
        ? "invalid activation actor context"
        : parsed.error.issues.map(({ message }) => message).join("; "));
    }
    const blockedEvent = deepFreeze({
      eventId: `${approved.lessonId}:${approved.revision}:activation-blocked:${attempt.data.occurredAt}`,
      lessonId: approved.lessonId,
      fromState: "approved" as const,
      toState: "approved" as const,
      revision: approved.revision,
      actor: attempt.data.actor.identity,
      actorAuthority: attempt.data.actor.authority,
      actorKind: attempt.data.actor.kind,
      occurredAt: attempt.data.occurredAt,
      reason: "activation gates were not satisfied" as const,
      outcome: "blocked" as const,
    });
    sink.appendBlockedActivation(blockedEvent);
    throw new CandidateTransitionError(blockedEvent.reason);
  }

  const active = deepFreeze({
    ...approved,
    state: "active" as const,
    activatedAt: command.occurredAt,
  });
  const event = deepFreeze({
    eventId: `${approved.lessonId}:${approved.revision}:activated`,
    lessonId: approved.lessonId,
    fromState: "approved" as const,
    toState: "active" as const,
    revision: approved.revision,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: command.actor.kind,
    occurredAt: command.occurredAt,
    reason: "activation gates satisfied" as const,
    regressionEvidence: command.regressionEvidence ?? [],
    enforcementWaivers: command.enforcementWaivers,
    outcome: "completed" as const,
  });
  sink.activateAsSoleRevision(active, event);
  return active;
}

/** Advances or reconciles one Enforcement Link without rewriting its immutable Lesson Version. */
export function transitionEnforcementLink(
  lesson: GovernedLesson,
  prior: Readonly<EnforcementLink>,
  input: unknown,
  sink: EnforcementLinkSink,
): EnforcementLink {
  const parsed = enforcementLinkTransitionCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }
  const command: EnforcementLinkTransitionCommand = parsed.data;
  if (!linkMatchesApprovedContract(lesson, prior)) {
    throw new CandidateTransitionError("the Enforcement Link does not belong to this Lesson Revision");
  }
  if (prior.deploymentState === "removed" && command.deploymentState !== "removed") {
    throw new CandidateTransitionError("a removed Enforcement Link cannot be redeployed");
  }
  if ((lesson.state === "superseded" || lesson.state === "retired")
    && command.deploymentState !== "disabled" && command.deploymentState !== "removed") {
    throw new CandidateTransitionError("a terminal Lesson Version cannot redeploy an Enforcement Link");
  }
  if (Date.parse(command.occurredAt) < Date.parse(lesson.approval.approvedAt)) {
    throw new CandidateTransitionError("an Enforcement Link transition cannot predate lesson approval");
  }
  if (prior.deployment && !command.deployment) {
    throw new CandidateTransitionError("an Enforcement Link transition cannot erase deployment provenance");
  }

  const updated = deepFreeze({
    ...prior,
    deploymentState: command.deploymentState,
    verificationEvidence: command.verificationEvidence,
    deployment: command.deployment,
  });
  const event = deepFreeze({
    eventId: `${lesson.lessonId}:${lesson.revision}:enforcement:${prior.linkId}:${command.occurredAt}`,
    lessonId: lesson.lessonId,
    revision: lesson.revision,
    lessonState: lesson.state,
    fromState: lesson.state,
    toState: lesson.state,
    linkId: prior.linkId,
    target: prior.target,
    fromDeploymentState: prior.deploymentState,
    toDeploymentState: command.deploymentState,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: command.actor.kind,
    occurredAt: command.occurredAt,
    reason: command.reason,
    verificationEvidence: command.verificationEvidence,
    deployment: command.deployment,
    outcome: "completed" as const,
  });
  sink.replaceEnforcementLink(prior, updated, event);
  return updated;
}

/** Replaces one active revision with its approved successor in a single durable operation. */
export function replaceActiveLesson(
  predecessor: ActiveLesson,
  approvedSuccessor: ApprovedLesson,
  input: unknown,
  sink: ReplacementSink,
  enforcementLinks: {
    predecessor?: readonly Readonly<EnforcementLink>[];
    successor?: readonly Readonly<EnforcementLink>[];
  } = {},
): { predecessor: SupersededLesson; successor: ActiveLesson } {
  let replacement: { predecessor: SupersededLesson; successor: ActiveLesson } | undefined;
  activateApprovedLesson(approvedSuccessor, input, {
    activateAsSoleRevision(successor, activationEvent) {
      if (successor.lessonId !== predecessor.lessonId
        || successor.predecessorRevisionId !== predecessor.revisionId) {
        sink.appendBlockedReplacement(toBlockedReplacement(activationEvent));
        throw new CandidateTransitionError("replacement successor does not descend from the active revision");
      }
      const reconciliation = assessEnforcementReconciliation(
        predecessor,
        enforcementLinks.predecessor ?? predecessor.approval.enforcementLinks,
      );
      const superseded = deepFreeze({
        ...predecessor,
        state: "superseded" as const,
        supersededAt: activationEvent.occurredAt,
        supersededByLessonId: successor.lessonId,
        supersededByRevisionId: successor.revisionId,
      });
      const event = createReplacementEvent(
        predecessor,
        successor,
        activationEvent,
        reconciliation.unreconciledLinkIds,
      );
      sink.replaceActiveRevision(superseded, successor, event);
      replacement = { predecessor: superseded, successor };
    },
    appendBlockedActivation(event) {
      sink.appendBlockedReplacement(toBlockedReplacement(event));
    },
  }, enforcementLinks.successor ?? approvedSuccessor.approval.enforcementLinks);
  if (!replacement) throw new CandidateTransitionError("replacement was not committed");
  return replacement;
}

/** Ends active guidance by linking it atomically to an approved, active replacement lesson. */
export function supersedeActiveLessonAcrossLessons(
  predecessor: ActiveLesson,
  replacement: OperationalLesson,
  input: unknown,
  sink: CrossLessonSupersessionSink,
  enforcementLinks: readonly Readonly<EnforcementLink>[] = predecessor.approval.enforcementLinks,
): { superseded: SupersededLesson; replacement: ActiveReplacementLesson } {
  const command = parseTerminalDispositionCommand(input);
  if (replacement.state !== "active"
    || replacement.lessonId === predecessor.lessonId
    || replacement.approval.revisionId !== replacement.revisionId) {
    throw new CandidateTransitionError("cross-lesson replacement must be an approved active revision");
  }

  const reconciliation = assessEnforcementReconciliation(predecessor, enforcementLinks);
  const superseded = deepFreeze({
    ...predecessor,
    state: "superseded" as const,
    supersededAt: command.occurredAt,
    supersededByLessonId: replacement.lessonId,
    supersededByRevisionId: replacement.revisionId,
  });
  const activeReplacement = deepFreeze({
    ...replacement,
    replaces: [
      ...(replacement.replaces ?? []),
      { lessonId: predecessor.lessonId, revisionId: predecessor.revisionId },
    ],
  });
  const event = deepFreeze({
    eventId: `${predecessor.lessonId}:${predecessor.revision}:superseded:${command.occurredAt}`,
    lessonId: predecessor.lessonId,
    fromState: "active" as const,
    toState: "superseded" as const,
    revision: predecessor.revision,
    replacementLessonId: replacement.lessonId,
    replacementRevisionId: replacement.revisionId,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: "human" as const,
    occurredAt: command.occurredAt,
    reason: "active lesson superseded by cross-lesson replacement" as const,
    dispositionReason: command.reason,
    unreconciledEnforcementLinks: reconciliation.unreconciledLinkIds,
    outcome: "completed" as const,
  });
  sink.supersedeWithActiveReplacement(superseded, activeReplacement, event);
  return { superseded, replacement: activeReplacement };
}

/** Ends active guidance by recording a human retirement with no replacement. */
export function retireActiveLesson(
  active: ActiveLesson,
  input: unknown,
  sink: RetirementSink,
  enforcementLinks: readonly Readonly<EnforcementLink>[] = active.approval.enforcementLinks,
): RetiredLesson {
  const command = parseTerminalDispositionCommand(input);
  const reconciliation = assessEnforcementReconciliation(active, enforcementLinks);
  const retired = deepFreeze({
    ...active,
    state: "retired" as const,
    retiredAt: command.occurredAt,
    retiredBy: command.actor.identity,
    retirementReason: command.reason,
  });
  const event = deepFreeze({
    eventId: `${active.lessonId}:${active.revision}:retired`,
    lessonId: active.lessonId,
    fromState: "active" as const,
    toState: "retired" as const,
    revision: active.revision,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: "human" as const,
    occurredAt: command.occurredAt,
    reason: "active lesson retired without replacement" as const,
    dispositionReason: command.reason,
    unreconciledEnforcementLinks: reconciliation.unreconciledLinkIds,
    outcome: "completed" as const,
  });
  sink.retireActiveRevision(retired, event);
  return retired;
}

/** Evaluates mandatory-review and hard-expiry deadlines as one atomic outcome. */
export function evaluateActiveLessonDeadlines(
  active: ActiveLesson,
  input: unknown,
  sink: ActiveLessonDeadlineSink,
  latestReview?: ActiveLessonReviewLifecycleEvent,
  enforcementLinks: readonly Readonly<EnforcementLink>[] = active.approval.enforcementLinks,
): { lesson: ActiveLesson | RetiredLesson; overdueReview: boolean } {
  const parsed = activeLessonDeadlineCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }
  const command = parsed.data;
  if (latestReview && (latestReview.lessonId !== active.lessonId || latestReview.revision !== active.revision)) {
    throw new CandidateTransitionError("the latest review must belong to the active revision");
  }
  const occurredAt = Date.parse(command.occurredAt);
  if (latestReview && Date.parse(latestReview.occurredAt) > occurredAt) {
    throw new CandidateTransitionError("a future review cannot alter current deadline evaluation");
  }
  const reviewAt = latestReview?.nextReviewAt;
  const overdueReview = reviewAt
    ? occurredAt >= Date.parse(reviewAt)
    : latestReview ? false : occurredAt >= Date.parse(active.approval.reviewAt);
  const expiresAt = latestReview?.expiresAt ?? active.approval.expiresAt;
  const events: (OverdueReviewLifecycleEvent | ExpiryLifecycleEvent)[] = [];

  if (overdueReview) {
    events.push(deepFreeze({
      eventId: `${active.lessonId}:${active.revision}:review-overdue:${command.occurredAt}`,
      lessonId: active.lessonId,
      fromState: "active" as const,
      toState: "active" as const,
      revision: active.revision,
      actor: command.actor.identity,
      actorAuthority: command.actor.authority,
      actorKind: command.actor.kind,
      occurredAt: command.occurredAt,
      reason: "active lesson review is overdue" as const,
      reviewAt: reviewAt ?? active.approval.reviewAt,
      outcome: "alerted" as const,
    }));
  }

  let lesson: ActiveLesson | RetiredLesson = active;
  if (expiresAt && occurredAt >= Date.parse(expiresAt)) {
    const reconciliation = assessEnforcementReconciliation(active, enforcementLinks);
    lesson = deepFreeze({
      ...active,
      state: "retired" as const,
      retiredAt: command.occurredAt,
      retiredBy: command.actor.identity,
      retirementReason: "expired" as const,
    });
    events.push(deepFreeze({
      eventId: `${active.lessonId}:${active.revision}:expired:${expiresAt}`,
      lessonId: active.lessonId,
      fromState: "active" as const,
      toState: "retired" as const,
      revision: active.revision,
      actor: command.actor.identity,
      actorAuthority: command.actor.authority,
      actorKind: command.actor.kind,
      occurredAt: command.occurredAt,
      reason: "active lesson approval expired" as const,
      expiresAt,
      retirementReason: "expired" as const,
      unreconciledEnforcementLinks: reconciliation.unreconciledLinkIds,
      outcome: "completed" as const,
    }));
  }

  sink.applyDeadlineOutcome(lesson, events);
  return { lesson, overdueReview };
}

/** Records a human periodic review while preserving the immutable active revision. */
export function completeActiveLessonReview(
  active: ActiveLesson,
  input: unknown,
  sink: ActiveLessonReviewSink,
): ActiveLesson {
  const parsed = activeLessonReviewCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }
  const command = parsed.data;
  if (command.actor.authority !== active.reviewAssignment.requiredAuthority
    || !active.reviewAssignment.reviewers.some(({ identity }) => identity === command.actor.identity)) {
    throw new CandidateTransitionError("active lesson review requires an assigned human reviewer with the required authority");
  }
  const boundEvidenceIds = new Set([
    ...active.evidenceReferences.map(({ evidenceId }) => evidenceId),
    ...active.approval.evidenceReferences.map(({ evidenceId }) => evidenceId),
  ]);
  if (command.evidenceConsidered.some((evidenceId) => !boundEvidenceIds.has(evidenceId))) {
    throw new CandidateTransitionError("active lesson review evidence must be bound to the reviewed revision");
  }
  const event = deepFreeze({
    eventId: `${active.lessonId}:${active.revision}:reviewed:${command.occurredAt}`,
    lessonId: active.lessonId,
    fromState: "active" as const,
    toState: "active" as const,
    revision: active.revision,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: "human" as const,
    occurredAt: command.occurredAt,
    reason: "active lesson review completed" as const,
    reviewOutcome: command.outcome,
    evidenceConsidered: command.evidenceConsidered,
    nextReviewAt: command.nextReviewAt,
    expiresAt: command.expiresAt,
    outcome: "completed" as const,
  });
  sink.appendCompletedReview(active, event);
  return active;
}

/** Returns guidance only for consumer-eligible revisions; candidates yield none. */
export function selectConsumerGuidance(lesson: OperationalLesson): string | null {
  return lesson.state === "active" ? lesson.guidance : null;
}

function parseTerminalDispositionCommand(input: unknown) {
  const parsed = terminalDispositionCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }
  return parsed.data;
}

/** Writes Markdown as data without constructing interpreter source. */
export function publishMarkdown(markdown: string, destination: Writable): void {
  destination.write(markdown);
}

function materialChangesFrom(
  lesson: CandidateLessonFields,
  changes: MaterialRevisionCommand["changes"],
): DefinedMaterialChanges | null {
  const changed = Object.fromEntries(Object.entries(changes).filter(([field, value]) =>
    value !== undefined
    && JSON.stringify(value) !== JSON.stringify(lesson[field as keyof MaterialRevisionCommand["changes"]]),
  )) as DefinedMaterialChanges;
  return Object.keys(changed).length > 0 ? changed : null;
}

function createActiveSuccessor(
  predecessor: ActiveLesson,
  command: ActiveRevisionCommand,
  changes: DefinedMaterialChanges,
): UnderReviewCandidateLesson {
  const { reviewAssignment: _review, approval: _approval, activatedAt: _activated, ...prior } = predecessor;
  const revision = predecessor.revision + 1;
  return deepFreeze({
    ...prior,
    ...changes,
    revision,
    revisionId: `${predecessor.lessonId}:${revision}`,
    state: "under_review" as const,
    revisionCreatedAt: command.occurredAt,
    revisionCreatedBy: command.actor.identity,
    evidenceReferences: predecessor.evidenceReferences.map((reference) => ({ ...reference, supportedRevision: revision })),
    predecessorRevisionId: predecessor.revisionId,
    changeSummary: command.changeSummary,
    reviewAssignment: command.assignment,
  });
}

function createActiveRevisionEvent(
  predecessor: ActiveLesson,
  command: ActiveRevisionCommand,
  revision: number,
): ActiveRevisionLifecycleEvent {
  return deepFreeze({
    eventId: `${predecessor.lessonId}:${revision}:active-revision`,
    lessonId: predecessor.lessonId,
    fromState: "active" as const,
    toState: "under_review" as const,
    revision,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: command.actor.kind,
    occurredAt: command.occurredAt,
    reason: "active lesson revision submitted for human review" as const,
    predecessorRevisionId: predecessor.revisionId,
    changeSummary: command.changeSummary,
    reviewAssignment: command.assignment,
    outcome: "completed" as const,
  });
}

function createReplacementEvent(
  predecessor: ActiveLesson,
  successor: ActiveLesson,
  activation: ActivationLifecycleEvent,
  unreconciledEnforcementLinks: readonly string[],
): ReplacementLifecycleEvent {
  return deepFreeze({
    eventId: `${predecessor.lessonId}:${predecessor.revision}->${successor.revision}:replaced`,
    lessonId: predecessor.lessonId,
    predecessorRevisionId: predecessor.revisionId,
    predecessorFromState: "active" as const,
    predecessorToState: "superseded" as const,
    successorRevisionId: successor.revisionId,
    successorFromState: "approved" as const,
    successorToState: "active" as const,
    fromState: "approved" as const,
    toState: "active" as const,
    revision: successor.revision,
    actor: activation.actor,
    actorAuthority: activation.actorAuthority,
    actorKind: activation.actorKind,
    occurredAt: activation.occurredAt,
    reason: "approved successor replaced active predecessor" as const,
    unreconciledEnforcementLinks,
    outcome: "completed" as const,
  });
}

function toBlockedReplacement(
  event: ActivationLifecycleEvent | BlockedActivationLifecycleEvent,
): BlockedReplacementLifecycleEvent {
  return deepFreeze({
    eventId: `${event.lessonId}:${event.revision}:replacement-blocked:${event.occurredAt}`,
    lessonId: event.lessonId,
    fromState: "approved" as const,
    toState: "approved" as const,
    revision: event.revision,
    actor: event.actor,
    actorAuthority: event.actorAuthority,
    actorKind: event.actorKind,
    occurredAt: event.occurredAt,
    reason: "replacement activation gates were not satisfied" as const,
    outcome: "blocked" as const,
  });
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

function isAuthorizedAttestation(
  attestation: Pick<NonDeterminismRationale, "approvedBy" | "authority" | "approvedAt">,
  approval: ApprovalRecord,
  occurredAt: string,
): boolean {
  return attestation.approvedBy === approval.approver
    && attestation.authority === approval.authority
    && Date.parse(attestation.approvedAt) <= Date.parse(occurredAt);
}

function linkMatchesApprovedContract(lesson: GovernedLesson, link: Readonly<EnforcementLink>) {
  const approved = lesson.approval.enforcementLinks.find(({ linkId }) => linkId === link.linkId);
  return Boolean(approved
    && link.controlClass === approved.controlClass
    && link.target === approved.target
    && link.owner === approved.owner
    && link.implementedRevisionId === approved.implementedRevisionId
    && link.bypassPolicy === approved.bypassPolicy
    && link.rollbackOperation === approved.rollbackOperation);
}

function enforcementLinksMatchApproval(
  lesson: GovernedLesson,
  enforcementLinks: readonly Readonly<EnforcementLink>[],
) {
  return enforcementLinks.length === lesson.approval.enforcementLinks.length
    && new Set(enforcementLinks.map(({ linkId }) => linkId)).size === enforcementLinks.length
    && enforcementLinks.every((link) => linkMatchesApprovedContract(lesson, link));
}

/** Detects every linked control that still lacks verified disablement or removal. */
function assessEnforcementReconciliation(
  lesson: GovernedLesson,
  enforcementLinks: readonly Readonly<EnforcementLink>[],
) {
  if (!enforcementLinksMatchApproval(lesson, enforcementLinks)) {
    throw new CandidateTransitionError("reconciliation requires every Enforcement Link for the exact Lesson Revision");
  }
  const unreconciledLinkIds = enforcementLinks
    .filter(({ deploymentState }) => deploymentState !== "disabled" && deploymentState !== "removed")
    .map(({ linkId }) => linkId);
  return deepFreeze({ unreconciledLinkIds });
}

// Captured records own their parsed values, so recursive freezing cannot mutate caller input.
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
