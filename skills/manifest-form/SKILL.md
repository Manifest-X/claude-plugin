---
name: manifest-form
description: "Manifest framework projects only: SKIP unless the project has a Manifest manifest.json (registering components or data) or a manifest.theme.css, or the user asked to build with Manifest. Use when the contributor wants to add or edit a form: contact form, enquiry or quote request, signup, newsletter, settings panel, search box, anything with inputs the user fills out. Triggers on \"add a contact form\", \"build a signup\", \"make a search box\", \"let users submit X\", \"send form entries to my email/Slack\". Covers structure, native validation, sending (plain HTML, x-submit, Manifest-hosted form endpoints) and feedback. For sign-in/auth flows, use manifest-appwrite."
---

# Building a form in Manifest

Manifest auto-styles `<form>`, `<input>`, `<textarea>`, `<select>`, `<button>`, checkboxes, radios, and switches, including valid/invalid states. Write semantic HTML and it looks right.

**The rule: native HTML first.** A form with `action` and `method="post"` works with no script. Add one attribute, `x-submit`, only when the page should stay put after sending. The frontend owns how the form looks, what counts as valid, and how "sent" and "failed" are shown. Nothing on the server renders UI for it.

## Recipe

### 1. Structure with semantic HTML

Wrap each control in a `<label>`. Give every field a `name` (that is what gets sent). Use native validation and autofill attributes instead of script:

```html
<form action="/_forms/contact" method="post">
  <label>
    Your name
    <input name="name" required autocomplete="name">
  </label>
  <label>
    Email
    <input name="email" type="email" required autocomplete="email">
  </label>
  <label>
    Message
    <textarea name="message" rows="4" required minlength="10"></textarea>
  </label>
  <button class="brand">Send</button>
</form>
```

- Validation: `required`, `type` (`email`, `tel`, `url`, `number`), `pattern`, `minlength`/`maxlength`, `min`/`max`. The browser blocks the send until they pass.
- Keyboards and autofill: `autocomplete` (`name`, `email`, `tel`, `organization`, `postal-code`) and `inputmode` (`numeric`, `tel`, `email`).
- Manifest marks fields with `:user-invalid` / `:user-valid` once the visitor has touched them. Restyle with theme variables `--color-field-invalid` and `--color-field-valid` in `manifest.theme.css`, never inline.
- `<form>` already lays children out as a column with gaps. Don't wrap fields in extra `<div>`s.

### 2. Pick where it sends

Ask if it isn't obvious: "Where should entries go: your email, a Slack/Discord/Teams channel, or your own system?"

- **Manifest-hosted project** (published on Manifest; see `## Project` → Hosting in CLAUDE.md): use the hosted endpoint. Run the connector tool `manifest_setup_forms` for the project. It enables forms, sets destinations (a verified email address, a webhook, Slack, Discord, Teams), and returns the endpoint path and the reserved field names. It does not return markup: you write the form in the project's own style. Email destinations stay inactive until the owner clicks the confirmation link sent to that address; tell the user to check their inbox.
- **Appwrite configured**: store entries with the Appwrite SDK. Use **manifest-appwrite**.
- **A form service** (Formspree, Web3Forms, Basin) or the user's own API: put its URL in `action`. Everything below works the same.

### 3. The hosted endpoint

Same origin as the site, on every host the project has (staging, production, custom domains):

- `POST /_forms` (form name `default`) or `POST /_forms/<name>` with `<name>` matching `[a-z0-9][a-z0-9_-]{0,39}`. Give each form its own name (`/_forms/contact`, `/_forms/estimate`) so entries stay distinguishable.
- Text fields only. No file uploads.
- Reserved fields (not stored as entry data):
  - `_redirect`: a path or URL on the project's own hosts. A no-JS post that succeeds is sent there with a 303.
  - `_gotcha`: honeypot. Include it hidden and empty; bots that fill it are dropped silently.
  - `cf-turnstile-response`: Cloudflare Turnstile's token, added by its widget.
