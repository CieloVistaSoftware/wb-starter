# x-enhancements (x-form, x-password, x-file)

[src/wb-viewmodels/enhancements.js](../../src/wb-viewmodels/enhancements.js) holds the form-control behaviors. Each has its own page:

- [form](form.md) — validation on submit, and `ajax` submission with `fetch`.
- [password](password.md) — a show/hide button and an optional strength meter.
- [file](file.md) — a styled file picker.
- [stepper](stepper.md), [error](error.md) and [help](help.md) live in the same file.

Tags, otp, masked, colorpicker, autocomplete and validator are WB Pro
behaviors (#1953); their pages live in the wb-pro pack.

The shared attributes are listed in [x-enhancements.schema.json](../../src/wb-models/x-enhancements.schema.json).
