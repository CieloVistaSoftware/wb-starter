# WB Pro: How Only Paying Customers Get It

**Status:** proposal, waiting on two decisions from John (end of this doc).
**Issue:** #1953 (monetize WB: MIT core + commercial WB Pro).
**Written:** 2026-11-01, US Central.

---

## 1. The short answer

We control who can **download** WB Pro. We can't fully control who **uses** it
once they have it.

WB Pro runs in the visitor's browser. Once a customer puts it on a live site,
anyone who opens that site's page receives the Pro files. Every client-side
JavaScript product works this way, including Tailwind Plus and Flowbite Pro.

So the plan has three layers:

| Layer | What it controls | How strong |
|---|---|---|
| 1. Paid download | Who gets the files at all | Strong: no payment, no files |
| 2. Updates | Who gets new versions | Strong: the key expires after a year |
| 3. The license | What a buyer may do with the files | Legal: a claim and takedowns, not a technical block |

---

## 2. How WB Pro is split from the free core

This is already built (wb-starter PR #1954, and the `wb-pro` branch
`claude/elegant-babbage-lylhzl`).

- **Free core (wb-starter, MIT):** public. Has `registerBehaviorPack()`, which
  lets an outside pack add behaviors. A pack can't replace a core behavior.
- **WB Pro (`CieloVistaSoftware/wb-pro`, private, commercial license):**
  - 11 showpiece effects: confetti, fireworks, particle, snow, sparkle, rainbow,
    typewriter, countup, parallax, marquee, stagelight.
  - 6 advanced inputs: autocomplete, tags, masked, otp, colorpicker, validator.
- A site loads the core, then the pack:

```html
<script type="importmap">{ "imports": { "wb-starter/": "/src/" } }</script>
<script type="module" src="/src/core/wb.js"></script>
<script type="module" src="/wb-pro/src/index.js"></script>
```

Without the pack, Pro attributes such as `x-confetti` do nothing, and the rest of
the page works normally.

---

## 3. Layer 1: paid download (the real gate)

1. A customer buys through **Lemon Squeezy** (step 5 of #1953).
2. Lemon Squeezy issues a **license key**: Personal (1 seat) or Team (10 seats).
3. The key unlocks the files. There are three ways to deliver them:

| Delivery | How the customer gets Pro | For | Against |
|---|---|---|---|
| **Private npm package** (recommended) | `npm install @cielovista/wb-pro`, with the key as the access token | Professional; updates are one command | Needs a private registry set up |
| **Download link** (fallback) | A zip file per release from Lemon Squeezy | Simplest; no npm needed | Updates are manual |
| **GitHub invite** | Added to the private `wb-pro` repo | Fine for Team customers | GitHub accounts to manage by hand |

**Recommendation:** npm first, with the Lemon Squeezy download for people who
don't use npm.

---

## 4. Layer 2: updates (the reason to renew)

- A license includes **1 year of updates** (from the #1953 pricing).
- When the key expires, new versions stop downloading. The customer **keeps**
  every version they already have.
- Renewing restores updates. Keeping up with new behaviors and fixes is the
  ongoing reason to pay.

---

## 5. Layer 3: the license (the legal backstop)

- The WB Pro license (`docs/legal/WB-PRO-EULA.md` in PR #1954) forbids sharing or
  reselling the source.
- If Pro shows up publicly, the license gives a legal claim and the basis for
  takedown requests (for example to GitHub or npm).
- **The license is a draft.** It is not in force until a lawyer reviews it.

---

## 6. What we are deliberately not doing

| Not doing | Why |
|---|---|
| A license check in the browser ("phone home") | Anyone can delete it from the JavaScript. If our server is down, paying customers' sites break. |
| Locking Pro to the customer's domain | Same: easy to remove, and it gets in the way of honest buyers (staging sites, localhost, client handovers). |
| Obfuscating the code | It only slows people down briefly, and it makes support and debugging harder. |

The people who would strip a license check were never going to pay. The checks
would mostly hurt the customers who do.

---

## 7. What has to be built

| Step | Work | Depends on |
|---|---|---|
| A | Merge PR #1954 (core becomes MIT), then merge wb-pro's branch to its `main` | John's licensing decision |
| B | Waitlist page on the live site (step 4 of #1953) | A |
| C | Lemon Squeezy products: Personal, Team, templates | ~20 waitlist sign-ups |
| D | Key-gated delivery: private npm package plus a download fallback | C |
| E | A release step in wb-pro that publishes each version to the delivery channels | D |
| F | Lawyer review of the WB Pro license | before C goes live |

---

## 8. Decisions for John

1. **Delivery:** private npm package, download link, GitHub invite, or a mix?
   Recommended: npm, with the download as the fallback.
2. **Order:** keep #1953's plan of waitlist first, then checkout at about 20
   sign-ups?
