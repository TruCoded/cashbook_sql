const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function server() {
  const routes = new Map();
  const saved = [];
  const queries = [];
  const messages = [];
  const app = { use() {}, get(url, fn) { routes.set('GET ' + url, fn); }, post(url, fn) { routes.set('POST ' + url, fn); }, listen() {} };
  const express = () => app;
  express.json = () => () => {};
  const modules = {
    dotenv: { config() {} }, express, cors: () => () => {},
    nodemailer: { createTransport: () => ({ sendMail: async (mail) => { messages.push(mail); return { accepted: [mail.to] }; } }) },
    mongoose: { connection: { readyState: 1 } },
    './db': {
      connectDB: async () => true,
      Otp: { deleteMany: async () => {}, create: async (record) => saved.push(record), findOneAndDelete: async (query) => { queries.push(query); return null; } },
      User: {}, Cashbook: {}, Collaborator: {},
    },
  };
  const context = vm.createContext({
    require: (name) => modules[name] || require(name),
    __dirname, Buffer, console, process: { env: { GMAIL_USER: 'sender@example.com', GMAIL_APP_PASSWORD: 'test-password' } },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8'), context);
  async function post(url, body) {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; return this; } };
    assert.ok(routes.has('POST ' + url), 'Route must be registered: ' + url);
    await routes.get('POST ' + url)({ body, params: { id: 'book' } }, res);
    return res;
  }
  return { post, saved, queries, messages };
}

test('signup OTP has a public route that saves authentication codes without a session', async () => {
  const app = server();
  const res = await app.post('/api/auth/otp/request', { email: ' Person@Example.com ' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.sent, true);
  assert.equal(app.saved[0].purpose, 'auth');
  assert.equal(app.messages[0].to, 'person@example.com');
});

test('collaborator OTP route saves a distinct invitation purpose', async () => {
  const app = server();
  await app.post('/api/otp/request', { email: 'person@example.com' });
  assert.equal(app.saved[0].purpose, 'invitation');
});

test('login only consumes unexpired authentication codes atomically', async () => {
  const app = server();
  const res = await app.post('/api/auth/otp-login', { email: 'person@example.com', otp: '123456' });
  assert.equal(res.statusCode, 400);
  assert.equal(app.queries[0].purpose, 'auth');
  assert.ok(Math.abs(app.queries[0].createdAt.$gt.getTime() - (Date.now() - 600000)) < 1000);
});

test('collaborator verification cannot consume authentication codes', async () => {
  const app = server();
  const res = await app.post('/api/cashbooks/:id/collaborators', { collaboratorEmail: 'person@example.com', otp: '123456' });
  assert.equal(res.statusCode, 400);
  assert.equal(app.queries[0].purpose, 'invitation');
  assert.ok(app.queries[0].createdAt.$gt);
});
