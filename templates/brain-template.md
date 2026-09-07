# brain.md structure

This is the structure `client-brain` produces for every client at
`clients/<slug>/brain.md`. Every other skill reads from this file — it's the
single source of client substance. Nothing in it is invented; every line
traces back to something the client or the agency owner actually said in the
interview, a call, a DM, or a document the client provided.

```markdown
# <Client Name> — Brain

Last updated: <date>
Interviewed by: <name>
Sources: <interview date> · <any transcripts/docs folded in>

## The business
- What they do, in plain language
- Who they serve (the actual customer, not a demographic bucket)
- How they make money / what the offer actually is
- Location / service area if relevant
- Anything credential-worthy: years running it, numbers, results, before/after

## Ideal customer
Superseded by `customer-data-doc`'s output at
`clients/<slug>/sources/customer-data.md` (Drive mirror: `<Client>/05 Assets/
Customer Data`) — don't duplicate pains/dreams/fears/goals/objections here.
Link to it: `See customer-data.md`. This section stays only as a pointer, so
there's one place this actually lives, not two that can drift apart.

## Founder facts
- Origin story — why this business, why this person
- Voice — how the founder actually talks (word choices, energy, what they'd
  never say)
- Non-negotiables — topics/claims that are off-limits or need review every time

## Positioning canvas — three pillars, three formats, three perspectives

Superseded by `positioning-doc`'s output at
`clients/<slug>/sources/positioning.md` (Drive mirror: `<Client>/05 Assets/
Content Ideas`, doc "Positioning & Content Ideas") — the candidates and the
confirmed three of each live there, not here. Link to it: `See
positioning.md`. See `vid-method.md` for how this feeds concept-engine once
confirmed.

## Do / don't
- Do: things that are always fair game
- Don't: things to never say, show, or imply (legal, competitive, personal)

## Open questions
Anything the interview didn't resolve. `concept-engine` and `script-writer`
stop and ask rather than filling these in.
```
