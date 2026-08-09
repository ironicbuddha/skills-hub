import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";

import { test } from "@jest/globals";

import {
  approveCandidate,
  activateApprovedLesson,
  completeActiveLessonReview,
  captureCandidate,
  CandidateTransitionError,
  CandidateValidationError,
  publishMarkdown,
  evaluateActiveLessonDeadlines,
  replaceActiveLesson,
  retireActiveLesson,
  reviseActiveLesson,
  reviseCandidate,
  rejectCandidate,
  submitCandidateForReview,
  selectConsumerGuidance,
  supersedeActiveLessonAcrossLessons,
  type CaptureCandidateCommand,
  type CaptureSink,
  type ApprovalCommand,
  type ApprovalSink,
  type ApprovedLesson,
  type ActivationCommand,
  type ActivationSink,
  type ActiveLesson,
  type CandidateLesson,
  type LifecycleEvent,
  type OperationalLesson,
  type ReviewAssignment,
  type ReviewSink,
  type ActiveRevisionSink,
  type RevisionSink,
  type RejectedCandidateLesson,
  type RejectionSink,
  type ReplacementSink,
  type RetirementSink,
  type ActiveLessonDeadlineSink,
  type ActiveLessonReviewSink,
  type SupersededLesson,
  type CrossLessonSupersessionSink,
  type RetiredLesson,
} from "../src/operational-lessons.ts";
import {
  activateSafeConflictReplacement,
  discoverConflict,
  resolveConflict,
  type ConflictRecord,
  type ConflictSink,
  type ConflictResolutionSink,
} from "../src/operational-lesson-conflicts.ts";

function captureSink(
  revisions: CandidateLesson[] = [],
  events: LifecycleEvent[] = [],
): CaptureSink {
  const revisionIds = new Set(revisions.map(({ revisionId }) => revisionId));
  const eventIds = new Set(events.map(({ eventId }) => eventId));

  return {
    appendCapture(revision, event) {
      if (revisionIds.has(revision.revisionId) || eventIds.has(event.eventId)) {
        throw new Error("capture identity already exists");
      }
      revisionIds.add(revision.revisionId);
      eventIds.add(event.eventId);
      revisions.push(revision);
      events.push(event);
    },
  };
}

function lifecycleOutcome(event: LifecycleEvent | undefined) {
  return event && "outcome" in event ? event.outcome : undefined;
}

const command = (): CaptureCandidateCommand => ({
  lessonId: "lesson_publication_boundary",
  schemaVersion: "1.0",
  title: "Markdown crosses a shell interpreter boundary",
  actor: { identity: "capture-agent", authority: "incident-capture", kind: "service" },
  occurredAt: "2026-08-09T10:00:00.000Z",
  sourceEvents: [
    {
      sourceId: "incident-42",
      sourceKind: "failed-operation",
      observedAt: "2026-08-09T09:55:00.000Z",
    },
  ],
  incidentFacts: [
    {
      factClass: "trust-boundary",
      summary: "Markdown was interpreted as shell source instead of transported as data.",
    },
    {
      factClass: "observed-outcome",
      summary: "The publication operation executed embedded command syntax.",
    },
  ],
  failureMode: "Untrusted Markdown crossed a shell interpreter boundary as source.",
  sanitization: {
    method: "incident-fact-allowlist",
    version: "1.0",
    actor: "capture-agent",
    sanitizedAt: "2026-08-09T09:59:00.000Z",
    allowlistedFactClasses: ["trust-boundary", "observed-outcome"],
    prohibitedContentExcluded: true,
  },
  evidenceSummary: "A data-to-source boundary violation occurred during publication.",
  evidenceReferences: [
    {
      evidenceId: "evidence-42",
      kind: "source",
      sanitizedSummary: "Protected incident record for the failed publication.",
      classification: "confidential",
      accessBoundary: "incident-reviewers",
      observedAt: "2026-08-09T09:55:00.000Z",
      collector: "capture-agent",
      immutableLocator: "sha256:8d12",
      retention: "365d",
    },
  ],
  confidence: {
    level: "demonstrated",
    rationale: "The boundary violation was reproduced in an isolated check.",
  },
  recurrenceSignature: "Markdown metacharacters execute during a publication operation.",
  invariant: "Transport arbitrary content as data, never interpreter source.",
  guidance: "Pass Markdown through a data-safe input boundary.",
  owner: "platform-safety",
});

const reviewAssignment = (): ReviewAssignment => ({
  reviewers: [{ identity: "human-reviewer", kind: "human" }],
  requiredAuthority: "lesson-approver",
  assignedBy: "platform-safety-owner",
  assignedAt: "2026-08-09T10:05:00.000Z",
  provenance: "incident-review-queue",
  status: "assigned",
});

const approvalCommand = (): ApprovalCommand => ({
  actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
  occurredAt: "2026-08-09T10:30:00.000Z",
  revisionId: "lesson_publication_boundary:1",
  rationale: "The reproduced interpreter-boundary failure warrants durable guidance.",
  conditions: ["Recheck after the safe publication helper ships."],
  waivers: [],
  recurrenceEvidence: ["evidence-42"],
  evidenceReferences: [{
    evidenceId: "evidence-42",
    kind: "recurrence",
    supportedRevision: 1,
    sanitizedSummary: "The interpreter-boundary failure recurred in an isolated reproduction.",
    classification: "confidential",
    accessBoundary: "incident-reviewers",
    observedAt: "2026-08-09T10:20:00.000Z",
    collector: "human-reviewer",
    immutableLocator: "sha256:recurrence-42",
    retention: "365d",
  }],
  regressionClaims: [{
    expectedNonOccurrence: "Markdown metacharacters do not execute during publication.",
    falsePositiveBoundary: "Literal metacharacters remain byte-preserved in the published body.",
  }],
  applicability: "Operations that publish arbitrary Markdown through an interpreter-capable tool.",
  exclusions: ["Static Markdown already stored without interpretation."],
  scopeClass: "repository",
  severity: "high",
  failureBehavior: "Block publication when a data-safe boundary is unavailable.",
  reviewAt: "2026-09-09T10:30:00.000Z",
  expiresAt: "2026-11-09T10:30:00.000Z",
  conflictReferences: [],
  conflictRecords: [],
  requiredEnforcementClasses: ["regression-test"],
  enforcementLinks: [{
    linkId: "control-safe-publication-test",
    controlClass: "regression-test",
    target: "tests/operational-lessons.contract.test.ts",
    owner: "platform-safety",
    implementedRevisionId: "lesson_publication_boundary:1",
    deploymentState: "ready",
    verification: "The inert Markdown publication regression passes.",
    bypassPolicy: "No automated bypass; human approval is required.",
    rollbackOperation: "Remove the control after retiring the governing lesson.",
  }],
  rollbackPlan: {
    affectedProjections: ["repository guidance", "publication helper"],
    recoveryAction: "Retire the revision and remove or disable its linked projections.",
    verification: "Confirm consumers cannot retrieve it and the prior publication path is restored.",
  },
});

