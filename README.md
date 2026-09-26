# Cashbook: website and mobile app

The website in `website/frontend` and the Expo app in `app` share an Express backend in `website/backend`.
The backend stores cashbooks and users in MongoDB and sends invitation emails directly through Gmail SMTP using Nodemailer. There is no external email delivery service and no Apps Script dependency in the active backend.

## Backend setup

1. Run MongoDB locally or provision a MongoDB server accessible to your backend.
2. In `website/backend`, run `npm ci` and copy `.env.example` to `.env`.
3. Set `MONGODB_URI`, `MONGODB_DB`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and a random `OTP_SECRET` of at least 32 characters. Generate the secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. The sender Gmail account needs 2-Step Verification and a Google App Password. Use a newly generated app password, not the normal account password. Keep all credentials on the backend. The recipient needs no setup or app password.
5. Run `npm start`. `/api/health` checks MongoDB connectivity; it does not claim SMTP delivery is working.
6. Serve `website/frontend` locally with a static server. The frontend uses `http://localhost:5000/api` for localhost previews. In production Vercel proxies `/api` to the backend specified in the Vercel configuration.

Gmail setup reference: https://nodemailer.com/guides/using-gmail

A Gmail app password previously appeared in the mobile README. Revoke that exposed password in the sender's Google account and replace it. Removing the text does not revoke the credential or erase earlier copies.

## Deploying

Set the same environment variables in the backend host, deploy the updated backend and website together, and rebuild the mobile app with the correct public API URL. Existing users must sign out and sign in again to receive a server session before sending invitations.

**Render Free blocks outbound ports 25, 465, and 587**, so direct Gmail SMTP cannot work there. The supplied Render blueprints now specify the paid `starter` plan. Reviewing these files does not upgrade or deploy any service. Alternatively use a backend host that permits outbound SMTP on port 465. See https://render.com/docs/free .

Update all applicable Vercel `/api` rewrite destinations if the backend hostname changes. This workspace does not contain the separate `/collaborators` page from the reported production screenshot; deploy this source or apply the same API contract to that separate frontend.

## Existing data

MongoDB is now required. There is no silent fallback to Sheets or a local JSON file, and old data is not automatically copied.

Before switching production, back up/export the old database as JSON with `users`, `cashbooks`, and `collaborators` arrays. Then run from `website/backend`:

```sh
node import-json.js /path/to/export.json
```

This refuses to overwrite a nonempty MongoDB state. It preserves IDs, hashes legacy passwords, normalizes email addresses, and discards old OTPs. Google-only users continue through verified Google sign-in on the website. Set `GOOGLE_CLIENT_ID` to the same OAuth client ID as the frontend.

The existing cashbook document structure is kept in a versioned MongoDB state document; stale writes return HTTP 409 rather than overwriting another update. Invitations, sessions, and mail counters use separate collections. The state document is subject to MongoDB's 16 MB document limit.

## Invitation flow

1. Sign in as the cashbook owner and open its detail screen.
2. Enter the collaborator's complete email, such as `renudinesh09@gmail.com`, and select **Send invitation & OTP**. `renudinesh09@gmailcom` is rejected; addresses are never silently corrected to a different mailbox.
3. Gmail receives a request addressed only to that recipient. The message includes the cashbook name and a cryptographically generated six-digit code. Success means Gmail accepted the message; inbox placement and final delivery still depend on Gmail. Check Spam if needed.
4. The collaborator provides the code to the owner to confirm access in the existing owner-managed form. This is not a standalone recipient acceptance-link flow.
5. A code expires after ten minutes, allows five verification attempts, and can be used once for its exact email/cashbook/invitation. Resend is limited to once per minute, with ten requests per sender and recipient per hour. Resending invalidates the previous invitation.

Missing SMTP credentials, rejected recipients, and send errors return actual errors. No OTP is returned by the API or printed to logs. MongoDB stores only an HMAC of the code. Pending and failed invitations do not grant access. Only an authenticated owner can request or verify invitations.

### API contract

- `POST /api/otp/request` with a bearer session token and `{ email, cashbookId }` returns `{ sent: true, email, invitationId, expiresIn: 600, retryAfter: 60 }` after SMTP acceptance.
- `POST /api/cashbooks/:id/collaborators` with the same owner's bearer token and `{ collaboratorEmail, invitationId, otp, accountNumber, ifsc }` verifies and activates access.
- Session tokens are issued by signup/login and verified Google sign-in. The old identity-only Google login payload is no longer accepted.

### OTP autofill

Both clients mark the input as `one-time-code` and allow manual typing/pasting. Only the operating system/browser can offer a code suggestion based on its supported mail integration and settings. Neither client fetches the code from the backend, reads an inbox, or shows a fabricated autofill button.

There is no cross-platform API for checking whether a particular Gmail account is installed on a phone, and this app cannot enforce an email-account condition on the keyboard's suggestion UI. Having Gmail installed does not guarantee email-code autofill. Every entered/suggested code is still checked against the intended recipient and invitation on the server.

References: https://reactnative.dev/docs/textinput and https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete .

## Mobile setup

See `app/README.md`. The old hardcoded Google identity/demo login was removed. Mobile users can use real email/password signup and login. Adding a native Google OAuth flow requires platform OAuth client configuration; the old button was not a working OAuth integration.

## Validation

Run `npm test` in `website/backend`. The suite uses a temporary real MongoDB server and a fake SMTP transport; the first run downloads the MongoDB test binary. It covers delivery failures, malformed recipients, expiry, attempts, concurrency, resend invalidation, session ownership, and end-to-end API access after verification. No real email is sent by tests.

Real inbox delivery and device-specific autofill require a configured Gmail account, a reachable MongoDB instance, an SMTP-capable host, and a physical device. Existing non-invitation cashbook/admin endpoints retain their previous access model; this change is not a complete authorization audit of the application.
