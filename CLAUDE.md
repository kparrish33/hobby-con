# HobbyCon — event card procedures

Reference for adding and retiring event cards. The site is finished and correct as-is.

---

## HARD RULES — read before every task

1. **Do not refactor, restyle, tidy, or "improve" anything.** Not the CSS, not the HTML, not the indentation, not the inconsistencies. The inconsistencies listed in this file are intentional or accepted. Leave them.
2. **Do not touch existing cards** except to move a card between sections exactly as described under *Retiring an event*.
3. **`index.html` holds exactly 3 event cards. Never 2, never 4.** `.event-grid` is `grid-template-columns: repeat(3, 1fr)` (style.css:557) and the dot count is hardcoded — a 4th card breaks the layout and the mobile carousel. Adding to index.html always means *replacing* one.
4. **Never reformat a file.** No prettier, no reindenting, no collapsing multi-line class attributes. Diffs should contain only the cards being added or moved.
5. **Match the surrounding whitespace,** including the irregular leading spaces on the `<!-- Featured: ... -->` comments in events.html. They vary card to card. Copy the neighbour.
6. **Do not touch** `style.css`, `js/main.js`, `.cpanel.yml`, `.htaccess`, `api/`.
7. When anything is ambiguous, ask. Do not infer event details, times, locations, or URLs.

---

## What an event needs before any editing starts

| Field | Example | Used in |
|---|---|---|
| Title | `FREE Mahjong Club` | all 4 shapes |
| Time | `6:30PM` | badge |
| Date | `July 30` / `July 30th` | badge — see suffix note below |
| Location | `Brookfield Place • Hudson Eats` | events.html, blurbs |
| What to expect | `Lessons + Open Play • American Style` | events.html only |
| Short blurb subject | `Mahjong Meetup` | all blurbs |
| Eventbrite URL | full URL including `?aff=oddtdtcreator` | all 4 shapes, twice each in B/C/D |
| Flyer filename | `jul26mahj.webp` | must already exist in `/images` |

If any field is missing, ask for it. Do not invent one.

### Flyer files

Flyers live in `/images`. Existing naming is inconsistent (`jul26mahj.webp`, `Aug26Craft.webp`, `Jun26Zumba.webp`, `YOGAflyer1.png`) — do not rename existing files. For new ones use lowercase `mmmYYkeyword.webp`, e.g. `sep26chess.webp`. Confirm the file exists before referencing it; a broken `src` is silent on the page.

`alt` text is always `{{Title without FREE}} Flyer`, e.g. `alt="Mahjong Club Flyer"`.

### Date suffix inconsistency — preserve it

- **events.html** badges use an ordinal suffix: `6:30PM • July 30th`
- **index.html** and **tickets.html** badges do not: `6:30PM • July 30`

This is not a bug to fix. Match the page you are editing.

### Character entities

events.html past cards use `&bull;` `&rsquo;` `&amp;`; newer upcoming cards use literal `•` `'` `&`. Both render fine. Match the nearest neighbouring card in the same section.

---

## Adding a new event — do all four in this order

### 1. `events.html` — upcoming card

Insert at the **top** of the grid opened at line ~213:

```html
<div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 items-stretch">
```

Template:

```html
   <!-- Featured: {{NAME}} -->
  <div class="hc-card bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-7">
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <div class="text-sm text-slate-500">Featured Experience</div>
        <div class="mt-1 text-xl font-bold text-slate-900">
         {{TITLE}}
        </div>
      </div>

      <div
        class="shrink-0 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold"
      >
        {{TIME}} • {{MONTH}} {{DAY_ORDINAL}}
      </div>
    </div>

    <p class="mt-4 text-sm text-slate-600 leading-relaxed">
      We're hosting a <span class="font-semibold">{{BLURB_SUBJECT}}</span> in NYC!
    </p>

    <a
      href="{{EVENTBRITE_URL}}"
      target="_blank"
      class="mt-5 block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 hover:shadow-lg transition-shadow"
    >
      <img
        src="images/{{FLYER}}"
        alt="{{ALT}}"
        class="w-full h-auto object-cover"
        loading="lazy"
      />
    </a>

    <div class="mt-6 grid gap-3">
      <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4">
        <div class="text-xs text-slate-500">LOCATION</div>
        <div class="mt-1 font-semibold text-slate-800">{{LOCATION}}</div>
      </div>

      <div class="rounded-2xl bg-slate-50 border border-slate-200 p-4">
        <div class="text-xs text-slate-500">WHAT TO EXPECT</div>
        <div class="mt-1 font-semibold text-slate-800">
          {{WHAT_TO_EXPECT}}
        </div>
      </div>
    </div>

    <a
      href="{{EVENTBRITE_URL}}"
      class="mt-6 w-full inline-flex items-center justify-center gap-2
             rounded-full px-6 py-3 font-semibold whitespace-nowrap
             border-2 border-purple-400 text-purple-700
             transition-all duration-300
             hover:bg-purple-500 hover:text-white hover:border-purple-500
             hover:shadow-lg"
    >
      Sign Up Free <i data-feather="arrow-right" class="w-4 h-4"></i>
    </a>
  </div>
```

