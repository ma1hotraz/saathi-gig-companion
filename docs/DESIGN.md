# Saathi design system

**Audience & job.** A delivery rider or daily-wage worker on a mid-range Android, outdoors, one-handed, often with limited reading ease. The app has to be understood at a glance in sunlight and work in the worker's own language.

**Direction: road signage.** Indian highway boards: black on yellow, thick borders, heavy condensed numerals, unambiguous icons next to words. The memorable element is the *sign panel* (2px asphalt border, hard offset shadow) used for the one thing that matters on each screen. Everything else stays quiet.

Rejected defaults: cream + serif + terracotta; near-black + neon accent; grey SaaS card grids; all-caps eyebrows on every heading.

## Tokens
| Role | Name | Hex | WCAG contrast (computed) |
|---|---|---|---|
| Text, borders | asphalt | `#16202B` | 16.5:1 on paper, 14.9:1 on chalk |
| Secondary text | muted | `#4D5A67` | 7.1:1 on paper, 6.4:1 on chalk |
| Page | chalk | `#F3F4F1` | — |
| Surface | paper | `#FFFFFF` | — |
| Primary action fill (text is asphalt) | highway yellow | `#FFC400` | 10.3:1 (asphalt text on yellow) |
| Money in / success | money green | `#0A7040` | 6.2:1 on paper, 5.6:1 on chalk |
| Danger / SOS / money out | alert red | `#B3261E` | 6.5:1 on paper, 5.9:1 on chalk |
| Links, secondary action | lane blue | `#1B4F9C` | 7.9:1 on paper, 7.2:1 on chalk |

Single light theme (readable in sun). `color-scheme: light`.

## Type
One family: **Archivo Variable** (width axis) for Latin, with self-hosted **Noto Sans** for each Indic script as fallbacks (Devanagari, Bengali, Tamil, Telugu, Kannada, Gujarati, Malayalam, Gurmukhi, Oriya). Fonts are bundled, not fetched from Google, because the CSP is same-origin.
Scale: body 18px / 1.55; small 15px (minimum); h3 22; h2 28; h1 34; money numerals 56 at 75% width, weight 800.
Line length capped at 65ch for prose.

## Layout
Mobile-first single column, max 640px centred. Top bar (logo, language, SOS). Bottom tabs: Home · Earnings · Ask · Docs · Rights, 64px + safe-area. Touch targets ≥ 48px. Sections are separated by space and one sign panel, not by stacks of identical cards.

## Motion
None except: button press (offset shadow collapses), streaming text, and skeletons while the model works. `prefers-reduced-motion` removes the rest.

## Voice
Plain verbs, sentence case, no jargon. Buttons say what happens ("Save earning", "Write my letter"). Errors say what failed and what to do next. Empty states invite the first action.
