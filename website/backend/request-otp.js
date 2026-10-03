const { randomInt } = require("node:crypto");

// Keep signup public; only successful mail delivery creates a usable code.
function requestOtp({ getMailer, saveCode, sender }) {
  return async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    const mailer = getMailer();
    if (!mailer) return res.status(503).json({ error: "Email delivery is not configured. Please use password sign-in for now." });
    const code = String(randomInt(100000, 1000000));
    try {
      const result = await mailer.sendMail({
        from: sender(),
        to: email,
        subject: "Your Cashbook verification code",
        text: `Your Cashbook verification code is ${code}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
      });
      if (!result.accepted?.some((address) => address.toLowerCase() === email)) {
        throw new Error("Recipient not accepted");
      }
      await saveCode(email, code);
      return res.json({ sent: true, emailSent: true });
    } catch {
      return res.status(503).json({ error: "We couldn't send your email. Please try again later or use password sign-in." });
    }
  };
}

module.exports = { requestOtp };