Indent the whole block to match its neighbours (10 spaces on the `<div class="hc-card ...">` line).

### 2. `tickets.html` — ticket card

Insert at the **top** of the grid at line ~188 (`<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">`), inside `<section id="upcoming-events">`.

```html
<!-- Event: {{NAME}} ({{MONTH}} {{DAY}}) -->
<div class="hc-card bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
  <a href="{{EVENTBRITE_URL}}" target="_blank" class="block bg-slate-50 border-b border-slate-200">
    <img src="images/{{FLYER}}" alt="{{ALT}}" class="w-full aspect-[4/5] object-cover" loading="lazy" />
  </a>
  <div class="p-6 md:p-7">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="text-sm text-slate-500">Featured Experience</div>
        <div class="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold whitespace-nowrap">{{TIME}} • {{MONTH}} {{DAY}}</div>
      </div>
      <h3 class="text-xl font-bold text-slate-900">{{TITLE}}</h3>
    </div>
    <p class="mt-4 text-sm text-slate-600 leading-relaxed">{{BLURB_SUBJECT}} hosted at {{LOCATION}}!</p>
    <a href="{{EVENTBRITE_URL}}" class="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold whitespace-nowrap border-2 border-purple-400 text-purple-700 transition-all duration-300 hover:bg-purple-500 hover:text-white hover:border-purple-500 hover:shadow-lg">
      Sign Up Free <i data-feather="arrow-right" class="w-4 h-4"></i>
    </a>
  </div>
</div>
```

No indentation — these cards sit flush at column 0. Match that.

### 3. `index.html` — swap, never append

Still exactly 3 cards. **Ask which of the 3 to replace** unless told. Default suggestion: the one whose date is soonest-past. Replace only the contents of that one `<a>` block, in `.event-grid` at line ~259. Leave the three `<button class="event-dot">` elements at line ~315 completely alone — count does not change.

```html
    <a href="{{EVENTBRITE_URL}}"
      target="_blank" rel="noopener"
      class="hc-card bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden block">
      <img src="images/{{FLYER}}" alt="{{ALT}}" class="w-full aspect-[4/5] object-cover" loading="lazy" />
      <div class="p-6">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="text-sm text-slate-500">Featured Experience</div>
          <div class="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold whitespace-nowrap">{{TIME}} • {{MONTH}} {{DAY}}</div>
        </div>
        <h3 class="mt-2 text-xl font-bold text-slate-900">{{TITLE}}</h3>
        <p class="mt-3 text-sm text-slate-600">{{BLURB_SUBJECT}} hosted at {{LOCATION}}!</p>
        <div class="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold border-2 border-purple-400 text-purple-700">
          Sign Up Free <i data-feather="arrow-right" class="w-4 h-4"></i>
        </div>
      </div>
    </a>
```

Note: the CTA here is a `<div>`, not an `<a>` — the whole card is already the link. Do not change it to an `<a>`.

### 4. Report back

List the files changed and the exact card that was displaced from index.html, so it can be confirmed before pushing.

---

## Retiring an event

### `events.html` — move to Previous Events

1. Cut the card from the upcoming grid.
2. Add `past-event` to its class list, immediately after `hc-card`:
   `class="hc-card past-event bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-7"`
3. Paste it into the Previous Events grid (line ~695, `<div class="grid gap-6 md:grid-cols-2 items-start">`), at the **top**, below the `<!-- paste your hc-card divs here -->` comment.
4. Change nothing else inside the card. Keep the Eventbrite links — `.past-event` sets `pointer-events: none` (style.css:614) so they are already unclickable.

Newest past event goes first.

### `tickets.html` and `index.html` — delete

Remove the card outright, including its `<!-- Event: ... -->` comment. index.html must be back to exactly 3 cards afterwards — so its retirement and its replacement happen in the same edit.

---

## Verify before committing

- `events.html` upcoming grid: card count is even, or the last row will look lopsided at `sm:grid-cols-2`.
- `index.html`: exactly 3 `<a class="hc-card ...">` inside `.event-grid`, exactly 3 `.event-dot` buttons.
- Every `images/...` path referenced actually exists.
- Every Eventbrite URL appears twice per card in shapes B, C, D — image link and CTA — and both are identical.
- `git diff` contains only added/moved cards. Any change to `style.css`, `js/main.js`, or unrelated markup means something went wrong — revert it.

Quick check:

```bash
grep -c 'hc-card bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden block' index.html   # must be 3
grep -c '<button class="event-dot' index.html                                                              # must be 3
```

---

## Deploy

Unchanged and manual: GitHub Desktop push → cPanel → Git Version Control → Update from Remote → Deploy HEAD Commit. `.cpanel.yml` copies the repo root to `public_html`. Do not modify it.