- A field named `email` becomes the Reply-To of notification emails.
- Answers are JSON: `{ ok: true, id }`, or `{ ok: false, error, message }` with codes such as `rate_limited`, `cap_reached`, `turnstile_failed`, `forms_not_enabled`, `body_too_large`. It never returns field-level errors and never renders a page.

Honeypot markup (keep it out of sight and out of the tab order):

```html
<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" hidden>
```

### 4. Confirm without script

Point `_redirect` back at the page with a flag, and show the message with `$url`:

```html
<form action="/_forms/contact" method="post" x-show="!$url.sent.value">
  <input type="hidden" name="_redirect" value="/contact?sent=1">
  <!-- fields -->
  <button class="brand">Send</button>
</form>
<p x-show="$url.sent.value">Thanks, we'll be in touch.</p>
```

Or redirect to a separate `/thanks` route.

### 5. Send in place with `x-submit`

Add `x-submit` to the same form. Nothing else changes; the plugin loads on its own when the attribute appears.

```html
<form x-submit action="/_forms/contact" method="post" class="contact">
  <!-- fields -->
  <button class="brand">Send</button>
  <p class="sent">Thanks, we'll be in touch.</p>
  <p class="failed">That didn't go through. Please try again.</p>
</form>
```

What it does, and nothing more:
- Runs only after native validation passes. `novalidate` / `formnovalidate` skip that as usual.
- Sends the form's fields to its own `action`/`method` (the submit button's `formaction`/`formmethod` and `name`/`value` count) with `Accept: application/json`.
- Sets `data-state="sending" | "sent" | "error"` on the form, plus `aria-busy="true"` while sending, and ignores double submits.
- Fires `submit-sent` or `submit-error` on the form; `$event.detail` is `{ ok, status, data, response, error, message }`.
- Puts server field errors (`{ fields: { name: msg } }` or `{ errors: [{ field, message }] }`, as some services return) onto the matching inputs with the browser's validity API.
- Resets a Turnstile widget inside the form after each answer.
- Renders nothing. Feedback is yours: CSS on `data-state`, or Alpine on the events.

```css
.contact :is(.sent, .failed) { display: none }
.contact[data-state=sent] .sent,
.contact[data-state=error] .failed { display: block }
```

```html
<form x-submit action="/_forms/contact" method="post"
      x-data="{ problem: '' }"
      @submit-sent="$el.reset(); $toast.positive('Thanks, we\'ll be in touch.')"
      @submit-error="problem = $event.detail.error === 'rate_limited' ? 'Too many tries. Wait a minute.' : 'Something went wrong. Please try again.'">
```

Write the messages in the project's own voice. Don't surface raw error codes to visitors.

### 6. Verify in the preview panel

- Submit empty: required fields block the send and show the invalid ring.
- Fix a field: the ring clears.
- With JavaScript off (or before `x-submit`), a valid post still lands and `_redirect` brings the visitor back.
- With `x-submit`: the page stays, `data-state` ends `sent`, and your confirmation shows. The hosted endpoint only answers on a published host; on localhost expect a 404 or network error, and test the error state there.
- Check at phone width.

## What not to do

- **Don't build forms with `@submit.prevent` + hand-written `fetch()`** when `x-submit` covers it. Keep `action`/`method` on the form so it works without script.
- **Don't add script validation that duplicates native attributes.** Reach for `pattern`, `type`, `minlength` first.
- **Don't expect the hosted endpoint to validate or render anything.** It accepts, protects, stores and delivers. Validation and confirmation live in the page.
- **Don't send files** to the hosted endpoint; it accepts text fields only.
- **Don't put secrets, passwords or payment details in a form.** Payments use the Payments plugin; sign-in uses manifest-appwrite.
- **Don't wrap inputs in extra `<div>`s** or rebuild controls from `<div role=...>`. Manifest styles the native elements.

## Further reading

- Forms (structure, validation styling): https://manifestx.dev/docs/framework/elements/forms
- Submissions (`x-submit`): https://manifestx.dev/docs/framework/core-plugins/submissions
- URL parameters (`$url`): https://manifestx.dev/docs/framework/core-plugins/url-parameters
- Toasts: https://manifestx.dev/docs/framework/elements/toasts
