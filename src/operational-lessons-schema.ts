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

/** Runtime schema for revising an active lesson directly into accountable review. */
export const activeRevisionCommandSchema = z
  .object({
    actor,
    occurredAt: isoInstant,
    changeSummary: sanitizedText,
    changes: materialChanges,
    assignment: reviewAssignment,
  })
  .strict()
  .superRefine((command, context) => {
    if (command.assignment.assignedBy !== command.actor.identity) {
      context.addIssue({ code: "custom", message: "assignment provenance must name the revising actor" });
    }
    if (command.assignment.assignedAt !== command.occurredAt) {
      context.addIssue({ code: "custom", message: "assignment time must match the active revision transition" });
    }
  });

const rollbackOperation = z.object({
  operation: sanitizedText,
  executor: ordinaryText,
}).strict();
const rollbackVerificationEvidence = z.object({
  evidenceId: ordinaryText,
  operation: z.enum(["disable", "recovery"]),
  outcome: z.literal("passed"),
  verifiedAt: isoInstant,
  immutableLocator: ordinaryText,
}).strict();

/** Runtime schema for starting an audited recovery from a harmful active revision. */
export const lessonRollbackCommandSchema = z.object({
  actor: actor.extend({ kind: z.literal("human") }),
  occurredAt: isoInstant,
  defectiveRevisionId: ordinaryText,
  safeSourceRevisionId: ordinaryText,
  reason: sanitizedText,
  affectedProjections: z.array(ordinaryText).min(1),
  recoveryPlan: z.object({
    defectiveComponent: ordinaryText,
    disableOperation: rollbackOperation,
    recoveryOperation: rollbackOperation,
  }).strict(),
  verificationEvidence: z.array(rollbackVerificationEvidence).min(2),
  assignment: reviewAssignment,
}).strict().superRefine((command, context) => {
  if (new Set(command.affectedProjections).size !== command.affectedProjections.length) {
    context.addIssue({ code: "custom", message: "affected rollback projections must be unique" });
  }
  if (command.recoveryPlan.disableOperation.executor === command.recoveryPlan.defectiveComponent
    || command.recoveryPlan.recoveryOperation.executor === command.recoveryPlan.defectiveComponent) {
    context.addIssue({ code: "custom", message: "critical rollback operations require an independent executor" });
  }
  if (!command.verificationEvidence.some(({ operation }) => operation === "disable")
    || !command.verificationEvidence.some(({ operation }) => operation === "recovery")) {
    context.addIssue({ code: "custom", message: "rollback requires disable and recovery verification evidence" });
  }
  if (command.verificationEvidence.some(({ verifiedAt }) =>
    Date.parse(verifiedAt) > Date.parse(command.occurredAt))) {
    context.addIssue({ code: "custom", message: "rollback verification cannot occur in the future" });
  }
  if (command.assignment.assignedBy !== command.actor.identity
    || command.assignment.assignedAt !== command.occurredAt) {
    context.addIssue({ code: "custom", message: "rollback review assignment must be authorized by the rollback actor" });
  }
});

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
/** Runtime schema for one exact lesson revision reference. */
export const lessonRevisionReferenceSchema = z.object({ lessonId: ordinaryText, revisionId: ordinaryText }).strict();

/** Runtime schema for an explicit contradiction and its resolution metadata. */
export const conflictRecordSchema = z.object({
  conflictId: ordinaryText,
  lessonRevisions: z.array(lessonRevisionReferenceSchema).min(2),
  overlappingScope: sanitizedText,
  contradictoryObligations: z.array(sanitizedText).min(2),
  discoveredAt: isoInstant,
  discoveredBy: ordinaryText,
  discoveryProvenance: ordinaryText,
  severity: z.enum(["low", "medium", "high", "critical"]),
  blocking: z.boolean(),
  credibleHarm: z.boolean(),
  status: z.enum(["open", "resolved", "excepted"]),
  owner: ordinaryText,
  resolutionRationale: sanitizedText.nullable(),
  resolutionAuthority: ordinaryText.nullable(),
  exceptionExpiresAt: isoInstant.nullable(),
  resultingLessonRevisions: z.array(lessonRevisionReferenceSchema),
}).strict();

/** Runtime schema for recording a newly discovered contradiction. */
export const conflictDiscoveryCommandSchema = z.object({
  actor,
  occurredAt: isoInstant,
  conflict: conflictRecordSchema.pick({
    conflictId: true,
    lessonRevisions: true,
    overlappingScope: true,
    contradictoryObligations: true,
    discoveryProvenance: true,
    severity: true,
    blocking: true,
    credibleHarm: true,
    owner: true,
  }),
}).strict();

/** Runtime schema for an accountable human Conflict disposition. */
export const conflictResolutionCommandSchema = z.object({
  actor: actor.extend({ kind: z.literal("human") }),
  occurredAt: isoInstant,
  status: z.enum(["resolved", "excepted"]),
  rationale: sanitizedText,
  exceptionExpiresAt: isoInstant.optional(),
  resultingLessonRevisions: z.array(lessonRevisionReferenceSchema),
}).strict().superRefine((command, context) => {
  if (command.status === "excepted" && !command.exceptionExpiresAt) {
    context.addIssue({ code: "custom", message: "an excepted Conflict requires an expiry" });
  }
});
const enforcementDeploymentState = z.enum(["planned", "ready", "active", "drifted", "disabled", "removed"]);
const enforcementVerificationEvidence = z.object({
  evidenceId: ordinaryText,
  kind: z.enum(["deployment", "drift", "disablement", "removal"]),
  outcome: z.enum(["passed", "failed"]),
  verifiedAt: isoInstant,
  immutableLocator: ordinaryText,
}).strict();
const enforcementDeployment = z.object({
  version: ordinaryText,
  deployedAt: isoInstant,
}).strict();
type EnforcementStateInput = {
  deploymentState: z.infer<typeof enforcementDeploymentState>;
  verificationEvidence: z.infer<typeof enforcementVerificationEvidence> | null;
  deployment: z.infer<typeof enforcementDeployment> | null;
};

