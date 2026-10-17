# Ask the Project (npm run ask)

`npm run ask` answers questions about WB-Starter from the project's own files,
on your machine, with no internet. Every answer lists the files it came from,
and when the project doesn't say, it tells you so instead of guessing.

```bash
q how do I add a label to a select?
```

`q` works from any terminal and folder once it is in your PowerShell profile
(below). Inside the project, `npm run q "question"` and
`npm run ask -- "question"` do the same.

It is a search over the project, not a model that memorized it: your question
finds the closest passages in the docs, schemas, code and tests, and a small
local model writes the answer from those passages only.

## What you need (once)

1. **Ollama**, installed and running (the Ollama app, or `ollama serve`).
2. **Two models**, about 2.3 GB together:

```bash
ollama pull nomic-embed-text
```

```bash
ollama pull qwen2.5-coder:3b
```

`nomic-embed-text` turns text into searchable vectors; `qwen2.5-coder:3b`
writes the answers. If `ollama` is "not recognized" right after installing,
restart VS Code: its terminals keep the PATH they started with.

3. **The index**, built from the project's files:

```bash
npm run ask:index
```

4. **The `q` command** (optional, recommended): add this line to your
   PowerShell profile (open it with `notepad $PROFILE`), with the path to
   your own checkout, then open a new terminal:

```bash
function q { node "C:\path\to\your\checkout\scripts\ask.mjs" @args }
```

Quote the question if it contains `|`, `;` or `&`, which PowerShell treats
as commands.

## The commands

| Command | What it does | When to run it |
|---|---|---|
| `npm run ask:index` | Splits every file git tracks into passages and stores a searchable index in `data/ask-index/` | Once, then after pulling or merging changes. Only changed files are redone. |
| `q question` | Answers from the closest passages and lists them as sources | Whenever you want to know something about the project |
| `q --sources words` | Lists the closest passages without asking the model | To see which files cover a topic, instantly |
| `npm run q "question"` or `npm run ask -- "question"` | The same as `q`, from inside the project, without the profile line | When `q` is not set up |

### Reading the ask:index output

```text
[ask:index] 2181 files, 11976 passages: 11947 reused, 29 to embed with nomic-embed-text
[ask:index] embedded 29/29  (about 0s left)
[ask:index] wrote data/ask-index/ (11976 passages, 768 dimensions)
```

- **files / passages**: what is indexed. A passage is about 1,500 characters
  of one file, labelled with its path and nearest heading.
- **reused**: passages from files that did not change since the last run;
  they are not redone.
- **to embed**: passages from new or changed files. The first run embeds all
  of them (about 40 minutes on a laptop CPU); later runs take seconds.
- **768 dimensions**: the size of each passage's vector. Nothing to act on.

## What is indexed

Every file git tracks that is project knowledge: `docs/`, `src/` (code,
schemas, styles), `pages/`, `demos/`, `scripts/`, `tests/`, the CLAUDE.md rules
and `data/behavior-examples.json`. Left out: `archive/`, generated `data/`
files (search and schema indexes, reports), images and anything over 400 KB.

The index stays on your machine (`data/ask-index/` is git-ignored), and no
question or file leaves it.

## Good to know

- **Speed**: an answer takes about 10 to 50 seconds on a laptop CPU. `--sources`
  is instant.
- **Accuracy**: it is as current as the last `npm run ask:index`. After a merge
  that changes docs, rebuild so answers reflect it.
- **Scope**: it answers what the project's files say. It does not change code,
  run tests or open pull requests.
- **Memory**: the answer model uses about 2 GB of RAM while loaded, and Ollama
  frees it after a few idle minutes. Test runs refuse to start below 800 MB free.

## Choosing other models

| Variable | Default | Used for |
|---|---|---|
| `WB_ASK_MODEL` | `qwen2.5-coder:3b` | Writing answers. A larger model (for example `qwen2.5-coder:7b`) answers better and slower. |
| `WB_ASK_EMBED_MODEL` | `nomic-embed-text` | Searching. Changing it needs `npm run ask:index -- --full`. |
| `WB_ASK_PASSAGES` | `8` | How many passages each answer is given |
| `OLLAMA_HOST` | `http://localhost:11434` | Where Ollama runs |

In PowerShell:

```bash
$env:WB_ASK_MODEL = "qwen2.5-coder:7b"; npm run ask -- "what are the Tier 1 laws?"
```

## When something goes wrong

| Message | Fix |
|---|---|
| `Ollama is not running` | Start the Ollama app, or run `ollama serve` |
| `Ollama has no model "..."` | Run the `ollama pull` it names |
| `No index yet. Run: npm run ask:index` | Build the index |
| An answer misses something you know is in the docs | Run `npm run ask:index` (the index may predate the change), or try `--sources` to see what it found |

## How it works

- `scripts/ask-index.mjs`: builds the index.
- `scripts/ask.mjs`: answers a question.
- `scripts/lib/ask-core.mjs`: chunking, ranking and the prompt, tested by
  `tests/regression/ask-chunks-and-ranks.spec.ts`.

Introduced in issue #1926.