function reviewedCandidate() {
  const captured = captureCandidate(command(), captureSink());
  return submitCandidateForReview(captured, {
    actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
    occurredAt: "2026-08-09T10:05:00.000Z",
    assignment: reviewAssignment(),
  }, { appendReviewTransition() {}, appendBlockedReviewAttempt() {} });
}

function approvedCandidate(changes: Partial<ApprovalCommand> = {}) {
  return approveCandidate(reviewedCandidate(), { ...approvalCommand(), ...changes }, {
    appendApproval() {},
    appendBlockedApproval() {},
  });
}

const activationCommand = (): ActivationCommand => ({
  actor: { identity: "deployment-service", authority: "lesson-activator", kind: "service" },
  occurredAt: "2026-08-09T11:00:00.000Z",
  revisionId: "lesson_publication_boundary:1",
  regressionEvidence: ["regression-safe-publication"],
  enforcementWaivers: [],
});

function activeCandidate(): ActiveLesson {
  const approved = approvedCandidate({
    evidenceReferences: [
      ...approvalCommand().evidenceReferences,
      {
        evidenceId: "regression-safe-publication",
        kind: "regression",
        supportedRevision: 1,
        sanitizedSummary: "The safe publication regression passed in the deployment environment.",
        classification: "internal",
        accessBoundary: "lesson-reviewers",
        observedAt: "2026-08-09T10:25:00.000Z",
        collector: "deployment-service",
        immutableLocator: "sha256:regression-safe-publication",
        retention: "365d",
      },
    ],
  });
  return activateApprovedLesson(approved, activationCommand(), {
    activateAsSoleRevision() {},
    appendBlockedActivation() {},
  });
}

function reviewedSuccessor(predecessor = activeCandidate()) {
  return reviseActiveLesson(predecessor, {
    actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
    occurredAt: "2026-08-09T11:10:00.000Z",
    changeSummary: "Clarify that every publication boundary must preserve literal bytes.",
    changes: { guidance: "Pass Markdown through a byte-preserving, data-safe input boundary." },
    assignment: { ...reviewAssignment(), assignedAt: "2026-08-09T11:10:00.000Z" },
  }, { appendActiveRevision() {}, appendBlockedActiveRevision() {} });
}

function approvedSuccessor(predecessor = activeCandidate()) {
  const successor = reviewedSuccessor(predecessor);
  const priorApproval = approvalCommand();
  return approveCandidate(successor, {
    ...priorApproval,
    occurredAt: "2026-08-09T11:30:00.000Z",
    revisionId: successor.revisionId,
    evidenceReferences: [
      ...priorApproval.evidenceReferences.map((reference) => ({
        ...reference,
        supportedRevision: successor.revision,
      })),
      {
        evidenceId: "regression-safe-publication-v2",
        kind: "regression" as const,
        supportedRevision: successor.revision,
        sanitizedSummary: "The revised safe publication regression passed.",
        classification: "internal",
        accessBoundary: "lesson-reviewers",
        observedAt: "2026-08-09T11:25:00.000Z",
        collector: "deployment-service",
        immutableLocator: "sha256:regression-safe-publication-v2",
        retention: "365d",
      },
    ],
    enforcementLinks: priorApproval.enforcementLinks.map((link) => ({
      ...link,
      implementedRevisionId: successor.revisionId,
    })),
  }, { appendApproval() {}, appendBlockedApproval() {} });
}

test("capture creates immutable revision 1 and an append-only event", () => {
  const revisions: CandidateLesson[] = [];
  const events: LifecycleEvent[] = [];

  const captured = captureCandidate(command(), captureSink(revisions, events));

  assert.equal(captured.revision, 1);
  assert.equal(captured.revisionId, "lesson_publication_boundary:1");
  assert.equal(captured.state, "captured");
  assert.equal(captured.createdBy, "capture-agent");
  assert.deepEqual(captured.incidentFacts.map(({ factClass }) => factClass), ["trust-boundary", "observed-outcome"]);
  assert.equal(captured.evidenceReferences[0]?.supportedRevision, 1);
  assert.deepEqual(revisions, [captured]);
  assert.deepEqual(events, [
    {
      eventId: "lesson_publication_boundary:1:capture",
      lessonId: "lesson_publication_boundary",
      fromState: null,
      toState: "captured",
      revision: 1,
      actor: "capture-agent",
      actorAuthority: "incident-capture",
      actorKind: "service",
      occurredAt: "2026-08-09T10:00:00.000Z",
      reason: "sanitized candidate captured",
      evidenceReferences: ["evidence-42"],
    },
  ]);
  assert.equal(Object.isFrozen(captured), true);
  assert.equal(Object.isFrozen(events[0]), true);
});

test("prohibited material is rejected before durable capture", () => {
  const prohibitedExamples = [
    ["rawTranscript", "complete incident transcript"],
    ["rawToolOutput", "tool stdout"],
    ["secret", "super-secret"],
    ["credentials", "username:password"],
    ["privateReasoning", "hidden chain of thought"],
    ["executablePayload", "rm -rf /tmp/example"],
  ] as const;

  for (const [field, value] of prohibitedExamples) {
    let writes = 0;
    const unsafe = { ...command(), [field]: value };

    assert.throws(
      () => captureCandidate(unsafe, { appendCapture: () => writes++ }),
      CandidateValidationError,
      field,
    );
    assert.equal(writes, 0, field);
  }
});

test("credential-shaped content is rejected before durable capture", () => {
  const unsafe = { ...command(), owner: "password=hunter2" };

  assert.throws(() => captureCandidate(unsafe, captureSink()), /prohibited incident material/u);
});

test("capture rejects incomplete or non-allowlisted facts", () => {
  const missingOwner = { ...command(), owner: "" };
  const unknownFact = {
    ...command(),
    incidentFacts: [{ factClass: "raw-observation", summary: "unsafe" }],
  };
  const undeclaredFact = {
    ...command(),
    sanitization: { ...command().sanitization, allowlistedFactClasses: ["trust-boundary"] },
  };

  assert.throws(() => captureCandidate(missingOwner, captureSink()), CandidateValidationError);
  assert.throws(() => captureCandidate(unknownFact, captureSink()), CandidateValidationError);
  assert.throws(() => captureCandidate(undeclaredFact, captureSink()), /was not declared/u);
});

test("raw dumps, private reasoning, and executable payloads are rejected in allowed fields", () => {
  const examples = [
    "first line\nsecond line",
    "tool stdout: operation complete",
    "private reasoning: maybe the user intended this",
    "$(touch /tmp/should-not-execute)",
    "touch /tmp/should-not-execute",
  ];

  for (const evidenceSummary of examples) {
    assert.throws(
      () => captureCandidate({ ...command(), evidenceSummary }, captureSink()),
      CandidateValidationError,
      evidenceSummary,
    );
  }
});

test("capture appends revision and event through one identity-protected operation", () => {
  const sink = captureSink();

  captureCandidate(command(), sink);

  assert.throws(() => captureCandidate(command(), sink), /capture identity already exists/u);
});

