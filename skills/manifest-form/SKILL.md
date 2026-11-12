---
name: manifest-form
description: "Manifest framework projects only: SKIP unless the project has a Manifest manifest.json (registering components or data) or a manifest.theme.css, or the user asked to build with Manifest. Use when the contributor wants to add or edit a form or form control: contact form, signup, settings panel, search box, filter bar, any inputs, selects, checkboxes, switches or buttons the user fills out. Triggers on \"add a contact form\", \"build a signup\", \"make a search box\", \"add a settings panel\", \"let users submit X\". Manifest CSS styles native form HTML; covers markup, layout, utilities, validation styling and, only for forms that send entries somewhere, where they send (x-submit, Manifest-hosted forms). For sign-in/auth flows, use manifest-appwrite. SKIP for a lone button that isn't part of a form."
---

# Building a form in Manifest

Manifest CSS styles native form elements: `<form>`, `<label>`, `<fieldset>`, `<legend>`, `<input>`, `<textarea>`, `<select>`, `<button>`, checkboxes, radios and switches. Write semantic HTML with the right nesting and utility classes. No component library, no wrapper `<div>`s, no custom CSS for the basics.

## Recipe

### 1. Structure with labels

`<form>` lays its children out as a column with gaps. Put each control inside its `<label>`; label text can be bare or in a `<span>`:

```html
<form>
  <label>
    Name
    <input name="name" required autocomplete="name">
  </label>
  <label>
    Message
    <textarea name="message" rows="4"></textarea>
  </label>
  <label>
    Plan
    <select name="plan">
      <option>Free</option>
      <option>Pro</option>
    </select>
  </label>
  <button class="brand">Save</button>
</form>
```

- **Inline label:** put the label text in `<data>` to sit it beside the control instead of above: `<label><data>Email</data><input type="email"></label>`.
- **Switch:** `<label><input type="checkbox" role="switch"> Notifications</label>`.
- **Checkbox and radio sets:** group them in a `<fieldset>`; add a `<legend>` for a bordered box with a title. Radios sharing a `name` are one choice.
- **Search and file inputs** work bare. To add an icon, wrap the field and icon in an inner label, and keep any text label outside it, both in a `<fieldset>`: `<fieldset><label for="q">Search</label><label><i x-icon="lucide:search"></i><input id="q" type="search"></label></fieldset>`. Inside an inline (`<data>`) label, use `<div class="label">` as the inner wrapper instead of nesting labels.
- **Copy field:** `<label><input value="…" aria-label="Code"><button command="--copy" aria-label="Copy"></button></label>` copies the value with no wiring.
- **Textarea height:** `class="field-sizing-content"` grows with the text; `class="resize"` adds a drag handle.

### 2. Utilities

Buttons, inputs, selects, textareas, checkboxes, radios and switches take the same stackable classes:

- Color: `brand`, `accent`, `positive`, `negative`
- Size: `sm`, `lg`
- Appearance: `ghost`, `outlined`, `transparent`; `hug` on buttons and selects. Checkboxes, radios and switches take `outlined` only.

### 3. Rows and toolbars

- `role="group"` on a wrapper joins buttons, inputs and selects into one flush row with shared borders: `<div role="group"><input placeholder="Email"><button class="brand">Sign up</button></div>`. Add `even` for equal widths. Button utilities (`sm`, `outlined`, ...) on the wrapper style the whole row.
- `role="tablist"` on a wrapper makes a segmented tab bar; mark the active button with `selected` or `aria-selected="true"`.

### 4. Bind state with Alpine

For forms that drive the page (filters, settings, search), bind values with `x-model`:

```html
<form x-data="{ q: '', sort: 'new' }" @submit.prevent>
  <div role="group">
    <input type="search" x-model="q" placeholder="Filter" aria-label="Filter">
    <select x-model="sort" aria-label="Sort">
      <option value="new">Newest</option>
      <option value="old">Oldest</option>
    </select>
  </div>
</form>
```

For searching a data source, see https://manifestx.dev/docs/framework/core-plugins/local-data#search-query (and the **manifest-data** skill).

### 5. Validate natively

Use `required`, `type` (`email`, `tel`, `url`, `number`), `pattern`, `minlength`/`maxlength`, `min`/`max`, plus `autocomplete` and `inputmode` for autofill and keyboards. The browser blocks submission until they pass.

Manifest rings a field in the negative color once the visitor has touched it or tried to submit (`:user-invalid`). Valid fields stay unmarked unless the theme sets `--color-field-valid`. Change colors in `manifest.theme.css` with `--color-field-invalid` / `--color-field-valid`, never inline; `unstyle` on a field opts out. For more, use variants such as `user-invalid:negative` on a field. Don't disable the submit button while the form is invalid: the visitor then never gets the browser's messages or the ring.

### 6. Only if the form sends entries somewhere

