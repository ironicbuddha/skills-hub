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
  captureCandidate,
  CandidateTransitionError,
  CandidateValidationError,
  publishMarkdown,
  reviseCandidate,
  rejectCandidate,
  submitCandidateForReview,
  selectConsumerGuidance,
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
  type ReviewAssignment,
  type ReviewSink,
  type RevisionSink,
  type RejectedCandidateLesson,
  type RejectionSink,
} from "../src/operational-lessons.ts";

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
  assert.equal(events[0]?.outcome, "completed");
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
  assert.equal(events[0]?.outcome, "blocked");
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
  assert.equal(events[0]?.outcome, "completed");
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
  assert.equal(events[0]?.outcome, "blocked");
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
    revisionIds: ["lesson_publication_boundary:1", "lesson_other:1"],
    overlappingScope: "Repository Markdown publication.",
    contradictoryObligations: ["Use the shell interpreter.", "Never use the shell interpreter."],
    discoveredAt: "2026-08-09T10:20:00.000Z",
    discoveredBy: "human-reviewer",
    severity: "high" as const,
    status: "open" as const,
    owner: "platform-safety",
    resolutionRationale: null,
    resolutionAuthority: null,
    exceptionExpiresAt: null,
    resultingRevisionIds: [],
  };
  const approved = approvedCandidate({ conflictReferences: [conflict.conflictId], conflictRecords: [conflict] });

  assert.throws(() => activateApprovedLesson(approved, activationCommand(), {
    activateAsSoleRevision() { assert.fail("an open conflict must block activation"); },
    appendBlockedActivation() {},
  }), CandidateTransitionError);
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