test("provenance requires strict ISO date-times", () => {
  assert.throws(
    () => captureCandidate({ ...command(), occurredAt: "2026-08-09" }, captureSink()),
    CandidateValidationError,
  );
});

test("captured candidates are not consumer eligible", () => {
  const captured = captureCandidate(command(), captureSink());

  assert.equal(selectConsumerGuidance(captured), null);
});

test("a complete accountable assignment moves a candidate under review", () => {
  const captured = captureCandidate(command(), captureSink());
  const revisions: CandidateLesson[] = [];
  const events: LifecycleEvent[] = [];
  const sink: ReviewSink = {
    appendReviewTransition(revision, event) {
      revisions.push(revision);
      events.push(event);
    },
    appendBlockedReviewAttempt(event) {
      events.push(event);
    },
  };

  const underReview = submitCandidateForReview(
    captured,
    {
      actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
      occurredAt: "2026-08-09T10:05:00.000Z",
      assignment: reviewAssignment(),
    },
    sink,
  );

  assert.equal(underReview.state, "under_review");
  assert.deepEqual(underReview.reviewAssignment, reviewAssignment());
  assert.deepEqual(revisions, [underReview]);
  assert.deepEqual(events, [
    {
      eventId: "lesson_publication_boundary:1:review-submitted",
      lessonId: "lesson_publication_boundary",
      fromState: "captured",
      toState: "under_review",
      revision: 1,
      actor: "platform-safety-owner",
      actorAuthority: "lesson-owner",
      actorKind: "human",
      occurredAt: "2026-08-09T10:05:00.000Z",
      reason: "candidate submitted for human review",
      reviewAssignment: reviewAssignment(),
      outcome: "completed",
    },
  ]);
  assert.equal(Object.isFrozen(underReview.reviewAssignment), true);
  assert.equal(selectConsumerGuidance(underReview), null);
});

test("an incomplete review assignment is blocked and audited", () => {
  const captured = captureCandidate(command(), captureSink());
  const events: LifecycleEvent[] = [];
  const sink: ReviewSink = {
    appendReviewTransition() {
      assert.fail("an incomplete assignment must not enter review");
    },
    appendBlockedReviewAttempt(event) {
      events.push(event);
    },
  };

  assert.throws(
    () =>
      submitCandidateForReview(
        captured,
        {
          actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
          occurredAt: "2026-08-09T10:06:00.000Z",
          assignment: { ...reviewAssignment(), reviewers: [] },
        },
        sink,
      ),
    CandidateTransitionError,
  );

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    eventId: "lesson_publication_boundary:1:review-blocked:2026-08-09T10:06:00.000Z",
    lessonId: "lesson_publication_boundary",
    fromState: "captured",
    toState: "captured",
    revision: 1,
    actor: "platform-safety-owner",
    actorAuthority: "lesson-owner",
    actorKind: "human",
    occurredAt: "2026-08-09T10:06:00.000Z",
    reason: "review assignment is incomplete or has invalid provenance",
    outcome: "blocked",
  });
});

test("a material change creates a new captured revision with lineage and no carried review", () => {
  const captured = captureCandidate(command(), captureSink());
  const underReview = submitCandidateForReview(
    captured,
    {
      actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
      occurredAt: "2026-08-09T10:05:00.000Z",
      assignment: reviewAssignment(),
    },
    {
      appendReviewTransition() {},
      appendBlockedReviewAttempt() {},
    },
  );
  const revisions: CandidateLesson[] = [];
  const events: LifecycleEvent[] = [];
  const sink: RevisionSink = {
    appendRevision(revision, event) {
      revisions.push(revision);
      events.push(event);
    },
    appendBlockedRevision(event) {
      events.push(event);
    },
  };

  const revised = reviseCandidate(
    underReview,
    {
      actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
      occurredAt: "2026-08-09T10:15:00.000Z",
      changeSummary: "Clarify that every interpreter boundary is in scope.",
      changes: {
        invariant: "Transport arbitrary content as data across every interpreter boundary.",
        guidance: "Use a data-safe input boundary for Markdown publication.",
      },
    },
    sink,
  );

  assert.equal(revised.revision, 2);
  assert.equal(revised.revisionId, "lesson_publication_boundary:2");
  assert.equal(revised.predecessorRevisionId, "lesson_publication_boundary:1");
  assert.equal(revised.changeSummary, "Clarify that every interpreter boundary is in scope.");
  assert.equal(revised.state, "captured");
  assert.equal("reviewAssignment" in revised, false);
  assert.equal("approval" in revised, false);
  assert.equal(underReview.state, "under_review");
  assert.equal(underReview.invariant, "Transport arbitrary content as data, never interpreter source.");
  assert.deepEqual(revisions, [revised]);
  assert.deepEqual(events, [
    {
      eventId: "lesson_publication_boundary:2:material-revision",
      lessonId: "lesson_publication_boundary",
      fromState: "under_review",
      toState: "captured",
      revision: 2,
      actor: "human-reviewer",
      actorAuthority: "lesson-approver",
      actorKind: "human",
      occurredAt: "2026-08-09T10:15:00.000Z",
      reason: "material candidate revision created",
      predecessorRevisionId: "lesson_publication_boundary:1",
      changeSummary: "Clarify that every interpreter boundary is in scope.",
      outcome: "completed",
    },
  ]);
  assert.equal(Object.isFrozen(revised), true);
});

test("a revision with no changed value is blocked and audited", () => {
  const captured = captureCandidate(command(), captureSink());
  const underReview = submitCandidateForReview(
    captured,
    {
      actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
      occurredAt: "2026-08-09T10:05:00.000Z",
      assignment: reviewAssignment(),
    },
    { appendReviewTransition() {}, appendBlockedReviewAttempt() {} },
  );
  const events: LifecycleEvent[] = [];
  const sink: RevisionSink = {
    appendRevision() {
      assert.fail("a no-op change must not append a revision");
    },
    appendBlockedRevision(event) {
      events.push(event);
    },
  };

  assert.throws(
    () =>
      reviseCandidate(
        underReview,
        {
          actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
          occurredAt: "2026-08-09T10:16:00.000Z",
          changeSummary: "No effective change.",
          changes: { guidance: underReview.guidance },
        },
        sink,
      ),
    CandidateTransitionError,
  );

  const blockedEvent = events[0];
  assert.ok(blockedEvent && "outcome" in blockedEvent);
  assert.equal(blockedEvent.outcome, "blocked");
  assert.equal(blockedEvent.toState, "under_review");
});

