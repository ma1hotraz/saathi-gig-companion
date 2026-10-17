# Accessibility (target: WCAG 2.2 AA)

Automated: `@axe-core/playwright` runs with the `wcag2a`, `wcag2aa`, `wcag21aa` and `wcag22aa` rule sets on the sign-in page (`tests/e2e/public.spec.ts`) and on every signed-in screen after the real journey (`tests/e2e/journey.spec.ts`). During development all nine signed-in screens were scanned and had zero violations.

| Need | What we did |
|---|---|
| Colour contrast | Every text/background pair in the palette was computed (see `docs/DESIGN.md`): the lowest used pair is 5.3:1. Hints inside yellow panels use the dark text colour. |
| Keyboard & focus | Native buttons, links and form controls; a 3px focus ring on everything; skip link to `#main`; the SOS and other dialogs use Radix (focus trap, Esc, return focus). |
| Screen readers | One `h1` per page; landmarks (`header`, `nav`, `main`); every input has a visible `<label>`; hints and field errors linked with `aria-describedby`; icons are `aria-hidden` and always paired with text; chat is a `role="log"` with `aria-live="polite"` and `aria-busy` while streaming; results and errors use `role="status"` / `role="alert"`. Charts have a hidden table alternative. |
| Language | `<html lang>` follows the chosen language; AI-written blocks carry `lang`; fonts for all 10 Indic scripts are bundled, so text never falls back to boxes. |
| Low literacy / low vision | Voice input on every free-text field (Gemini transcription), read-aloud with the phone's own voice (hidden if the phone has none for that language), base 18px text with a Small/Normal/Large control, 48px minimum touch targets, plain words at roughly class-5 level. |
| Motion | No decorative animation; `prefers-reduced-motion` disables the rest. |
| Not colour alone | Red flags, errors and money-in/out always carry a text label. |

Known gaps: the interface strings are translated into English, Hindi and Tamil only (the AI answers in all 11 supported languages); Hindi and Tamil copy has not been reviewed by a native speaker.
