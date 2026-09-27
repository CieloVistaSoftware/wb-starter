# x-enhancements (x-form, x-password, x-tags, x-file)

[src/wb-viewmodels/enhancements.js](../../src/wb-viewmodels/enhancements.js) holds the form-control behaviors. Each has its own page:

- [form](form.md) — validation on submit, and `ajax` submission with `fetch`.
- [password](password.md) — a show/hide button and an optional strength meter.
- [tags](tags.md) — type and press Enter to build a list of removable tags.
- [file](file.md) — a styled file picker.
- [otp](otp.md), [stepper](stepper.md), [error](error.md) and [help](help.md) live in the same file.

The shared attributes are listed in [x-enhancements.schema.json](../../src/wb-models/x-enhancements.schema.json).
