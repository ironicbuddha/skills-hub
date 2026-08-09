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
const actor = z.object({ identity: ordinaryText, authority: ordinaryText }).strict();
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
