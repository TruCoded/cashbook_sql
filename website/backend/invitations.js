const crypto = require("node:crypto");
const nodemailer = require("nodemailer");

const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
const validEmail = (email) => email.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email);
const fail = (status, message) => Object.assign(new Error(message), { status });
const hashCode = (secret, id, code) => crypto.createHmac("sha256", secret).update(`${id}:${code}`).digest("hex");

function createMailer(env = process.env) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD.replace(/\s/g, "") },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  });
}

function invitationService({ db, mailer, env = process.env, now = () => new Date() }) {
  const invitations = db.collection("invitations");
  async function request({ email: input, cashbook, senderId }) {
    const email = normalizeEmail(input);
    if (!validEmail(email)) throw fail(400, "Enter a valid email address, for example name@gmail.com.");
    if (!mailer || !env.OTP_SECRET || env.OTP_SECRET.length < 32) {
      throw fail(503, "Email delivery is not configured. Ask the administrator to configure Gmail SMTP.");
    }
    const time = now();
    // A shared MongoDB counter limits requests across server instances.
    const bucket = Math.floor(time.getTime() / 3600000);
    for (const key of [`sender:${senderId}`, `recipient:${email}`]) {
      const limit = await db.collection("mailLimits").findOneAndUpdate(
        { _id: `${key}:${bucket}` },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(time.getTime() + 7200000) } },
        { upsert: true, returnDocument: "after" },
      );
      if (limit.count > 10) throw fail(429, "Too many email requests. Please try again in an hour.");
    }
    const key = { cashbookId: cashbook.id, email };
    const id = crypto.randomUUID();
    const code = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(time.getTime() + 10 * 60000);
    try {
      await invitations.findOneAndUpdate({ ...key, status: { $ne: "active" },
        nextSendAt: { $not: { $gt: time } } }, {
        $set: { invitationId: id, status: "sending", otpHash: hashCode(env.OTP_SECRET, id, code),
          attempts: 0, expiresAt, nextSendAt: new Date(time.getTime() + 60000), senderId },
      }, { upsert: true, returnDocument: "after" });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const previous = await invitations.findOne(key);
      throw fail(previous?.status === "active" ? 409 : 429,
        previous?.status === "active" ? "This collaborator already has access." : "Wait 60 seconds before resending the invitation.");
    }
    try {
      const result = await mailer.sendMail({
        from: { name: "Cashbook", address: env.GMAIL_USER }, to: email,
        subject: "Cashbook invitation - verification code",
        text: `You have been invited to collaborate on "${cashbook.name}".\n\nYour verification code is ${code}.\n\nThis code expires in 10 minutes and only works for this email and cashbook. Enter it in the Cashbook app or website's collaborator form to accept this invitation. Only share it with the cashbook owner if you want them to confirm access for you.\n\nIf you were not expecting this invitation, ignore this email.`,
      });
      if (!result.accepted?.some((address) => normalizeEmail(address) === email)) throw new Error("Recipient rejected");
    } catch (error) {
      await invitations.updateOne({ ...key, invitationId: id, status: "sending" }, {
        $set: { status: "failed" }, $unset: { otpHash: "" },
      });
      // Never log the SMTP payload, credentials, or verification code.
      throw fail(502, "Gmail could not accept the invitation. Check the sender's SMTP configuration and retry.");
    }
    const pending = await invitations.updateOne({ ...key, invitationId: id, status: "sending" }, { $set: { status: "pending", sentAt: now() } });
    if (!pending.modifiedCount) throw fail(409, "A newer invitation replaced this request. Use the latest email code.");
    return { sent: true, email, invitationId: id, expiresIn: 600, retryAfter: 60 };
  }

  async function verify({ cashbookId, collaboratorEmail, otp, invitationId, accountNumber, ifsc }) {
    const email = normalizeEmail(collaboratorEmail);
    if (!validEmail(email) || typeof otp !== "string" || !/^\d{6}$/.test(otp) || typeof invitationId !== "string") {
      throw fail(400, "Enter the six-digit code from the invitation email.");
    }
    const key = { cashbookId, email, invitationId, status: "pending", expiresAt: { $gt: now() }, attempts: { $lt: 5 } };
    // Claim an attempt atomically, so parallel guesses cannot bypass the limit.
    const invitation = await invitations.findOneAndUpdate(key, { $inc: { attempts: 1 } }, { returnDocument: "after" });
    if (!invitation) throw fail(400, "Invitation expired, already used, or too many attempts. Request a new code.");
    const expected = hashCode(env.OTP_SECRET, invitationId, otp);
    if (!crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(invitation.otpHash, "hex"))) {
      throw fail(400, "Incorrect code. Check the invitation email and try again.");
    }
    // Access and code consumption happen in the same document update.
    const accepted = await invitations.updateOne({ ...key, attempts: { $lte: 5 }, otpHash: expected }, {
      $set: { status: "active", acceptedAt: now(),
        accountNumber: typeof accountNumber === "string" ? accountNumber.slice(0, 100) : "",
        ifsc: typeof ifsc === "string" ? ifsc.slice(0, 30) : "" },
      $unset: { otpHash: "" },
    });
    if (!accepted.modifiedCount) throw fail(400, "Invitation is no longer valid. Request a new code.");
    return { added: true };
  }
  return { request, verify };
}

module.exports = { invitationService, createMailer, normalizeEmail, validEmail };
