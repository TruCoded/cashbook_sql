const dns = require('node:dns');
const { isIPv4 } = require('node:net');

function createGmailMailer(env = process.env, dependencies = {}) {
  const user = (env.GMAIL_USER || '').trim();
  const pass = (env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  if (!user || !pass) return null;
  const resolve4 = dependencies.resolve4 || ((host) => dns.promises.resolve4(host));
  const createTransport = dependencies.createTransport || require('nodemailer').createTransport;
  async function transport() {
    // Resolve A records explicitly: Nodemailer's own resolver can select IPv6
    // even when Node's default result order is ipv4first.
    const addresses = await resolve4('smtp.gmail.com');
    const host = addresses.find(isIPv4);
    if (!host) throw new Error('Gmail SMTP has no reachable IPv4 DNS record');
    return createTransport({
      host, port: 465, secure: true,
      // Do not use service: gmail: that preset replaces the explicit IP host.
      tls: { servername: 'smtp.gmail.com', rejectUnauthorized: true },
      auth: { user, pass },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    });
  }
  return {
    async sendMail(message) { return (await transport()).sendMail(message); },
    async verify() { return (await transport()).verify(); },
  };
}
module.exports = { createGmailMailer };