test("revising an active lesson creates an independently reviewed successor while the predecessor stays active", () => {
  const predecessor = activeCandidate();
  const successors: CandidateLesson[] = [];
  const events: LifecycleEvent[] = [];
  const sink: ActiveRevisionSink = {
    appendActiveRevision(revision, event) {
      successors.push(revision);
      events.push(event);
    },
    appendBlockedActiveRevision(event) {
      events.push(event);
    },
  };

  const successor = reviseActiveLesson(predecessor, {
    actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
    occurredAt: "2026-08-09T11:10:00.000Z",
    changeSummary: "Clarify that every publication boundary must preserve literal bytes.",
    changes: { guidance: "Pass Markdown through a byte-preserving, data-safe input boundary." },
    assignment: {
      ...reviewAssignment(),
      assignedAt: "2026-08-09T11:10:00.000Z",
    },
  }, sink);

  assert.equal(successor.state, "under_review");
  assert.equal(successor.revision, 2);
  assert.equal(successor.predecessorRevisionId, predecessor.revisionId);
  assert.equal(successor.reviewAssignment.status, "assigned");
  assert.deepEqual(successors, [successor]);
  assert.equal(events[0]?.fromState, "active");
  assert.equal(events[0]?.toState, "under_review");
  assert.equal(selectConsumerGuidance(predecessor), predecessor.guidance);
  assert.equal(selectConsumerGuidance(successor), null);
});

test.each([
  ["rejected", "The proposed invariant is broader than the evidence supports."],
  ["withdrawn", "The owner withdrew the candidate pending new evidence."],
] as const)("human review records a %s disposition as rejection", (disposition, reason) => {
  const captured = captureCandidate(command(), captureSink());
  const underReview = submitCandidateForReview(
    captured,
    {
      actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
      occurredAt: "2026-08-09T10:05:00.000Z",
      assignment: reviewAssignment(),
    },
    { appendReviewTransition() {}, appendBlockedReviewAttempt() {} },
  );
  const revisions: RejectedCandidateLesson[] = [];
  const events: LifecycleEvent[] = [];
  const sink: RejectionSink = {
    appendRejection(revision, event) {
      revisions.push(revision);
      events.push(event);
    },
    appendBlockedRejection(event) {
      events.push(event);
    },
  };

  const rejected = rejectCandidate(
    underReview,
    {
      actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
      occurredAt: "2026-08-09T10:20:00.000Z",
      disposition,
      reason,
    },
    sink,
  );

  assert.equal(rejected.state, "rejected");
  assert.equal(rejected.disposition, disposition);
  assert.equal(rejected.dispositionReason, reason);
  assert.deepEqual(revisions, [rejected]);
  assert.equal(events[0]?.toState, "rejected");
  assert.equal(lifecycleOutcome(events[0]), "completed");
  assert.equal(Object.isFrozen(rejected), true);
  assert.equal(selectConsumerGuidance(rejected), null);
});

test("a blocked rejection attempt is audited without changing candidate state", () => {
  const captured = captureCandidate(command(), captureSink());
  const underReview = submitCandidateForReview(
    captured,
    {
      actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
      occurredAt: "2026-08-09T10:05:00.000Z",
      assignment: reviewAssignment(),
    },
    { appendReviewTransition() {}, appendBlockedReviewAttempt() {} },
  );
  const events: LifecycleEvent[] = [];
  const sink: RejectionSink = {
    appendRejection() {
      assert.fail("a blocked attempt must not append a rejected revision");
    },
    appendBlockedRejection(event) {
      events.push(event);
    },
  };

  assert.throws(
    () =>
      rejectCandidate(
        underReview,
        {
          actor: { identity: "review-bot", authority: "automation", kind: "service" },
          occurredAt: "2026-08-09T10:21:00.000Z",
          disposition: "rejected",
          reason: "Automated policy score was below threshold.",
        },
        sink,
      ),
    CandidateTransitionError,
  );

  assert.equal(underReview.state, "under_review");
  assert.deepEqual(events, [
    {
      eventId: "lesson_publication_boundary:1:rejection-blocked:2026-08-09T10:21:00.000Z",
      lessonId: "lesson_publication_boundary",
      fromState: "under_review",
      toState: "under_review",
      revision: 1,
      actor: "review-bot",
      actorAuthority: "automation",
      actorKind: "service",
      occurredAt: "2026-08-09T10:21:00.000Z",
      reason: "actor is not an assigned human reviewer with the required authority",
      attemptedDisposition: "rejected",
      outcome: "blocked",
    },
  ]);
});

test("automation cannot reject by claiming an assigned human identity and authority", () => {
  const captured = captureCandidate(command(), captureSink());
  const underReview = submitCandidateForReview(
    captured,
    {
      actor: { identity: "platform-safety-owner", authority: "lesson-owner", kind: "human" },
      occurredAt: "2026-08-09T10:05:00.000Z",
      assignment: reviewAssignment(),
    },
    { appendReviewTransition() {}, appendBlockedReviewAttempt() {} },
  );
  let blocked = 0;

  assert.throws(
    () =>
      rejectCandidate(
        underReview,
        {
          actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "service" },
          occurredAt: "2026-08-09T10:22:00.000Z",
          disposition: "rejected",
          reason: "A service attempted to impersonate the assigned reviewer.",
        },
        {
          appendRejection() {
            assert.fail("automation must not record a human disposition");
          },
          appendBlockedRejection() {
            blocked++;
          },
        },
      ),
    CandidateTransitionError,
  );
  assert.equal(blocked, 1);
});

test("an authorized human approves one exact, complete revision without activating it", () => {
  const reviewed = reviewedCandidate();
  const revisions: ApprovedLesson[] = [];
  const events: LifecycleEvent[] = [];
  const sink: ApprovalSink = {
    appendApproval(revision, event) { revisions.push(revision); events.push(event); },
    appendBlockedApproval(event) { events.push(event); },
  };

  const approved = approveCandidate(reviewed, approvalCommand(), sink);

  assert.equal(approved.state, "approved");
  assert.equal(approved.approval.revisionId, reviewed.revisionId);
  assert.equal(approved.approval.approver, "human-reviewer");
  assert.equal(approved.approval.authority, "lesson-approver");
  assert.equal(approved.approval.approvedAt, "2026-08-09T10:30:00.000Z");
  assert.deepEqual(approved.approval.conditions, approvalCommand().conditions);
  assert.deepEqual(revisions, [approved]);
  assert.equal(events[0]?.toState, "approved");
  assert.equal(selectConsumerGuidance(approved), null);
  assert.equal(Object.isFrozen(approved.approval), true);
});

