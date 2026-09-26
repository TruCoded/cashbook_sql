const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectDatabase, stateStore } = require("./mongoDb");
const { invitationService } = require("./invitations");
const { createApp } = require("./server");

let mongo, client, db, service, messages, clock;
const env = { GMAIL_USER: "sender@example.com", OTP_SECRET: "test-secret-with-at-least-32-characters" };
const cashbook = { id: "cb-test", name: "Shared cashbook", ownerId: "owner", transactions: [] };
const input = { email: "renudinesh09@gmail.com", cashbook, senderId: "owner" };
const codeFrom = (message) => message.text.match(/code is (\d{6})/)[1];
const verification = (result, code) => ({ cashbookId: cashbook.id,
  collaboratorEmail: result.email, invitationId: result.invitationId, otp: code });

before(async () => {
  mongo = await MongoMemoryServer.create();
  ({ client, db } = await connectDatabase({ MONGODB_URI: mongo.getUri(), MONGODB_DB: "tests" }));
});
after(async () => { await client?.close(); await mongo?.stop(); });
beforeEach(async () => {
  await Promise.all(["invitations", "mailLimits", "sessions"].map((name) => db.collection(name).deleteMany({})));
  messages = [];
  clock = new Date("2026-10-03T10:00:00Z");
  service = invitationService({ db, env, now: () => clock, mailer: {
    sendMail: async (message) => { messages.push(message); return { accepted: [message.to] }; },
  } });
});

test("sends only to the normalized recipient and keeps the code out of responses/storage", async () => {
  const result = await service.request({ ...input, email: "  RenuDinesh09@Gmail.com  " });
  assert.equal(messages[0].to, input.email);
  assert.equal(result.email, input.email);
  assert.equal(result.sent, true);
  const code = codeFrom(messages[0]);
  assert.ok(!JSON.stringify(result).includes(code));
  const stored = await db.collection("invitations").findOne({ email: input.email });
  assert.equal(stored.status, "pending");
  assert.ok(!JSON.stringify(stored).includes(code));
});

test("rejects malformed email, including gmailcom and header injection, without sending", async () => {
  for (const email of ["renudinesh09@gmailcom", "layere", "a@gmail.com\r\nBcc:b@gmail.com", "a@gmail.com,b@gmail.com", { $ne: null }]) {
    await assert.rejects(service.request({ ...input, email }), { status: 400 });
  }
  assert.equal(messages.length, 0);
});

test("missing mail credentials returns failure instead of a demo OTP", async () => {
  const unavailable = invitationService({ db, env, mailer: null });
  await assert.rejects(unavailable.request(input), { status: 503 });
  assert.equal(await db.collection("invitations").countDocuments(), 0);
});

test("SMTP failure and rejected recipient cannot be verified", async () => {
  for (const mode of ["throw", "reject"]) {
    await db.collection("invitations").deleteMany({});
    const unavailable = invitationService({ db, env, mailer: { sendMail: async (message) => {
      messages.push(message);
      if (mode === "throw") throw new Error("SMTP unavailable");
      return { accepted: [] };
    } } });
    await assert.rejects(unavailable.request(input), { status: 502 });
    const record = await db.collection("invitations").findOne({ email: input.email });
    assert.equal(record.status, "failed");
    assert.equal(record.otpHash, undefined);
    await assert.rejects(service.verify(verification({ email: input.email, invitationId: record.invitationId }, codeFrom(messages.at(-1)))), { status: 400 });
  }
});

test("code is bound to email, cashbook and invitation", async () => {
  const result = await service.request(input);
  const valid = verification(result, codeFrom(messages[0]));
  for (const override of [{ collaboratorEmail: "someone@gmail.com" }, { cashbookId: "other" }, { invitationId: "other" }]) {
    await assert.rejects(service.verify({ ...valid, ...override }), { status: 400 });
  }
  assert.deepEqual(await service.verify(valid), { added: true });
  await assert.rejects(service.verify(valid), { status: 400 });
  await assert.rejects(service.request(input), { status: 409 });
});

test("expires after ten minutes even before database cleanup", async () => {
  const result = await service.request(input);
  clock = new Date(clock.getTime() + 600000);
  await assert.rejects(service.verify(verification(result, codeFrom(messages[0]))), { status: 400 });
});

test("five wrong attempts lock the code", async () => {
  const result = await service.request(input);
  for (let i = 0; i < 5; i++) await assert.rejects(service.verify(verification(result, "000000")), { status: 400 });
  await assert.rejects(service.verify(verification(result, codeFrom(messages[0]))), { status: 400 });
});

