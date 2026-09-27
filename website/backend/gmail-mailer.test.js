const test = require('node:test');
const assert = require('node:assert/strict');
const { createGmailMailer } = require('./gmail-mailer');
const env = { GMAIL_USER: ' sender@gmail.com ', GMAIL_APP_PASSWORD: 'test pass' };
test('SMTP send and verify connect to IPv4 while validating Gmail TLS hostname', async () => {
  const options = [];
  const mailer = createGmailMailer(env, {
    resolve4: async (host) => { assert.equal(host, 'smtp.gmail.com'); return ['192.0.2.10']; },
    createTransport: (config) => { options.push(config); return { sendMail: async () => ({ accepted: ['recipient@example.com'] }), verify: async () => true }; },
  });
  assert.equal(await mailer.verify(), true);
  assert.deepEqual(await mailer.sendMail({ to: 'recipient@example.com' }), { accepted: ['recipient@example.com'] });
  for (const config of options) {
    assert.equal(config.host, '192.0.2.10');
    assert.equal(config.service, undefined);
    assert.equal(config.port, 465);
    assert.equal(config.secure, true);
    assert.equal(config.tls.servername, 'smtp.gmail.com');
    assert.equal(config.tls.rejectUnauthorized, true);
    assert.equal(config.auth.pass, 'testpass');
  }
});
test('DNS failure propagates without sending or falling back to IPv6', async () => {
  const mailer = createGmailMailer(env, { resolve4: async () => { throw new Error('DNS unavailable'); }, createTransport: () => assert.fail('must not connect') });
  await assert.rejects(mailer.sendMail({}), /DNS unavailable/);
});
test('IPv6-only result is rejected', async () => {
  const mailer = createGmailMailer(env, { resolve4: async () => ['::1'], createTransport: () => assert.fail('must not connect') });
  await assert.rejects(mailer.verify(), /IPv4/);
});
test('unconfigured mailer stays unavailable', () => assert.equal(createGmailMailer({}), null));
