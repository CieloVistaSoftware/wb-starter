# OTP Behavior

`x-otp` replaces the element's content with `length` single-digit boxes for a one-time code: typing moves to the next box, and non-digits are rejected.

## Usage

<div x-demo>
<div x-otp length="6"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `length` | `integer` | `0` | Number of OTP digits |

<sub>Schema: [`otp.schema.json`](../../src/wb-models/otp.schema.json)</sub>
