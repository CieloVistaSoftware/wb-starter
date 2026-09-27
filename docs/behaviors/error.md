# Error Behavior

`x-error` marks an element as an error message: it adds the `x-error` class and `role="alert"`, so assistive technology announces the text as soon as it appears. Put it on the message next to the form field it describes. It ships no styling of its own; for a visible coloured box use `x-alert variant="error"`.

## Usage

<div x-demo>
<label>Email <input type="email" value="ada@"></label>
<div x-error>Enter a full address, like ada@example.com.</div>
</div>

<sub>Schema: [`error.schema.json`](../../src/wb-models/error.schema.json)</sub>
