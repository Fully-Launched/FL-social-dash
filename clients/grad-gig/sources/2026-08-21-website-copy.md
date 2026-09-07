# Source: gradgig.co website copy

Fetched: 2026-08-21. Method: the live site is a client-rendered React/Vite
SPA (empty HTML shell, `<div id="root">`), so the rendered page has no text.
The copy below was extracted from the compiled JS bundle
(`assets/index-PmEEZXaZ.js`), which contains the same strings the app
renders — every line below is Grad Gig's own copy, verbatim, not paraphrased.

This is packaging/product copy the client wrote or approved, not raw
customer-voice material — treat it as reliable for facts, mission, and
founder narrative, but it doesn't substitute for actual homeowner/student
quotes (see gap noted at the bottom).

## Founder bio / About (verbatim, full paragraph)

> Our founder, Luke, faced a problem familiar to almost every college
> student: a tight class schedule and an even tighter budget. As a senior at
> Wheaton, he needed to make extra money, but a traditional 9-to-5 or a rigid
> shift schedule just was not compatible with student life. Luke saw that
> local Wheaton families constantly needed help, whether it was moving
> furniture, walking dogs, or tutoring their kids. He also realized that
> students at Christian colleges offer something unique to their local
> communities: trust, character, and hard work. He launched Grad Gig to
> bridge that gap! By connecting Wheaton families with Wheaton students,
> Grad Gig created a win-win economy. What started as a small project
> connecting a few friends to local families has grown into a trusted
> platform with over 500 active users in the Wheaton community. Our goal is
> to become the number one job provider for every Christian college in the
> nation.

## Mission statement (verbatim)

> Grad Gig is a platform to connect families and businesses with Wheaton
> College students for short term gigs. Students are available for gigs like
> babysitting, tutoring, yard work, moving, and more! Our mission is simple:
> Empower Wheaton College students to serve the community through simple
> gigs. By using Grad Gig, you are fostering community while directly
> supporting the financial independence and professional growth of students
> in your area.

## Hero / tagline candidates (verbatim, separate lines in the bundle)

- "Hire a student. Get things done."
- "Connect and Do the Gig"
- "Connecting students and communities."
- "Need help moving a couch? Babysitting for date night? Snow shoveling?
  Grad Gig has you covered." (homeowner-facing)
- "Find gigs and earn money locally." (student-facing)
- "Find well paying gigs in the community." (student-facing)
- "Grad Gig adapts to your schedule and interests." (student-facing)
- "Grad Gig pays higher than any on-campus job and most off-campus ones
  too!" (student-facing)

## How it works (from FAQ/flow copy)

- "Describe what you need and set your rate. Students in the Wheaton area
  will apply."
- "Connect with your student directly to coordinate, they show up and do
  the work, then submit hours and your card is charged automatically.
  You're paying Grad Gig, not your student directly."
- "Once you approve a student, you'll receive their contact information and
  they will get yours."
- "Grad Gig handles all payments securely through Stripe. When a student is
  approved for your gig, we collect your credit card on file. After each
  session, the student submits their hours and your card is charged
  automatically. You only pay for actual hours worked."
- Student side: "Log your hours in the portal when you're done. The
  customer doesn't pay you directly, Grad Gig charges them and pays you. If
  you don't submit your hours, you don't get paid."

## Fees (verbatim)

> Grad Gig charges a service fee on each transaction. The fee structure is
> as follows: Student sets their hourly or per-session rate. Customers are
> charged the Student Rate plus a 20% Grad Gig platform fee, plus applicable
> Stripe payment processing fees (currently 2.9% [+ $0.30, cut off in
> source]).

> It is free to join and browse. A small service fee of 20% plus a Stripe
> credit card processing fee is added to each transaction to cover platform
> costs.

## Service categories (verbatim list, pulled from gig-type strings)

Broader than "yard work and gutters" — the real category list:

- Babysitting
- Overnight Pet Sitting
- Dog walking (mentioned in founder bio)
- Moving / Furniture Assembly / moving furniture
- Yard work / lawn care (mentioned in FAQ example: "e.g. piano, calculus,
  lawn care")
- Snow removal (request-based, not on-call — see note below)
- Tutoring, in a long list of specific subjects: Algebra, Biology,
  Business, Calculus, Chemistry, Economics, Elementary Grammar, Elementary
  Math, Elementary Reading, Elementary Science, Elementary Vocabulary,
  Environmental Science, Essay Writing, Finance, Geometry, History,
  Literature, Marketing, Physics, Spanish

Note: "Grad Gig snow removal is not an on-call service for every time it
snows. Please submit a request each time you need snow removed and allow
time for a student to accept." — worth remembering if snow-removal content
implies instant/on-demand service; it isn't.

## Eligibility (verbatim, from Terms)

> Students: Must be currently enrolled at an accredited college or
> university, or have graduated within the past five years. Must maintain
> an active profile with accurate information. Must have a valid email
> address and, if applicable, a .edu email address for identity
> verification.
> Customers: Must be at least 18 years old. Must provide accurate
> information about tasks, locations, and expectations. Must provide a safe
> and respectful environment for Students.

Note the gap between marketing framing ("Wheaton College students") and the
actual Terms eligibility (any accredited college, or grad within 5 years) —
worth confirming with Luke which is operationally true today vs. aspirational.

## Trust / safety — important constraint

> Grad Gig does not currently perform background checks on Students or
> Customers. Users are encouraged to exercise their own judgment and take
> reasonable precautions. Grad Gig is not responsible for the conduct of
> any user on or off the Platform.

Content should not imply students are background-checked or formally vetted
— that's not accurate per the platform's own Terms. The trust claim the
platform actually makes is softer: "students at Christian colleges offer
something unique... trust, character, and hard work" — a values/community
claim, not a verification claim.

## Testimonial (attribution found, quote text not in bundle)

- "Jennifer M, Wheaton Resident" — appears as an attribution line in the
  bundle; the actual quote text wasn't found (likely loaded dynamically from
  a database at runtime, not compiled into the static bundle). Don't
  fabricate what she said — get the real quote from Luke or the live
  rendered page if it's needed.

## Gap: no direct customer-voice material yet

Everything above is Grad Gig's own product/marketing copy. It's real and
usable for facts, mission, and founder narrative, but it is not homeowner or
student pain-point language in their own words — that still needs actual
calls, DMs, or reviews, mined via `transcript-mine`, before the Ideal
Customer section of `brain.md` can be filled in properly.