function validateEnforcementState(
  value: EnforcementStateInput,
  context: { addIssue(issue: { code: "custom"; message: string }): void },
) {
  const expectedEvidence = {
    ready: ["deployment", "passed"],
    active: ["deployment", "passed"],
    drifted: ["drift", "failed"],
    disabled: ["disablement", "passed"],
    removed: ["removal", "passed"],
  } as const;
  if (value.deploymentState === "planned") {
    if (value.verificationEvidence || value.deployment) {
      context.addIssue({ code: "custom", message: "a planned Enforcement Link cannot claim deployment evidence" });
    }
    return;
  }
  const expected = expectedEvidence[value.deploymentState];
  if (!value.verificationEvidence
    || value.verificationEvidence.kind !== expected[0]
    || value.verificationEvidence.outcome !== expected[1]) {
    context.addIssue({ code: "custom", message: `${value.deploymentState} requires matching verification evidence` });
  }
  if ((value.deploymentState === "ready" || value.deploymentState === "active") && !value.deployment) {
    context.addIssue({ code: "custom", message: "a deployed Enforcement Link requires version and time" });
  }
}

/** Runtime schema for one independently deployed lesson projection or control. */
export const enforcementLinkSchema = z.object({
  linkId: ordinaryText,
  controlClass: ordinaryText,
  target: ordinaryText,
  owner: ordinaryText,
  implementedRevisionId: ordinaryText,
  deploymentState: enforcementDeploymentState,
  verificationEvidence: enforcementVerificationEvidence.nullable(),
  deployment: enforcementDeployment.nullable(),
  bypassPolicy: sanitizedText,
  rollbackOperation: sanitizedText,
}).strict().superRefine(validateEnforcementState);
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
    conflictRecords: z.array(conflictRecordSchema),
    requiredEnforcementClasses: z.array(ordinaryText).min(1),
    enforcementLinks: z.array(enforcementLinkSchema).min(1),
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

const authorizedException = z.object({
  rationale: sanitizedText,
  approvedBy: ordinaryText,
  authority: ordinaryText,
  approvedAt: isoInstant,
}).strict();
const enforcementWaiver = z.object({
  controlClass: ordinaryText,
  reason: sanitizedText,
  approvedBy: ordinaryText,
  authority: ordinaryText,
  approvedAt: isoInstant,
  expiresAt: isoInstant,
}).strict();

/** Runtime schema for activating an approved exact Lesson Revision. */
export const activationCommandSchema = z.object({
  actor,
  occurredAt: isoInstant,
  revisionId: ordinaryText,
  regressionEvidence: z.array(ordinaryText).min(1).optional(),
  nonDeterminismRationale: authorizedException.optional(),
  enforcementWaivers: z.array(enforcementWaiver),
}).strict().superRefine((command, context) => {
  if (!command.regressionEvidence && !command.nonDeterminismRationale) {
    context.addIssue({ code: "custom", message: "regression evidence or an approved non-determinism rationale is required" });
  }
});

/** Actor metadata retained when a governance-relevant activation attempt is blocked. */
export const activationAttemptContextSchema = z.object({ actor, occurredAt: isoInstant }).passthrough();

/** Runtime schema for independently advancing or reconciling one Enforcement Link. */
export const enforcementLinkTransitionCommandSchema = z.object({
  actor,
  occurredAt: isoInstant,
  deploymentState: enforcementDeploymentState,
  verificationEvidence: enforcementVerificationEvidence.nullable(),
  deployment: enforcementDeployment.nullable(),
  reason: sanitizedText,
}).strict().superRefine((command, context) => {
  validateEnforcementState(command, context);
  if (command.deployment && Date.parse(command.deployment.deployedAt) > Date.parse(command.occurredAt)) {
    context.addIssue({ code: "custom", message: "an Enforcement Link cannot be deployed in the future" });
  }
  if (command.verificationEvidence
    && Date.parse(command.verificationEvidence.verifiedAt) > Date.parse(command.occurredAt)) {
    context.addIssue({ code: "custom", message: "Enforcement Link verification cannot occur in the future" });
  }
});

/** Runtime schema for a human decision that ends active guidance. */
export const terminalDispositionCommandSchema = z.object({
  actor: actor.extend({ kind: z.literal("human") }),
  occurredAt: isoInstant,
  reason: sanitizedText,
}).strict();

/** Runtime schema for checking review and expiry deadlines on active guidance. */
export const activeLessonDeadlineCommandSchema = z.object({
  actor,
  occurredAt: isoInstant,
}).strict();

/** Runtime schema for an accountable periodic review of active guidance. */
export const activeLessonReviewCommandSchema = z.object({
  actor: actor.extend({ kind: z.literal("human") }),
  occurredAt: isoInstant,
  outcome: sanitizedText,
  evidenceConsidered: z.array(ordinaryText).min(1),
  nextReviewAt: isoInstant.optional(),
  expiresAt: isoInstant.optional(),
}).strict().superRefine((command, context) => {
  if (!command.nextReviewAt && !command.expiresAt) {
    context.addIssue({ code: "custom", message: "a completed review requires a next review or expiry" });
  }
  for (const deadline of [command.nextReviewAt, command.expiresAt]) {
    if (deadline && Date.parse(deadline) <= Date.parse(command.occurredAt)) {
      context.addIssue({ code: "custom", message: "the next review or expiry must follow review completion" });
    }
  }
});
