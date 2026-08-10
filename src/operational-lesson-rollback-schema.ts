import { z } from "zod";

import {
  actor,
  isoInstant,
  ordinaryText,
  reviewAssignment,
  sanitizedText,
} from "./operational-lessons-schema.ts";

const rollbackOperation = z.object({
  operation: sanitizedText,
  executor: ordinaryText,
}).strict();
const rollbackVerificationEvidence = z.object({
  evidenceId: ordinaryText,
  operation: z.enum(["disable", "safe-source"]),
  outcome: z.literal("passed"),
  verifiedAt: isoInstant,
  immutableLocator: ordinaryText,
}).strict();

/** Runtime schema for starting an audited recovery from a harmful active revision. */
export const lessonRollbackCommandSchema = z.object({
  actor: actor.extend({ kind: z.literal("human") }),
  occurredAt: isoInstant,
  authorization: z.object({
    authorizationId: ordinaryText,
    authorizedActor: ordinaryText,
    authorizedBy: ordinaryText,
    authority: ordinaryText,
    authorizedAt: isoInstant,
    provenance: ordinaryText,
  }).strict(),
  defectiveRevisionId: ordinaryText,
  safeSourceRevisionId: ordinaryText,
  reason: sanitizedText,
  affectedProjections: z.array(ordinaryText).min(1),
  recoveryPlan: z.object({
    defectiveComponent: ordinaryText,
    disableOperation: rollbackOperation,
    recoveryOperation: rollbackOperation,
    independenceEvidence: z.object({
      evidenceId: ordinaryText,
      outcome: z.literal("passed"),
      coveredOperations: z.array(z.enum(["disable", "recovery"])).min(2),
      verifiedAt: isoInstant,
      immutableLocator: ordinaryText,
    }).strict(),
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
  const authorization = command.authorization;
  if (authorization.authorizedActor !== command.actor.identity
    || authorization.authority !== command.actor.authority
    || authorization.authorizedBy === command.actor.identity
    || Date.parse(authorization.authorizedAt) > Date.parse(command.occurredAt)) {
    context.addIssue({ code: "custom", message: "rollback requires prior authority granted to the human actor" });
  }
  const independence = command.recoveryPlan.independenceEvidence;
  if (!independence.coveredOperations.includes("disable")
    || !independence.coveredOperations.includes("recovery")
    || Date.parse(independence.verifiedAt) > Date.parse(command.occurredAt)) {
    context.addIssue({ code: "custom", message: "rollback requires verified independence for both critical operations" });
  }
  if (!command.verificationEvidence.some(({ operation }) => operation === "disable")
    || !command.verificationEvidence.some(({ operation }) => operation === "safe-source")) {
    context.addIssue({ code: "custom", message: "rollback requires disable and safe-source verification evidence" });
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

/** Runtime schema for retiring a rollback revision that cannot pass a normal gate. */
export const rollbackRetirementCommandSchema = z.object({
  actor: actor.extend({ kind: z.literal("human") }),
  occurredAt: isoInstant,
  reason: sanitizedText,
  impossibilityEvidence: z.object({
    evidenceId: ordinaryText,
    conclusion: z.literal("safe-activation-impossible"),
    failedGate: z.enum(["approval", "activation"]),
    attempts: z.array(ordinaryText).min(1),
    verifiedAt: isoInstant,
    immutableLocator: ordinaryText,
  }).strict(),
}).strict().superRefine((command, context) => {
  if (Date.parse(command.impossibilityEvidence.verifiedAt) > Date.parse(command.occurredAt)) {
    context.addIssue({ code: "custom", message: "rollback impossibility evidence cannot occur in the future" });
  }
});