test.each([
  ["service actor", { actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "service" } }],
  ["wrong revision", { revisionId: "lesson_publication_boundary:2" }],
  ["missing recurrence evidence", { recurrenceEvidence: [] }],
  ["missing regression claims", { regressionClaims: [] }],
  ["missing applicability", { applicability: "" }],
  ["missing exclusions", { exclusions: undefined }],
  ["missing conflict references", { conflictReferences: undefined }],
  ["missing enforcement classes", { requiredEnforcementClasses: [] }],
  ["missing rollback plan", { rollbackPlan: undefined }],
  ["unbound recurrence evidence", { recurrenceEvidence: ["unknown-evidence"] }],
  ["unbound enforcement link", { enforcementLinks: [{ ...approvalCommand().enforcementLinks[0]!, implementedRevisionId: "lesson_publication_boundary:2" }] }],
  ["review timing in the past", { reviewAt: "2026-08-01T10:30:00.000Z" }],
  ["approval before review assignment", { occurredAt: "2026-08-09T10:01:00.000Z" }],
  ["future-dated evidence", { evidenceReferences: [{ ...approvalCommand().evidenceReferences[0]!, observedAt: "2026-08-09T10:31:00.000Z" }] }],
] as const)("approval blocks %s and records the governance attempt", (_name, changes) => {
  const reviewed = reviewedCandidate();
  const events: LifecycleEvent[] = [];
  const input = { ...approvalCommand(), ...changes };

  assert.throws(() => approveCandidate(reviewed, input, {
    appendApproval() { assert.fail("invalid approval must not be appended"); },
    appendBlockedApproval(event) { events.push(event); },
  }), CandidateTransitionError);
  assert.equal(events.length, 1);
  assert.equal(events[0]?.toState, "under_review");
  assert.equal(lifecycleOutcome(events[0]), "blocked");
});

test("a severe first occurrence can replace recurrence evidence only with explicit justification", () => {
  const reviewed = reviewedCandidate();
  const command = approvalCommand();
  const { recurrenceEvidence: _evidence, ...withoutEvidence } = command;
  const approved = approveCandidate(reviewed, {
    ...withoutEvidence,
    evidenceReferences: [{
      evidenceId: "regression-safe-markdown-publication-2026-08-09",
      kind: "regression",
      supportedRevision: 1,
      sanitizedSummary: "The deterministic safe-publication regression passed.",
      classification: "internal",
      accessBoundary: "lesson-reviewers",
      observedAt: "2026-08-09T10:25:00.000Z",
      collector: "human-reviewer",
      immutableLocator: "sha256:regression-42",
      retention: "365d",
    }],
    severeFirstOccurrence: {
      justification: "A repeat could execute attacker-controlled commands with repository credentials.",
      deterministicRegressionEvidence: ["regression-safe-markdown-publication-2026-08-09"],
    },
  }, { appendApproval() {}, appendBlockedApproval() {} });
  assert.equal(approved.state, "approved");
});

test("a low-severity first occurrence cannot use the severe exception", () => {
  const reviewed = reviewedCandidate();
  const { recurrenceEvidence: _evidence, ...input } = approvalCommand();
  assert.throws(() => approveCandidate(reviewed, {
    ...input,
    severity: "low",
    evidenceReferences: [{
      evidenceId: "regression-safe-markdown-publication-2026-08-09",
      kind: "regression",
      supportedRevision: 1,
      sanitizedSummary: "The deterministic safe-publication regression passed.",
      classification: "internal",
      accessBoundary: "lesson-reviewers",
      observedAt: "2026-08-09T10:25:00.000Z",
      collector: "human-reviewer",
      immutableLocator: "sha256:regression-42",
      retention: "365d",
    }],
    severeFirstOccurrence: {
      justification: "This does not meet the severe exception threshold.",
      deterministicRegressionEvidence: ["regression-safe-markdown-publication-2026-08-09"],
    },
  }, { appendApproval() { assert.fail("low severity cannot use the exception"); }, appendBlockedApproval() {} }), CandidateTransitionError);
});

test("confidence and weak proxies cannot substitute for approval evidence", () => {
  const reviewed = reviewedCandidate();
  const { recurrenceEvidence: _evidence, ...input } = approvalCommand();
  assert.throws(() => approveCandidate(reviewed, {
    ...input,
    weakProxies: ["retrieval-count", "model-self-report", "absence-of-reports"],
  }, { appendApproval() { assert.fail("weak proxies are not evidence"); }, appendBlockedApproval() {} }), CandidateTransitionError);
});

test("an approved exact revision activates only after regression, conflict, and enforcement gates pass", () => {
  const approved = approvedCandidate({
    evidenceReferences: [
      ...approvalCommand().evidenceReferences,
      {
        evidenceId: "regression-safe-publication",
        kind: "regression",
        supportedRevision: 1,
        sanitizedSummary: "The safe publication regression passed in the deployment environment.",
        classification: "internal",
        accessBoundary: "lesson-reviewers",
        observedAt: "2026-08-09T10:25:00.000Z",
        collector: "deployment-service",
        immutableLocator: "sha256:regression-safe-publication",
        retention: "365d",
      },
    ],
  });
  const revisions: ActiveLesson[] = [];
  const events: LifecycleEvent[] = [];
  const sink: ActivationSink = {
    activateAsSoleRevision(revision, event) { revisions.push(revision); events.push(event); },
    appendBlockedActivation(event) { events.push(event); },
  };

  const active = activateApprovedLesson(approved, activationCommand(), sink);

  assert.equal(active.state, "active");
  assert.equal(active.activatedAt, "2026-08-09T11:00:00.000Z");
  assert.deepEqual(revisions, [active]);
  assert.equal(events[0]?.toState, "active");
  assert.equal(lifecycleOutcome(events[0]), "completed");
  assert.equal(selectConsumerGuidance(active), approved.guidance);
});

test.each([
  ["wrong exact revision", { revisionId: "lesson_publication_boundary:2" }],
  ["missing regression evidence", { regressionEvidence: [] }],
] as const)("activation blocks %s and leaves the revision approved", (_name, changes) => {
  const approved = approvedCandidate();
  const events: LifecycleEvent[] = [];

  assert.throws(() => activateApprovedLesson(approved, { ...activationCommand(), ...changes }, {
    activateAsSoleRevision() { assert.fail("a failed gate must not activate"); },
    appendBlockedActivation(event) { events.push(event); },
  }), CandidateTransitionError);
  assert.equal(approved.state, "approved");
  assert.equal(events[0]?.fromState, "approved");
  assert.equal(events[0]?.toState, "approved");
  assert.equal(lifecycleOutcome(events[0]), "blocked");
});

test("an Enforcement Link does not satisfy activation unless its deployment is ready", () => {
  const approved = approvedCandidate({
    enforcementLinks: [{ ...approvalCommand().enforcementLinks[0]!, deploymentState: "planned" }],
  });

  assert.throws(() => activateApprovedLesson(approved, {
    ...activationCommand(),
    nonDeterminismRationale: {
      rationale: "The model-facing behavior cannot be checked deterministically.",
      approvedBy: "human-reviewer",
      authority: "lesson-approver",
      approvedAt: "2026-08-09T10:50:00.000Z",
    },
    regressionEvidence: undefined,
  }, {
    activateAsSoleRevision() { assert.fail("a planned link is not ready"); },
    appendBlockedActivation() {},
  }), CandidateTransitionError);
});