test("resend cooldown is atomic and a resend invalidates the previous invitation", async () => {
  const results = await Promise.allSettled([service.request(input), service.request(input)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.find((r) => r.status === "rejected").reason.status, 429);
  const original = results.find((r) => r.status === "fulfilled").value;
  clock = new Date(clock.getTime() + 60001);
  const replacement = await service.request(input);
  await assert.rejects(service.verify(verification(original, codeFrom(messages[0]))), { status: 400 });
  assert.deepEqual(await service.verify(verification(replacement, codeFrom(messages[1]))), { added: true });
});

test("parallel valid submissions grant access once", async () => {
  const result = await service.request(input);
  const valid = verification(result, codeFrom(messages[0]));
  const results = await Promise.allSettled([service.verify(valid), service.verify(valid)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(await db.collection("invitations").countDocuments({ status: "active" }), 1);
});

test("sender rate limit also applies across different recipient addresses", async () => {
  for (let i = 0; i < 10; i++) await service.request({ ...input, email: `recipient${i}@example.com` });
  await assert.rejects(service.request({ ...input, email: "another@example.com" }), { status: 429 });
  assert.equal(messages.length, 10);
});

test("MongoDB state writes reject concurrent stale updates instead of losing data", async () => {
  const store = stateStore(db);
  const a = await store.readDB();
  const b = await store.readDB();
  await store.writeDB(a);
  await assert.rejects(store.writeDB(b), { status: 409 });
});

test("legacy import hashes passwords, drops OTPs, and refuses to overwrite data", async () => {
  const fs = require("node:fs/promises");
  const path = require("node:path");
  const crypto = require("node:crypto");
  const { promisify } = require("node:util");
  const execFile = promisify(require("node:child_process").execFile);
  const directory = await fs.mkdtemp(path.join(require("node:os").tmpdir(), "cashbook-import-test-"));
  const file = path.join(directory, "export.json");
  try {
    await fs.writeFile(file, JSON.stringify({ users: [{ id: "old-user", email: " OLD@Example.com ", password: "old-password" }],
      cashbooks: [cashbook], collaborators: [], otps: [{ email: "old@example.com", code: "123456" }] }));
    const args = [path.join(__dirname, "import-json.js"), file];
    const options = { env: { ...process.env, MONGODB_URI: mongo.getUri(), MONGODB_DB: "migration" } };
    await execFile(process.execPath, args, options);
    const state = await client.db("migration").collection("state").findOne({ _id: "cashbook" });
    assert.equal(state.users[0].id, "old-user");
    assert.equal(state.users[0].email, "old@example.com");
    assert.equal(state.users[0].password, undefined);
    assert.equal(state.users[0].passwordHash, crypto.scryptSync("old-password", state.users[0].salt, 64).toString("hex"));
    assert.equal(state.otps, undefined);
    await assert.rejects(execFile(process.execPath, args, options), /not empty/);
  } finally {
    await fs.unlink(file);
    await fs.rmdir(directory);
  }
});

test("HTTP integration: real login, owner-only sending, verification and shared book visibility", async () => {
  process.env.OTP_SECRET = env.OTP_SECRET;
  process.env.GMAIL_USER = env.GMAIL_USER;
  const app = createApp(db, { sendMail: async (message) => { messages.push(message); return { accepted: [message.to] }; } });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const post = async (path, body, token = "") => {
    const res = await fetch(url + path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    return { status: res.status, data: await res.json() };
  };
  try {
    const signedUp = await post("/signup", { name: "Owner", email: "owner@example.com", password: "test-password" });
    assert.equal(signedUp.status, 200);
    const login = await post("/login", { email: " OWNER@example.com ", password: "test-password" });
    assert.equal(login.status, 200);
    const token = login.data.token;
    const book = await post("/cashbooks", { name: "Shared", ownerId: login.data.id });
    const payload = { email: input.email, cashbookId: book.data.id };
    assert.equal((await post("/otp/request", payload)).status, 401);
    const stranger = await post("/signup", { email: "stranger@example.com", password: "test-password" });
    assert.equal((await post("/otp/request", payload, stranger.data.token)).status, 403);
    const sent = await post("/otp/request", payload, token);
    assert.equal(sent.status, 200);
    const before = await (await fetch(`${url}/cashbooks?email=${input.email}`)).json();
    assert.ok(!before.some((item) => item.id === book.data.id));
    const verified = await post(`/cashbooks/${book.data.id}/collaborators`, {
      collaboratorEmail: input.email, otp: codeFrom(messages[0]), invitationId: sent.data.invitationId,
    }, token);
    assert.equal(verified.status, 200);
    const after = await (await fetch(`${url}/cashbooks?email=${input.email}`)).json();
    assert.ok(after.some((item) => item.id === book.data.id));
    assert.equal((await post("/auth/google", { email: "fake@example.com" })).status >= 400, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
