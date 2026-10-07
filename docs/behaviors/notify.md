# Notify

`x-notify` makes the element pop a toast notification on each click. The first click shows `message` as an info toast; later clicks cycle through success, warning and error toasts with stock text, so it is mainly a demonstration trigger.

## Usage

<div x-demo>
<button x-notify message="Deploy finished — staging is live.">Show notification</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `message` | text | `Notification` | Text of the notification. Defaults to `Notification`. |
| `duration` | milliseconds | `3000` | How long the notification stays up, in milliseconds. Defaults to `3000`. |

## Events

- `wb:notify:show` — A toast was shown; `detail` has its `message` and `variant`.

<sub>Schema: [`notify.schema.json`](../../src/wb-models/notify.schema.json)</sub>