test("a reasoned authorized expiring waiver can cover a required enforcement class", () => {
  const approved = approvedCandidate({
    enforcementLinks: [{ ...approvalCommand().enforcementLinks[0]!, deploymentState: "planned" }],
  });
  const command = activationCommand();
  const active = activateApprovedLesson(approved, {
    ...command,
    regressionEvidence: undefined,
    nonDeterminismRationale: {
      rationale: "The model-facing behavior cannot be checked deterministically.",
      approvedBy: "human-reviewer",
      authority: "lesson-approver",
      approvedAt: "2026-08-09T10:50:00.000Z",
    },
    enforcementWaivers: [{
      controlClass: "regression-test",
      reason: "The deployment is staged while the isolated safety check remains mandatory.",
      approvedBy: "human-reviewer",
      authority: "lesson-approver",
      approvedAt: "2026-08-09T10:50:00.000Z",
      expiresAt: "2026-08-10T11:00:00.000Z",
    }],
  }, { activateAsSoleRevision() {}, appendBlockedActivation() {} });

  assert.equal(active.state, "active");
});

test("an open blocking conflict prevents activation", () => {
  const conflict = {
    conflictId: "conflict-1",
    lessonRevisions: [
      { lessonId: "lesson_publication_boundary", revisionId: "lesson_publication_boundary:1" },
      { lessonId: "lesson_other", revisionId: "lesson_other:1" },
    ],
    overlappingScope: "Repository Markdown publication.",
    contradictoryObligations: ["Use the shell interpreter.", "Never use the shell interpreter."],
    discoveredAt: "2026-08-09T10:20:00.000Z",
    discoveredBy: "human-reviewer",
    discoveryProvenance: "repository-guidance-review-17",
    severity: "high" as const,
    blocking: true,
    credibleHarm: true,
    status: "open" as const,
    owner: "platform-safety",
    resolutionRationale: null,
    resolutionAuthority: null,
    exceptionExpiresAt: null,
    resultingLessonRevisions: [],
  };
  const approved = approvedCandidate({ conflictReferences: [conflict.conflictId], conflictRecords: [conflict] });

  assert.throws(() => activateApprovedLesson(approved, activationCommand(), {
    activateAsSoleRevision() { assert.fail("an open conflict must block activation"); },
    appendBlockedActivation() {},
  }), CandidateTransitionError);
});

test("conflicting repository guidance is recorded, suspended, and resolved without losing history", () => {
  const active = activeCandidate();
  const conflictingActive: ActiveLesson = {
    ...active,
    lessonId: "lesson_repository_shell_guidance",
    revisionId: "lesson_repository_shell_guidance:3",
    revision: 3,
    guidance: "Publish Markdown by constructing a shell command.",
  };
  const recorded: ConflictRecord[] = [];
  const suspended: RetiredLesson[] = [];
  const events: LifecycleEvent[] = [];
  const sink: ConflictSink = {
    recordConflict(conflict, retired, conflictEvents) {
      recorded.push(conflict);
      suspended.push(...retired);
      events.push(...conflictEvents);
    },
  };

  const outcome = discoverConflict([active, conflictingActive], {
    actor: { identity: "safety-monitor", authority: "conflict-discovery", kind: "service" },
    occurredAt: "2026-08-09T12:00:00.000Z",
    conflict: {
      conflictId: "conflict-repository-guidance",
      lessonRevisions: [
        { lessonId: active.lessonId, revisionId: active.revisionId },
        { lessonId: "lesson_repository_shell_guidance", revisionId: "lesson_repository_shell_guidance:3" },
      ],
      overlappingScope: "Repository instructions that publish Markdown.",
      contradictoryObligations: [
        "Publish Markdown by constructing a shell command.",
        "Publish Markdown only through a data-safe boundary.",
      ],
      discoveryProvenance: "repository-guidance-review-17",
      severity: "critical",
      blocking: false,
      credibleHarm: true,
      owner: "platform-safety",
    },
  }, sink);

  assert.equal(outcome.conflict.status, "open");
  assert.deepEqual(recorded, [outcome.conflict]);
  assert.equal(outcome.affected[0]?.state, "retired");
  assert.equal(outcome.affected[1]?.state, "retired");
  assert.equal(suspended.length, 2);
  assert.equal(suspended[0]?.retirementReason, "suspended");
  assert.equal(selectConsumerGuidance(outcome.affected[0]!), null);
  assert.equal(events[0]?.reason, "active lesson suspended by credible harmful conflict");

  const history: ConflictRecord[] = [outcome.conflict];
  const safeReplacement = approvedSuccessor(active);
  const resolutionSink: ConflictResolutionSink = {
    appendConflictResolution(_prior, resolved) { history.push(resolved); },
  };
  const resolved = resolveConflict(outcome.conflict, {
    actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
    occurredAt: "2026-08-09T13:00:00.000Z",
    status: "resolved",
    rationale: "Review confirmed retirement; no conflicting guidance remains eligible.",
    resultingLessonRevisions: [{
      lessonId: safeReplacement.lessonId,
      revisionId: safeReplacement.revisionId,
    }],
  }, resolutionSink);

  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.resolutionAuthority, "lesson-approver");
  assert.deepEqual(history, [outcome.conflict, resolved]);
  assert.equal(Object.isFrozen(outcome.conflict), true);
  assert.equal(Object.isFrozen(resolved), true);

  const activated = activateSafeConflictReplacement(
    suspended[0]!,
    safeReplacement,
    resolved,
    {
      ...activationCommand(),
      occurredAt: "2026-08-09T13:10:00.000Z",
      revisionId: safeReplacement.revisionId,
      regressionEvidence: ["regression-safe-publication-v2"],
    },
    { activateAsSoleRevision() {}, appendBlockedActivation() {} },
  );
  assert.equal(activated.state, "active");
  assert.equal(selectConsumerGuidance(activated), safeReplacement.guidance);
});

test("replacement atomically activates the approved successor and supersedes its active predecessor", () => {
  const predecessor = activeCandidate();
  const successor = approvedSuccessor(predecessor);
  let visible: (ActiveLesson | SupersededLesson)[] = [predecessor];
  const readConsumerGuidance = () => visible.flatMap((lesson) => {
    const guidance = selectConsumerGuidance(lesson);
    return guidance === null ? [] : [guidance];
  });
  assert.deepEqual(readConsumerGuidance(), [predecessor.guidance]);
  const sink: ReplacementSink = {
    replaceActiveRevision(superseded, active, event) {
      assert.deepEqual(visible, [predecessor]);
      visible = [superseded, active];
      assert.equal(visible.filter(({ state }) => state === "active").length, 1);
      assert.deepEqual(readConsumerGuidance(), [successor.guidance]);
      assert.equal(event.predecessorRevisionId, predecessor.revisionId);
      assert.equal(event.successorRevisionId, successor.revisionId);
    },
    appendBlockedReplacement() {},
  };

  const replacement = replaceActiveLesson(predecessor, successor, {
    ...activationCommand(),
    occurredAt: "2026-08-09T12:00:00.000Z",
    revisionId: successor.revisionId,
    regressionEvidence: ["regression-safe-publication-v2"],
  }, sink);

  assert.equal(replacement.predecessor.state, "superseded");
  assert.equal(replacement.predecessor.supersededByRevisionId, successor.revisionId);
  assert.equal(replacement.successor.state, "active");
  assert.equal(selectConsumerGuidance(replacement.predecessor), null);
  assert.equal(selectConsumerGuidance(replacement.successor), successor.guidance);
});