A contact, signup or quote form sends; a search, filter or settings form usually doesn't. Every field that should be sent needs a `name`. Pick the backend by what the form is for, asking if it isn't clear. Manifest has first-party options for each:

- **Sign-in or account forms** → the **Auth** plugin (Appwrite). `$auth` handles magic links, email or phone codes, OAuth and guest sessions; there is no separate sign-up form, since a new visitor gets an account on first sign-in. Use **manifest-appwrite**. Docs: https://manifestx.dev/docs/framework/appwrite-plugins/users
- **Entries the app reads back** (comments, orders, profiles, a list users add to) → the **Cloud Data** plugin (Appwrite). A registered table's `$x.<table>.$create({ ... })` writes a row, scoped to the user or team when configured; file inputs upload to a storage bucket with `$x.<bucket>.$create(file)`. Bind the fields with `x-model` and call it on submit. The table needs Create permission in Appwrite, or `$create()` fails. Use **manifest-appwrite**. Docs: https://manifestx.dev/docs/framework/appwrite-plugins/databases and https://manifestx.dev/docs/framework/appwrite-plugins/storage
- **Messages someone should receive** (contact, enquiry, quote) on a Manifest-hosted project (published or to be published on Manifest; see Hosting in the Manifest project block in `CLAUDE.md`) → Manifest's hosted forms. Use the connector tool `manifest_setup_forms` to set them up (the project owner or an admin can). Follow its message: it gives the endpoint, the reserved fields and the next step. The endpoint accepts text fields only, no file uploads. Docs: https://manifestx.dev/docs/framework/core-plugins/submissions
- **A form service or the user's own API** → put its URL in the form's `action`.

The last two post to an endpoint URL. For those, keep `action` and `method="post"` on the form so it works without script. To stay on the page after sending, add `x-submit` (Submissions plugin, loads on first use). It sends only once native validation passes, sets `data-state="sending" | "sent" | "error"` on the form and fires `submit:sent` / `submit:error`. It renders nothing and doesn't clear the fields, so write the messages yourself and reset in the handler:

```html
<form x-submit action="…" method="post" class="contact" x-data @submit:sent="$el.reset()">
  <!-- fields -->
  <button class="brand">Send</button>
  <p class="sent">Thanks, we'll be in touch.</p>
  <p class="failed">That didn't go through. Please try again.</p>
</form>
```

```css
.contact :is(.sent, .failed) { display: none }
.contact[data-state=sent] .sent,
.contact[data-state=error] .failed { display: block }
```

Write messages in the project's voice; never show raw error codes to visitors.

### 7. Verify in the preview panel

- Tab through fields: focus rings visible, order sensible.
- Submit empty: required fields block and show the invalid ring.
- Check light and dark themes and phone width.
- A form that sends: test the error path locally; the hosted endpoint only answers on a published host.

## What not to do

- **Don't wrap controls in extra `<div>`s** for spacing or styling. `<label>` nesting, `<fieldset>` and `role="group"` are what Manifest's CSS targets.
- **Don't rebuild controls** from `<div role="checkbox">` or custom dropdowns. Use the native element and its utilities.
- **Don't write custom CSS** for colors, sizes or borders that a utility class or theme variable covers.
- **Don't duplicate native validation in script.** Reach for `type`, `pattern` and `minlength` first.
- **Don't hand-write `fetch()`** with `@submit.prevent` to send a form when `x-submit` or a Cloud Data `$create` covers it.
- **Don't put passwords or payment details in a form you build.** Sign-in uses manifest-appwrite; payments use the Payments plugin.

## Further reading

- Forms (layout, inline labels, groups, validation): https://manifestx.dev/docs/framework/elements/forms
- Inputs: https://manifestx.dev/docs/framework/elements/inputs
- Buttons: https://manifestx.dev/docs/framework/elements/buttons
- Selects: https://manifestx.dev/docs/framework/elements/selects
- Textareas: https://manifestx.dev/docs/framework/elements/textareas
- Checkboxes: https://manifestx.dev/docs/framework/elements/checkboxes
- Radios: https://manifestx.dev/docs/framework/elements/radios
- Switches: https://manifestx.dev/docs/framework/elements/switches
- Comboboxes: https://manifestx.dev/docs/framework/elements/comboboxes
- Date pickers: https://manifestx.dev/docs/framework/elements/date-pickers
- Color pickers: https://manifestx.dev/docs/framework/elements/color-pickers
- Ranges: https://manifestx.dev/docs/framework/elements/ranges
- Submissions (`x-submit`, no-JS confirmation, hosted forms): https://manifestx.dev/docs/framework/core-plugins/submissions
- Auth: https://manifestx.dev/docs/framework/appwrite-plugins/auth
- Cloud Data: https://manifestx.dev/docs/framework/appwrite-plugins/cloud-data
