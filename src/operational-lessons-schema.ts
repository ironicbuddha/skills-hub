import { z } from "zod";

const isoInstant = z.iso.datetime({ offset: true });
const prohibitedContent = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /\b(?:api[_ -]?key|password|secret|token)\s*[:=]\s*\S+/iu,
  /\b(?:ghp|github_pat|sk)-[A-Za-z0-9_-]{12,}\b/u,
  /\b(?:raw transcript|tool (?:stdout|stderr|output)|private reasoning|chain of thought)\b/iu,
  /^(?:user|assistant|system|tool|stdout|stderr)\s*:/iu,
  /<\/?(?:thinking|analysis)>/iu,
  /(?:^|\s)(?:#!|\$\(|`|(?:rm|touch|curl|wget|bash|sh|python|node)\s+(?:-[A-Za-z]|\/))/u,
];
const ordinaryText = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) => prohibitedContent.every((pattern) => !pattern.test(value)),
    "prohibited incident material is not allowed",
  );

// Capture accepts short, single-line facts. Dumps and payloads belong behind Evidence References.
const sanitizedText = ordinaryText
  .refine((value) => !/[\r\n\0]/u.test(value), "sanitized facts must be single-line text");

const factClass = z.enum(["operation", "observed-outcome", "trust-boundary", "impact"]);
const actor = z
  .object({ identity: ordinaryText, authority: ordinaryText, kind: z.enum(["human", "service"]) })
  .strict();
const sourceEvent = z
  .object({ sourceId: ordinaryText, sourceKind: ordinaryText, observedAt: isoInstant })
  .strict();
const incidentFact = z.object({ factClass, summary: sanitizedText }).strict();
const sanitization = z
  .object({
    method: z.literal("incident-fact-allowlist"),
    version: ordinaryText,
    actor: ordinaryText,
    sanitizedAt: isoInstant,
    allowlistedFactClasses: z.array(factClass).min(1),
    prohibitedContentExcluded: z.literal(true),
  })
  .strict();
const evidenceReference = z
  .object({
    evidenceId: ordinaryText,
    kind: z.literal("source"),
    sanitizedSummary: sanitizedText,
    classification: ordinaryText,
    accessBoundary: ordinaryText,
    observedAt: isoInstant,
    collector: ordinaryText,
    immutableLocator: ordinaryText,
    retention: ordinaryText,
  })
  .strict();
const confidence = z
  .object({
    level: z.enum(["hypothesis", "supported", "demonstrated"]),
    rationale: sanitizedText,
  })
  .strict();

const reviewAssignment = z
  .object({
    reviewers: z
      .array(z.object({ identity: ordinaryText, kind: z.literal("human") }).strict())
      .min(1),
    requiredAuthority: ordinaryText,
    assignedBy: ordinaryText,
    assignedAt: isoInstant,
    provenance: ordinaryText,
    status: z.literal("assigned"),
  })
  .strict();

/** Runtime schema for the public Candidate Lesson capture command. */
export const captureCandidateCommandSchema = z
  .object({
    lessonId: ordinaryText,
    schemaVersion: ordinaryText,
    title: sanitizedText,
    actor,
    occurredAt: isoInstant,
    sourceEvents: z.array(sourceEvent).min(1),
    incidentFacts: z.array(incidentFact).min(1),
    failureMode: sanitizedText,
    sanitization,
    evidenceSummary: sanitizedText,
    evidenceReferences: z.array(evidenceReference).min(1),
    confidence,
    recurrenceSignature: sanitizedText,
    invariant: sanitizedText,
    guidance: sanitizedText,
    owner: ordinaryText,
  })
  .strict()
  .superRefine((command, context) => {
    const declared = new Set(command.sanitization.allowlistedFactClasses);
    if (command.incidentFacts.some(({ factClass: value }) => !declared.has(value))) {
      context.addIssue({ code: "custom", message: "incident fact class was not declared by sanitization" });
    }
  });

/** Runtime schema for assigning a captured candidate to accountable human review. */
export const reviewSubmissionCommandSchema = z
  .object({
    actor,
    occurredAt: isoInstant,
    assignment: reviewAssignment,
  })
  .strict()
  .superRefine((command, context) => {
    if (command.assignment.assignedBy !== command.actor.identity) {
      context.addIssue({ code: "custom", message: "assignment provenance must name the assigning actor" });
    }
    if (command.assignment.assignedAt !== command.occurredAt) {
      context.addIssue({ code: "custom", message: "assignment time must match the review transition" });
    }
  });

/** Actor metadata retained when a governance-relevant review attempt is blocked. */
export const reviewAttemptContextSchema = z.object({ actor, occurredAt: isoInstant }).passthrough();

