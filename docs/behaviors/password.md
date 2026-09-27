# Password Behavior

`x-password` wraps a password `<input>` with a show/hide button, and with `strength` adds a meter that rates the password as it is typed.

## Usage

<div x-demo>
<input type="password" x-password strength placeholder="Choose a password">
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `toggle` | `boolean` | `false` | Show/hide password toggle |
| `strength` | `boolean` | `false` | Show password strength meter |

<sub>Schema: [`password.schema.json`](../../src/wb-models/password.schema.json)</sub>
