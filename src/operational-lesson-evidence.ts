import { evidenceRetentionCommandSchema } from "./operational-lessons-schema.ts";
import { CandidateTransitionError, CandidateValidationError } from "./operational-lesson-errors.ts";
import type { ContentDigest } from "./operational-lessons-schema.ts";
import type { Actor } from "./operational-lessons.ts";

/** Supported roles an Evidence Reference can play in lesson governance. */
export type EvidenceKind = "source" | "recurrence" | "regression";

/** A protected pointer to evidence, excluding the unsafe evidence itself. */
export interface EvidenceReferenceInput {
  evidenceId: string;
  kind: EvidenceKind;
  sanitizedSummary: string;
  classification: string;
  accessBoundary: string;
  observedAt: string;
  collector: string;
  immutableLocator?: string | undefined;
  contentDigest?: ContentDigest | undefined;
  retention: string;
}

/** Source evidence accepted at the sanitized capture boundary. */
export type SourceEvidenceReferenceInput = EvidenceReferenceInput & { kind: "source" };

/** A protected evidence pointer bound immutably to one candidate revision. */
export interface EvidenceReference extends EvidenceReferenceInput {
  supportedRevision: number;
}

/** Recurrence or Regression Evidence accepted by the approval boundary. */
export type ApprovalEvidenceReference = EvidenceReference & { kind: "recurrence" | "regression" };

/** Durable explanation retained after the referenced evidence is deleted by policy. */
export interface EvidenceTombstone {
  evidenceId: string;
  kind: EvidenceKind;
  supportedRevision: number;
  sanitizedSummary: string;
  classification: string;
  accessBoundary: string;
  observedAt: string;
  collector: string;
  contentDigest: ContentDigest;
  retention: string;
  deletedAt: string;
  deletedBy: string;
  deletionAuthority: string;
  deletionActorKind: Actor["kind"];
  deletionReason: string;
}

/** Audit event for retention-driven deletion of one exact Evidence Reference. */
export interface EvidenceRetentionLifecycleEvent {
  eventId: string;
  evidenceId: string;
  fromState: "available";
  toState: "retention-deleted";
  revision: number;
  supportedRevision: number;
  actor: string;
  actorAuthority: string;
  actorKind: Actor["kind"];
  occurredAt: string;
  reason: "evidence deleted under retention policy";
  contentDigest: ContentDigest;
  outcome: "completed";
}

/** Atomic boundary replacing retained evidence with its tombstone and audit event. */
export interface EvidenceRetentionSink {
  replaceEvidenceWithTombstone(
    reference: Readonly<EvidenceReference>,
    tombstone: Readonly<EvidenceTombstone>,
    event: Readonly<EvidenceRetentionLifecycleEvent>,
  ): void;
}

/** Deletes expired evidence without leaving an unexplained gap in immutable lineage. */
export function deleteEvidenceForRetention(
  reference: Readonly<EvidenceReference>,
  input: unknown,
  sink: EvidenceRetentionSink,
): EvidenceTombstone {
  const parsed = evidenceRetentionCommandSchema.safeParse(input);
  if (!parsed.success) {
    throw new CandidateValidationError(parsed.error.issues.map(({ message }) => message).join("; "));
  }
  const command = parsed.data;
  if (Date.parse(command.occurredAt) < retentionDeadline(reference)) {
    throw new CandidateTransitionError("evidence cannot be deleted before its retention period elapses");
  }
  if (reference.contentDigest && reference.contentDigest !== command.contentDigest) {
    throw new CandidateTransitionError("retention deletion must preserve the immutable evidence digest");
  }

  const tombstone = freezeEvidenceTombstone(reference, command);
  const event = freezeRetentionEvent(reference, command);
  sink.replaceEvidenceWithTombstone(reference, tombstone, event);
  return tombstone;
}

function retentionDeadline(reference: Readonly<EvidenceReference>): number {
  const duration = /^(\d+)([dhm])$/u.exec(reference.retention);
  if (!duration) return Date.parse(reference.retention);
  const unitMilliseconds = { d: 86_400_000, h: 3_600_000, m: 60_000 } as const;
  return Date.parse(reference.observedAt)
    + Number(duration[1]) * unitMilliseconds[duration[2] as keyof typeof unitMilliseconds];
}

function freezeEvidenceTombstone(
  reference: Readonly<EvidenceReference>,
  command: ReturnType<typeof evidenceRetentionCommandSchema.parse>,
): Readonly<EvidenceTombstone> {
  return Object.freeze({
    evidenceId: reference.evidenceId,
    kind: reference.kind,
    supportedRevision: reference.supportedRevision,
    sanitizedSummary: reference.sanitizedSummary,
    classification: reference.classification,
    accessBoundary: reference.accessBoundary,
    observedAt: reference.observedAt,
    collector: reference.collector,
    contentDigest: command.contentDigest,
    retention: reference.retention,
    deletedAt: command.occurredAt,
    deletedBy: command.actor.identity,
    deletionAuthority: command.actor.authority,
    deletionActorKind: command.actor.kind,
    deletionReason: command.reason,
  });
}

function freezeRetentionEvent(
  reference: Readonly<EvidenceReference>,
  command: ReturnType<typeof evidenceRetentionCommandSchema.parse>,
): Readonly<EvidenceRetentionLifecycleEvent> {
  return Object.freeze({
    eventId: `${reference.evidenceId}:${reference.supportedRevision}:retention-deleted:${command.occurredAt}`,
    evidenceId: reference.evidenceId,
    fromState: "available",
    toState: "retention-deleted",
    revision: reference.supportedRevision,
    supportedRevision: reference.supportedRevision,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
    actorKind: command.actor.kind,
    occurredAt: command.occurredAt,
    reason: "evidence deleted under retention policy",
    contentDigest: command.contentDigest,
    outcome: "completed",
  });
}
