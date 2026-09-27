const test = require("node:test");
const assert = require("node:assert/strict");
const { requestOtp } = require("./request-otp");

function setup(sendMail, mode = "smtp") {
  const saved = [];
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  const handler = requestOtp({
    getMailer: () => sendMail ? { sendMail } : null,
    sender: () => '"Cashbook" <sender@example.com>',
    mode,
    saveCode: async (...args) => saved.push(args),
  });
  return { saved, res, run: (email) => handler({ body: { email } }, res) };
}

test("public signup waits for mail acceptance and never returns the code", async () => {
  let release;
  let message;
  const ctx = setup(async (mail) => {
    message = mail;
    await new Promise((resolve) => { release = resolve; });
    return { accepted: [mail.to] };
  });
  const pending = ctx.run(" Person@Example.com ");
  assert.equal(ctx.res.body, undefined);
  assert.equal(ctx.saved.length, 0);
  release();
  await pending;
  assert.equal(message.to, "person@example.com");
  assert.match(ctx.saved[0][1], /^\d{6}$/);
  assert.deepEqual(ctx.res.body, { sent: true, emailSent: true });
});

test("demo mode saves auth code and returns it for on-screen entry without sending email", async () => {
  const ctx = setup(() => assert.fail("demo mode must not send email"), "demo");
  await ctx.run("Person@Example.com");
  assert.equal(ctx.res.statusCode, 200);
  assert.equal(ctx.res.body.demo, true);
  assert.equal(ctx.res.body.emailSent, false);
  assert.equal(ctx.res.body.demoCode, ctx.saved[0][1]);
  assert.match(ctx.res.body.demoCode, /^\d{6}$/);
});

for (const [name, transport] of [
  ["missing configuration", null],
  ["SMTP timeout", async () => { throw new Error("Connection timeout"); }],
  ["rejected recipient", async () => ({ accepted: [] })],
]) {
  test(`${name} reports failure without saving a code`, async () => {
    const ctx = setup(transport);
    await ctx.run("person@example.com");
    assert.equal(ctx.res.statusCode, 503);
    assert.equal(ctx.saved.length, 0);
    assert.equal(ctx.res.body.sent, undefined);
  });
}

test("malformed recipient never reaches the mail transport", async () => {
  const ctx = setup(async () => { assert.fail("must not send"); });
  await ctx.run("person@gmailcom");
  assert.equal(ctx.res.statusCode, 400);
  assert.equal(ctx.saved.length, 0);
});
