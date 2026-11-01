import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, assertTrustedOrigin, readJson } from "./http";
import { activityCreateSchema, activityPatchSchema, courseCreateSchema, coursePatchSchema, eventTypeCreateSchema, passwordSchema } from "./schemas";
import { isOwnedPdfKey } from "./pdf-storage";
import { formatDateOnlyPtBr, normalizeDateOnly } from "./date";

test("readJson accepts a small valid JSON body", async () => {
  const request = new Request("https://controle.example/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "ok" }),
  });
  const parsed = await readJson(request, z.object({ value: z.literal("ok") }).strict());
  assert.deepEqual(parsed, { value: "ok" });
});

test("readJson rejects unsupported content types and oversized bodies", async () => {
  const wrongType = new Request("https://controle.example/api", { method: "POST", body: "{}" });
  await assert.rejects(() => readJson(wrongType, z.object({})), (error: ApiError) => error.status === 415);

  const oversized = new Request("https://controle.example/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(100) }),
  });
  await assert.rejects(() => readJson(oversized, z.object({ value: z.string() }), 32), (error: ApiError) => error.status === 413);
});

test("origin protection rejects cross-site mutations", () => {
  const request = new NextRequest("https://controle.example/api", {
    method: "POST",
    headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
  });
  assert.throws(() => assertTrustedOrigin(request), (error: ApiError) => error.status === 403);
});

test("activity validation rejects unknown fields, future dates and excessive workload", () => {
  const valid = {
    name: "Atividade",
    description: "Descrição",
    workload: 8,
    completionDate: "2025-01-01",
    pathFile: "00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002.pdf",
    hashFile: "a".repeat(64),
  };
  assert.equal(activityCreateSchema.safeParse(valid).success, true);
  assert.equal(activityCreateSchema.safeParse({ ...valid, admin: true }).success, false);
  assert.equal(activityCreateSchema.safeParse({ ...valid, workload: 10001 }).success, false);
  assert.equal(activityCreateSchema.safeParse({ ...valid, completionDate: "2999-01-01" }).success, false);
});

test("password and object-key validation enforce trust boundaries", () => {
  assert.equal(passwordSchema.safeParse("12345678").success, true);
  assert.equal(passwordSchema.safeParse("x".repeat(129)).success, false);
  const owner = "00000000-0000-4000-8000-000000000001";
  const object = "00000000-0000-4000-8000-000000000002";
  assert.equal(isOwnedPdfKey(owner, `${owner}/${object}.pdf`), true);
  assert.equal(isOwnedPdfKey(owner, `${owner}/../${object}.pdf`), false);
  assert.equal(isOwnedPdfKey(owner, `00000000-0000-4000-8000-000000000003/${object}.pdf`), false);
});

test("course updates accept the existing frontend project payload", () => {
  const projectId = "8ee5b0b0-16b1-4ba1-9f0a-db6842a7e97b";
  const parsed = coursePatchSchema.safeParse({
    projects: [{
      uid: projectId,
      id: projectId,
      name: "Projeto Teste 01",
      year: "2026",
      course: "Ciência da Computação",
    }],
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.projects?.[0].year, 2026);
});

test("registration schemas accept current and legacy-safe frontend payloads", () => {
  const createdAt = "2026-11-01T12:00:00.000Z";
  assert.equal(courseCreateSchema.safeParse({ name: "Ciência da Computação" }).success, true);
  assert.equal(courseCreateSchema.safeParse({ name: "Ciência da Computação", projects: [], createdAt }).success, true);
  assert.equal(eventTypeCreateSchema.safeParse({ name: "Congresso", createdAt }).success, true);

  const userId = "00000000-0000-4000-8000-000000000001";
  const activity = {
    name: "Atividade complementar",
    description: "Participação em congresso",
    workload: "8",
    completionDate: "2026-10-31",
    pathFile: `${userId}/00000000-0000-4000-8000-000000000002.pdf`,
    hashFile: "a".repeat(64),
    status: "pending",
    userId,
    createdAt,
  };
  assert.equal(activityCreateSchema.safeParse(activity).success, true);
  assert.equal(activityPatchSchema.safeParse({ status: "approved", observation: "OK", workload: "8", userId }).success, true);
});

test("activity dates are normalized without producing Invalid Date", () => {
  assert.equal(normalizeDateOnly("2026-10-31"), "2026-10-31");
  assert.equal(normalizeDateOnly("2026-10-31T03:00:00.000Z"), "2026-10-31");
  assert.equal(normalizeDateOnly(new Date("2026-10-31T00:00:00.000Z")), "2026-10-31");
  assert.equal(normalizeDateOnly("2026-02-31"), null);
  assert.equal(formatDateOnlyPtBr("2026-10-31T03:00:00.000Z"), "31/10/2026");
  assert.equal(formatDateOnlyPtBr("valor-inválido"), "Não informada");
});
