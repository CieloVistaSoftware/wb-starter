# Password Behavior

A password `<input>` gets a show/hide button, and with `strength` a meter that rates the password as it is typed. `type="password"` already says which behavior this is, so there is nothing to add: the runtime applies it to every password input (#1185). Writing `x-password` as well is redundant and the page audits flag it.

## Usage

<div x-demo>
<input type="password" strength placeholder="Choose a password">
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `toggle` | `boolean` | `false` | Show/hide password toggle |
| `strength` | `boolean` | `false` | Show password strength meter |

<sub>Schema: [`password.schema.json`](../../src/wb-models/password.schema.json)</sub>
