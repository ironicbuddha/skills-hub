import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";

import { test } from "@jest/globals";

import {
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
