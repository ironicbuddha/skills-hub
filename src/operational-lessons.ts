import type { Writable } from "node:stream";

import { captureCandidateCommandSchema } from "./operational-lessons-schema.ts";

/** A fact category permitted at the sanitized capture boundary. */
export type FactClass = "operation" | "observed-outcome" | "trust-boundary" | "impact";

/** The identity performing capture and the authority under which it acts. */
export interface Actor {
  identity: string;
  authority: string;
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

/** A protected evidence pointer bound immutably to candidate revision 1. */
export interface EvidenceReference extends EvidenceReferenceInput {
  supportedRevision: 1;
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

/** Immutable revision 1 of a sanitized Candidate Lesson. */
export interface CandidateLesson {
  lessonId: string;
  schemaVersion: string;
  revision: 1;
  revisionId: string;
  state: "captured";
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
}

/** The append-only audit event emitted for a successful capture. */
export interface LifecycleEvent {
  eventId: string;
  lessonId: string;
  fromState: null;
  toState: "captured";
  revision: 1;
  actor: string;
  actorAuthority: string;
  occurredAt: string;
  reason: "sanitized candidate captured";
  evidenceReferences: readonly string[];
}

/**
 * Durable boundary for capture. Implementations atomically append both records
 * and reject an existing revision ID or event ID; no partial append is allowed.
 */
export interface CaptureSink {
  appendCapture(revision: CandidateLesson, event: LifecycleEvent): void;
}

/** A validation failure raised before the durable capture boundary is called. */
export class CandidateValidationError extends Error {
  override readonly name = "CandidateValidationError";
}

/**
 * Captures immutable revision 1 from allowlisted, sanitized incident facts.
 * Validation completes before the sink receives the revision and event pair.
 */
export function captureCandidate(input: unknown, sink: CaptureSink): CandidateLesson {
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

/** Returns guidance only for consumer-eligible revisions; candidates yield none. */
export function selectConsumerGuidance(lesson: CandidateLesson): null {
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
): CandidateLesson {
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
): LifecycleEvent {
  return deepFreeze({
    eventId: `${command.lessonId}:1:capture`,
    lessonId: command.lessonId,
    fromState: null,
    toState: "captured",
    revision: 1,
    actor: command.actor.identity,
    actorAuthority: command.actor.authority,
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
