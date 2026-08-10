import {
  conflictDiscoveryCommandSchema,
  conflictResolutionCommandSchema,
} from "./operational-lessons-schema.ts";
import {
  activateApprovedLesson,
  CandidateTransitionError,
  CandidateValidationError,
  exposeUnreconciledEnforcementDrift,
} from "./operational-lessons.ts";
import type {
  ActivationSink,
  ActiveLesson,
  Actor,
  ApprovedLesson,
  OperationalLesson,
  RetiredLesson,
} from "./operational-lessons.ts";

/** An exact lesson revision participating in a Conflict. */
export interface LessonRevisionReference {
  lessonId: string;
  revisionId: string;
}

/** An explicit, immutable contradiction between exact lesson revisions. */
export interface ConflictRecord {
  conflictId: string;
  lessonRevisions: readonly Readonly<LessonRevisionReference>[];
  overlappingScope: string;
  contradictoryObligations: readonly string[];
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
  resultingLessonRevisions: readonly Readonly<LessonRevisionReference>[];
}

/** Audit event emitted when credible harm removes active guidance from consumer eligibility. */
export interface ConflictSuspensionLifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: "active";
  toState: "retired";
  revision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "active lesson suspended by credible harmful conflict";
  conflictId: string;
  unreconciledEnforcementLinks: readonly string[];
  outcome: "completed";
}

/** Atomic durable boundary for a Conflict and every suspension it causes. */
export interface ConflictSink {
  recordConflict(
    conflict: ConflictRecord,
    suspended: readonly RetiredLesson[],
    events: readonly ConflictSuspensionLifecycleEvent[],
  ): void;
}

/** Append-only durable boundary retaining both versions of a resolved Conflict. */
export interface ConflictResolutionSink {
  appendConflictResolution(prior: ConflictRecord, resolved: ConflictRecord): void;
}

/** Records an explicit Conflict and atomically suspends any credibly harmed active guidance. */
export function discoverConflict(
  affected: readonly OperationalLesson[],
  input: unknown,
  sink: ConflictSink,
): { conflict: ConflictRecord; affected: readonly OperationalLesson[] } {
  const parsed = conflictDiscoveryCommandSchema.safeParse(input);
  if (!parsed.success) throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  const { actor, occurredAt, conflict: discovered } = parsed.data;
  const affectedKeys = new Set(affected.map(({ lessonId, revisionId }) => `${lessonId}\0${revisionId}`));
  const referenceKeys = new Set(discovered.lessonRevisions.map(({ lessonId, revisionId }) =>
    `${lessonId}\0${revisionId}`));
  const exactAffectedSet = affected.length > 0
    && affectedKeys.size === affected.length
    && referenceKeys.size === discovered.lessonRevisions.length
    && affectedKeys.size === referenceKeys.size
    && [...affectedKeys].every((key) => referenceKeys.has(key));
  if (!exactAffectedSet) {
    throw new CandidateTransitionError("Conflict must identify every affected exact revision");
  }
  const conflict = deepFreeze({
    ...discovered,
    discoveredAt: occurredAt,
    discoveredBy: actor.identity,
    status: "open" as const,
    resolutionRationale: null,
    resolutionAuthority: null,
    exceptionExpiresAt: null,
    resultingLessonRevisions: [],
  });
  const affectedAfterDiscovery = affected.map((lesson) => suspendIfHarmed(lesson, conflict, actor, occurredAt));
  const suspended = affectedAfterDiscovery.filter((lesson, index): lesson is RetiredLesson =>
    lesson.state === "retired" && affected[index]?.state === "active");
  const events = suspended.map((lesson) => suspensionEvent(lesson, conflict, actor, occurredAt));
  sink.recordConflict(conflict, suspended, events);
  return deepFreeze({ conflict, affected: affectedAfterDiscovery });
}

/** Appends an accountable human resolution while leaving the open Conflict intact in history. */
export function resolveConflict(
  conflict: ConflictRecord,
  input: unknown,
  sink: ConflictResolutionSink,
): ConflictRecord {
  const parsed = conflictResolutionCommandSchema.safeParse(input);
  if (!parsed.success) throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  if (conflict.status !== "open" || Date.parse(parsed.data.occurredAt) < Date.parse(conflict.discoveredAt)) {
    throw new CandidateTransitionError("only an open Conflict can receive a later resolution");
  }
  const resolved = deepFreeze({
    ...conflict,
    status: parsed.data.status,
    resolutionRationale: parsed.data.rationale,
    resolutionAuthority: parsed.data.actor.authority,
    exceptionExpiresAt: parsed.data.exceptionExpiresAt ?? null,
    resultingLessonRevisions: parsed.data.resultingLessonRevisions,
  });
  sink.appendConflictResolution(conflict, resolved);
  return resolved;
}

/** Activates a reviewed safe replacement after the Conflict explicitly names that result. */
export function activateSafeConflictReplacement(
  suspended: RetiredLesson,
  replacement: ApprovedLesson,
  conflict: ConflictRecord,
  input: unknown,
  sink: ActivationSink,
): ActiveLesson {
  const suspendedIsAffected = conflict.lessonRevisions.some((reference) =>
    reference.lessonId === suspended.lessonId && reference.revisionId === suspended.revisionId);
  const replacementIsResult = conflict.resultingLessonRevisions.some((reference) =>
    reference.lessonId === replacement.lessonId && reference.revisionId === replacement.revisionId);
  if (suspended.retirementReason !== "suspended"
    || conflict.status !== "resolved"
    || !suspendedIsAffected
    || !replacementIsResult) {
    throw new CandidateTransitionError("safe replacement must be an explicit result of the resolved Conflict");
  }
  return activateApprovedLesson(replacement, input, sink);
}

function suspendIfHarmed(
  lesson: OperationalLesson,
  conflict: ConflictRecord,
  actor: Actor,
  occurredAt: string,
): OperationalLesson {
  if (lesson.state !== "active" || !conflict.credibleHarm) return lesson;
  const reconciliation = exposeUnreconciledEnforcementDrift(lesson);
  return deepFreeze({
    ...reconciliation.lesson,
    state: "retired" as const,
    retiredAt: occurredAt,
    retiredBy: actor.identity,
    retirementReason: "suspended",
  });
}

function suspensionEvent(
  lesson: RetiredLesson,
  conflict: ConflictRecord,
  actor: Actor,
  occurredAt: string,
): ConflictSuspensionLifecycleEvent {
  return deepFreeze({
    eventId: `${lesson.lessonId}:${lesson.revision}:suspended:${conflict.conflictId}`,
    lessonId: lesson.lessonId,
    fromState: "active",
    toState: "retired",
    revision: lesson.revision,
    actor: actor.identity,
    actorAuthority: actor.authority,
    actorKind: actor.kind,
    occurredAt,
    reason: "active lesson suspended by credible harmful conflict",
    conflictId: conflict.conflictId,
    unreconciledEnforcementLinks: lesson.enforcementLinks
      .filter(({ deploymentState }) => deploymentState === "drifted")
      .map(({ linkId }) => linkId),
    outcome: "completed",
  });
}

function deepFreeze<Value>(value: Value): Readonly<Value> {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}
