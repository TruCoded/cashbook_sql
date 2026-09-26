const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

function page(reply) {
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, { value: "", textContent: "", disabled: false, style: {},
      checkValidity: () => true, focus() {}, addEventListener(name, callback) { this[name] = callback; } });
    return elements.get(id);
  };
  const calls = [];
  const context = vm.createContext({
    window: { location: { hostname: "localhost", port: "8080" } },
    location: { search: "?id=cb-test" }, URLSearchParams, console,
    document: { getElementById: element },
    localStorage: { getItem: () => JSON.stringify({ token: "session-token" }) },
    sessionStorage: { getItem: () => null, setItem() {} },
    alert() {},
    fetch: async (url, options) => {
      if (!options) return { ok: true, json: async () => ({ name: "Book", cashIn: 0, cashOut: 0 }) };
      calls.push({ url, options });
      return reply(url, options);
    },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../frontend/cashbook-detail.js"), "utf8"), context);
  return { element, calls, context };
}

test("website shows SMTP error without opening the OTP form", async () => {
  const p = page(async () => ({ ok: false, json: async () => ({ error: "Gmail could not accept the invitation." }) }));
  p.element("collabEmail").value = "renudinesh09@gmail.com";
  await p.context.requestOtp();
  assert.match(p.element("collabErr").textContent, /Gmail could not/);
  assert.equal(p.element("otpStep").style.display, "none");
  assert.equal(p.element("sendOtpBtn").disabled, false);
});

test("website rejects gmailcom and never requests an OTP for an invalid address", async () => {
  const p = page(async () => { throw new Error("Should not request"); });
  p.element("collabEmail").value = "renudinesh09@gmailcom";
  await p.context.requestOtp();
  assert.equal(p.calls.length, 0);
  assert.match(p.element("collabErr").textContent, /valid email/);
});

test("website sends cashbook and session, then verifies the returned invitation ID", async () => {
  const p = page(async (url) => ({ ok: true, json: async () => url.endsWith("/otp/request")
    ? { sent: true, email: "renudinesh09@gmail.com", invitationId: "invitation-test" } : { added: true } }));
  p.element("collabEmail").value = " RenuDinesh09@gmail.com ";
  await p.context.requestOtp();
  assert.deepEqual(JSON.parse(p.calls[0].options.body), { email: "renudinesh09@gmail.com", cashbookId: "cb-test" });
  assert.equal(p.calls[0].options.headers.Authorization, "Bearer session-token");
  assert.equal(p.element("otpStep").style.display, "block");
  assert.equal(p.element("otpCode").value, "");
  p.element("otpCode").value = "123456";
  await p.context.verifyAndAdd();
  assert.equal(JSON.parse(p.calls[1].options.body).invitationId, "invitation-test");
  assert.equal(p.element("otpStep").style.display, "none");
});

test("changing recipient invalidates the website's current invitation", async () => {
  const p = page(async () => ({ ok: true, json: async () => ({ sent: true, email: "a@gmail.com", invitationId: "first" }) }));
  p.element("collabEmail").value = "a@gmail.com";
  await p.context.requestOtp();
  p.element("collabEmail").value = "b@gmail.com";
  p.element("collabEmail").input();
  p.element("otpCode").value = "123456";
  await p.context.verifyAndAdd();
  assert.equal(p.calls.length, 1);
  assert.equal(p.element("otpStep").style.display, "none");
});

test("website ignores duplicate send clicks while a request is pending", async () => {
  let finish;
  const p = page(() => new Promise((resolve) => { finish = resolve; }));
  p.element("collabEmail").value = "a@gmail.com";
  const pending = p.context.requestOtp();
  await p.context.requestOtp();
  assert.equal(p.calls.length, 1);
  assert.equal(p.element("collabEmail").disabled, true);
  finish({ ok: true, json: async () => ({ sent: true, email: "a@gmail.com", invitationId: "first" }) });
  await pending;
  assert.equal(p.element("collabEmail").disabled, false);
});