test("a failure before the replacement commit leaves the predecessor active", () => {
  const predecessor = activeCandidate();
  const successor = approvedSuccessor(predecessor);
  let commitCalled = false;

  assert.throws(() => replaceActiveLesson(predecessor, successor, {
    ...activationCommand(),
    occurredAt: "2026-08-09T12:00:00.000Z",
    revisionId: successor.revisionId,
    regressionEvidence: [],
  }, {
    replaceActiveRevision() { commitCalled = true; },
    appendBlockedReplacement() {},
  }), CandidateTransitionError);

  assert.equal(commitCalled, false);
  assert.equal(selectConsumerGuidance(predecessor), predecessor.guidance);
  assert.equal(selectConsumerGuidance(successor), null);
});

test("a failure inside the replacement commit cannot mutate either input revision", () => {
  const predecessor = activeCandidate();
  const successor = approvedSuccessor(predecessor);
  const commitFailure = new Error("injected commit failure");
  let visible: (ActiveLesson | SupersededLesson)[] = [predecessor];

  assert.throws(() => replaceActiveLesson(predecessor, successor, {
    ...activationCommand(),
    occurredAt: "2026-08-09T12:00:00.000Z",
    revisionId: successor.revisionId,
    regressionEvidence: ["regression-safe-publication-v2"],
  }, {
    replaceActiveRevision(superseded, active) {
      const uncommitted = [superseded, active];
      assert.equal(uncommitted.filter(({ state }) => state === "active").length, 1);
      throw commitFailure;
    },
    appendBlockedReplacement() {},
  }), (error) => error === commitFailure);

  assert.deepEqual(visible, [predecessor]);
  assert.equal(predecessor.state, "active");
  assert.equal(successor.state, "approved");
  assert.equal(selectConsumerGuidance(predecessor), predecessor.guidance);
  assert.equal(selectConsumerGuidance(successor), null);
});

test("cross-lesson supersession atomically records bidirectional lineage to an active replacement", () => {
  const predecessor = activeCandidate();
  const replacement = {
    ...activeCandidate(),
    lessonId: "lesson_safe_content_transport",
    revisionId: "lesson_safe_content_transport:1",
    title: "Transport arbitrary content through data-only boundaries",
    guidance: "Use a data-only transport for arbitrary content.",
    approval: {
      ...activeCandidate().approval,
      revisionId: "lesson_safe_content_transport:1",
    },
  } satisfies ActiveLesson;
  const revisions: (ActiveLesson | SupersededLesson)[] = [predecessor, replacement];
  const events: LifecycleEvent[] = [];
  const sink: CrossLessonSupersessionSink = {
    supersedeWithActiveReplacement(superseded, activeReplacement, event) {
      revisions.push(superseded, activeReplacement);
      events.push(event);
    },
  };

  const outcome = supersedeActiveLessonAcrossLessons(predecessor, replacement, {
    actor: { identity: "lesson-owner", authority: "lesson-retirer", kind: "human" },
    occurredAt: "2026-08-09T13:00:00.000Z",
    reason: "The replacement generalizes the publication-specific guidance.",
  }, sink);

  assert.equal(outcome.superseded.supersededByLessonId, replacement.lessonId);
  assert.equal(outcome.superseded.supersededByRevisionId, replacement.revisionId);
  assert.deepEqual(outcome.replacement.replaces, [{
    lessonId: predecessor.lessonId,
    revisionId: predecessor.revisionId,
  }]);
  const queriedReplacement: OperationalLesson = outcome.replacement;
  assert.deepEqual(queriedReplacement.state === "active" ? queriedReplacement.replaces : undefined,
    outcome.replacement.replaces);
  assert.equal(outcome.replacement.state, "active");
  assert.equal(selectConsumerGuidance(outcome.superseded), null);
  assert.equal(selectConsumerGuidance(outcome.replacement), replacement.guidance);
  assert.deepEqual(revisions.slice(0, 2), [predecessor, replacement]);
  assert.equal(events[0]?.reason, "active lesson superseded by cross-lesson replacement");
});

test("cross-lesson supersession rejects a replacement that is not active", () => {
  const predecessor = activeCandidate();
  const replacement = approvedCandidate();
  let committed = false;

  assert.throws(() => supersedeActiveLessonAcrossLessons(predecessor, replacement, {
    actor: { identity: "lesson-owner", authority: "lesson-retirer", kind: "human" },
    occurredAt: "2026-08-09T13:00:00.000Z",
    reason: "The replacement generalizes the publication-specific guidance.",
  }, {
    supersedeWithActiveReplacement() { committed = true; },
  }), CandidateTransitionError);

  assert.equal(committed, false);
  assert.equal(selectConsumerGuidance(predecessor), predecessor.guidance);
});

test("retirement records its human disposition without naming a replacement", () => {
  const active = activeCandidate();
  const revisions: (ActiveLesson | RetiredLesson)[] = [active];
  const events: LifecycleEvent[] = [];
  const sink: RetirementSink = {
    retireActiveRevision(retired, event) {
      revisions.push(retired);
      events.push(event);
    },
  };

  const retired = retireActiveLesson(active, {
    actor: { identity: "lesson-owner", authority: "lesson-retirer", kind: "human" },
    occurredAt: "2026-08-09T14:00:00.000Z",
    reason: "The guidance no longer applies to supported publication paths.",
  }, sink);

  assert.equal(retired.state, "retired");
  assert.equal(retired.retiredBy, "lesson-owner");
  assert.equal(retired.retiredAt, "2026-08-09T14:00:00.000Z");
  assert.equal(retired.retirementReason, "The guidance no longer applies to supported publication paths.");
  assert.equal("supersededByRevisionId" in retired, false);
  assert.equal(selectConsumerGuidance(retired), null);
  assert.deepEqual(revisions[0], active);
  assert.equal(events[0]?.reason, "active lesson retired without replacement");
});

test("retirement requires a human actor", () => {
  const active = activeCandidate();
  let committed = false;

  assert.throws(() => retireActiveLesson(active, {
    actor: { identity: "cleanup-service", authority: "lesson-retirer", kind: "service" },
    occurredAt: "2026-08-09T14:00:00.000Z",
    reason: "The guidance no longer applies to supported publication paths.",
  }, {
    retireActiveRevision() { committed = true; },
  }), CandidateValidationError);

  assert.equal(committed, false);
  assert.equal(selectConsumerGuidance(active), active.guidance);
});

test("an overdue review alerts without changing active lesson semantics", () => {
  const active = activeCandidate();
  const events: LifecycleEvent[] = [];
  const sink: ActiveLessonDeadlineSink = {
    applyDeadlineOutcome(lesson, deadlineEvents) {
      assert.equal(lesson, active);
      events.push(...deadlineEvents);
    },
  };

  const outcome = evaluateActiveLessonDeadlines(active, {
    actor: { identity: "lesson-scheduler", authority: "lesson-lifecycle", kind: "service" },
    occurredAt: "2026-09-10T10:30:00.000Z",
  }, sink);

  assert.equal(outcome.lesson, active);
  assert.equal(outcome.overdueReview, true);
  assert.equal(selectConsumerGuidance(outcome.lesson), active.guidance);
  assert.equal(events[0]?.reason, "active lesson review is overdue");
  assert.equal(events[0]?.toState, "active");
});

