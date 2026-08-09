import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";

import { test } from "@jest/globals";

import {
  captureCandidate,
  CandidateValidationError,
  publishMarkdown,
  selectConsumerGuidance,
  type CaptureCandidateCommand,
  type CaptureSink,
  type CandidateLesson,
  type LifecycleEvent,
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
  actor: { identity: "capture-agent", authority: "incident-capture" },
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