const materialChanges = z
  .object({
    title: sanitizedText.optional(),
    failureMode: sanitizedText.optional(),
    evidenceSummary: sanitizedText.optional(),
    confidence: confidence.optional(),
    recurrenceSignature: sanitizedText.optional(),
    invariant: sanitizedText.optional(),
    guidance: sanitizedText.optional(),
    owner: ordinaryText.optional(),
  })
  .strict()
  .refine((changes) => Object.keys(changes).length > 0, "a material revision requires changed content");

/** Runtime schema for creating a new immutable candidate revision. */
export const materialRevisionCommandSchema = z
  .object({
    actor,
    occurredAt: isoInstant,
    changeSummary: sanitizedText,
    changes: materialChanges,
  })
  .strict();

/** Runtime schema for a human rejection or owner-recorded withdrawal. */
export const rejectionCommandSchema = z
  .object({
    actor,
    occurredAt: isoInstant,
    disposition: z.enum(["rejected", "withdrawn"]),
    reason: sanitizedText,
  })
  .strict();

const regressionClaim = z.object({
  expectedNonOccurrence: sanitizedText,
  falsePositiveBoundary: sanitizedText,
}).strict();
const severeFirstOccurrence = z.object({
  justification: sanitizedText,
  deterministicRegressionEvidence: z.array(ordinaryText).min(1),
}).strict();
const approvalEvidenceReference = z.object({
  evidenceId: ordinaryText,
  kind: z.enum(["recurrence", "regression"]),
  supportedRevision: z.number().int().positive(),
  sanitizedSummary: sanitizedText,
  classification: ordinaryText,
  accessBoundary: ordinaryText,
  observedAt: isoInstant,
  collector: ordinaryText,
  immutableLocator: ordinaryText,
  retention: ordinaryText,
}).strict();
const conflictRecord = z.object({
  conflictId: ordinaryText,
  revisionIds: z.array(ordinaryText).min(2),
  overlappingScope: sanitizedText,
  contradictoryObligations: z.array(sanitizedText).min(2),
  discoveredAt: isoInstant,
  discoveredBy: ordinaryText,
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "resolved", "excepted"]),
  owner: ordinaryText,
  resolutionRationale: sanitizedText.nullable(),
  resolutionAuthority: ordinaryText.nullable(),
  exceptionExpiresAt: isoInstant.nullable(),
  resultingRevisionIds: z.array(ordinaryText),
}).strict();
const enforcementLink = z.object({
  linkId: ordinaryText,
  controlClass: ordinaryText,
  target: ordinaryText,
  owner: ordinaryText,
  implementedRevisionId: ordinaryText,
  deploymentState: z.enum(["planned", "ready", "active", "drifted", "disabled", "removed"]),
  verification: sanitizedText,
  bypassPolicy: sanitizedText,
  rollbackOperation: sanitizedText,
}).strict();
const rollbackPlan = z.object({
  affectedProjections: z.array(ordinaryText).min(1),
  recoveryAction: sanitizedText,
  verification: sanitizedText,
}).strict();

/** Runtime schema for approving one exact, governance-complete Lesson Revision. */
export const approvalCommandSchema = z
  .object({
    actor,
    occurredAt: isoInstant,
    revisionId: ordinaryText,
    rationale: sanitizedText,
    conditions: z.array(sanitizedText),
    waivers: z.array(sanitizedText),
    recurrenceEvidence: z.array(ordinaryText).min(1).optional(),
    severeFirstOccurrence: severeFirstOccurrence.optional(),
    evidenceReferences: z.array(approvalEvidenceReference).min(1),
    regressionClaims: z.array(regressionClaim).min(1),
    applicability: sanitizedText,
    exclusions: z.array(sanitizedText),
    scopeClass: ordinaryText,
    severity: z.enum(["low", "medium", "high", "critical"]),
    failureBehavior: sanitizedText,
    reviewAt: isoInstant,
    expiresAt: isoInstant.optional(),
    expiryRationale: sanitizedText.optional(),
    conflictReferences: z.array(ordinaryText),
    conflictRecords: z.array(conflictRecord),
    requiredEnforcementClasses: z.array(ordinaryText).min(1),
    enforcementLinks: z.array(enforcementLink).min(1),
    rollbackPlan,
  })
  .strict()
  .superRefine((command, context) => {
    if (!command.recurrenceEvidence && !command.severeFirstOccurrence) {
      context.addIssue({ code: "custom", message: "recurrence evidence or a severe-first-occurrence exception is required" });
    }
    if (!command.expiresAt && !command.expiryRationale) {
      context.addIssue({ code: "custom", message: "expiry or an expiry rationale is required" });
    }
  });

/** Actor metadata retained when a governance-relevant approval attempt is blocked. */
export const approvalAttemptContextSchema = z.object({ actor, occurredAt: isoInstant }).passthrough();