test("a completed active lesson review records accountability, evidence, and its next deadline", () => {
  const active = activeCandidate();
  const events: LifecycleEvent[] = [];
  const sink: ActiveLessonReviewSink = {
    appendCompletedReview(_lesson, event) { events.push(event); },
  };

  const reviewed = completeActiveLessonReview(active, {
    actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
    occurredAt: "2026-09-10T11:00:00.000Z",
    outcome: "confirmed",
    evidenceConsidered: ["evidence-42", "regression-safe-publication"],
    nextReviewAt: "2026-10-10T11:00:00.000Z",
  }, sink);

  assert.equal(reviewed, active);
  assert.equal(events[0]?.reason, "active lesson review completed");
  assert.equal(events[0]?.actor, "human-reviewer");
  assert.equal(events[0]?.occurredAt, "2026-09-10T11:00:00.000Z");
  assert.deepEqual("evidenceConsidered" in events[0]! ? events[0].evidenceConsidered : undefined,
    ["evidence-42", "regression-safe-publication"]);
  assert.equal("nextReviewAt" in events[0]! ? events[0].nextReviewAt : undefined,
    "2026-10-10T11:00:00.000Z");
  assert.equal(selectConsumerGuidance(reviewed), active.guidance);
});

test("a completed review establishes the operative next review deadline", () => {
  const active = activeCandidate();
  let completedReview: Extract<LifecycleEvent, { reason: "active lesson review completed" }> | undefined;
  completeActiveLessonReview(active, {
    actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
    occurredAt: "2026-09-10T11:00:00.000Z",
    outcome: "confirmed",
    evidenceConsidered: ["evidence-42"],
    nextReviewAt: "2026-10-10T11:00:00.000Z",
  }, {
    appendCompletedReview(_lesson, event) { completedReview = event; },
  });

  const outcome = evaluateActiveLessonDeadlines(active, {
    actor: { identity: "lesson-scheduler", authority: "lesson-lifecycle", kind: "service" },
    occurredAt: "2026-09-11T11:00:00.000Z",
  }, { applyDeadlineOutcome() {} }, completedReview);

  assert.equal(outcome.overdueReview, false);
});

test("a future completed review cannot alter an earlier deadline evaluation", () => {
  const active = activeCandidate();
  let completedReview: Extract<LifecycleEvent, { reason: "active lesson review completed" }> | undefined;
  completeActiveLessonReview(active, {
    actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
    occurredAt: "2026-09-10T11:00:00.000Z",
    outcome: "confirmed",
    evidenceConsidered: ["evidence-42"],
    nextReviewAt: "2026-10-10T11:00:00.000Z",
  }, { appendCompletedReview(_lesson, event) { completedReview = event; } });

  assert.throws(() => evaluateActiveLessonDeadlines(active, {
    actor: { identity: "lesson-scheduler", authority: "lesson-lifecycle", kind: "service" },
    occurredAt: "2026-09-09T11:00:00.000Z",
  }, { applyDeadlineOutcome() { assert.fail("future review must not affect current deadlines"); } }, completedReview),
  CandidateTransitionError);
});

test("separate overdue alerts have distinct audit identities", () => {
  const active = activeCandidate();
  const eventIds: string[] = [];
  const sink: ActiveLessonDeadlineSink = {
    applyDeadlineOutcome(_lesson, events) { eventIds.push(...events.map(({ eventId }) => eventId)); },
  };
  for (const occurredAt of ["2026-09-10T10:30:00.000Z", "2026-09-11T10:30:00.000Z"]) {
    evaluateActiveLessonDeadlines(active, {
      actor: { identity: "lesson-scheduler", authority: "lesson-lifecycle", kind: "service" },
      occurredAt,
    }, sink);
  }

  assert.notEqual(eventIds[0], eventIds[1]);
});

test("an active lesson review rejects evidence that is not durably bound to the revision", () => {
  const active = activeCandidate();
  assert.throws(() => completeActiveLessonReview(active, {
    actor: { identity: "human-reviewer", authority: "lesson-approver", kind: "human" },
    occurredAt: "2026-09-10T11:00:00.000Z",
    outcome: "confirmed",
    evidenceConsidered: ["missing-evidence"],
    nextReviewAt: "2026-10-10T11:00:00.000Z",
  }, {
    appendCompletedReview() { assert.fail("unbound review evidence must not be recorded"); },
  }), CandidateTransitionError);
});

test("passing hard expiry atomically retires guidance as expired", () => {
  const active = activeCandidate();
  const events: LifecycleEvent[] = [];
  const sink: ActiveLessonDeadlineSink = {
    applyDeadlineOutcome(_lesson, deadlineEvents) { events.push(...deadlineEvents); },
  };

  const outcome = evaluateActiveLessonDeadlines(active, {
    actor: { identity: "lesson-scheduler", authority: "lesson-lifecycle", kind: "service" },
    occurredAt: "2026-11-09T10:30:00.000Z",
  }, sink);

  assert.equal(outcome.lesson.state, "retired");
  assert.equal(outcome.lesson.retirementReason, "expired");
  assert.equal(outcome.lesson.retiredBy, "lesson-scheduler");
  assert.equal(selectConsumerGuidance(outcome.lesson), null);
  const expiryEvent = events.find((event) => event.reason === "active lesson approval expired");
  assert.equal(expiryEvent?.toState, "retired");
  assert.deepEqual(expiryEvent && "unreconciledEnforcementLinks" in expiryEvent
    ? expiryEvent.unreconciledEnforcementLinks
    : undefined, ["control-safe-publication-test"]);
});

test("approval without hard expiry preserves its accepted rationale", () => {
  const approved = approvedCandidate({
    expiresAt: undefined,
    expiryRationale: "This invariant is durable; quarterly review remains mandatory.",
  });

  assert.equal(approved.approval.expiresAt, undefined);
  assert.equal(approved.approval.expiryRationale,
    "This invariant is durable; quarterly review remains mandatory.");
});

test("Markdown is published as inert, byte-preserved data", () => {
  const workspace = mkdtempSync(join(tmpdir(), "lesson-publication-"));
  const marker = join(workspace, "executed");
  const markdown = `# Report\n\n\`touch ${marker}\`\n\n$(printf nope)`;

  try {
    const interpreter = spawnSync("sh", ["-c", "cat"], { input: markdown, encoding: "utf8" });
    let published = "";
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        published += String(chunk);
        callback();
      },
    });

    publishMarkdown(interpreter.stdout, destination);

    assert.equal(interpreter.status, 0);
    assert.equal(published, markdown);
    assert.equal(existsSync(marker), false);
  } finally {
    rmSync(workspace, { recursive: true });
  }
});
