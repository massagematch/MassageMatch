# Arbetsflöde – MassageMatch (Lovable / Cursor / manuell)

Läs denna fil före och efter varje uppgift så att Lovable, Cursor och manuella utvecklare vet var projektet står och vad som gäller.

---

## Innan varje ny uppgift

1. **Läs TODO.md** – vad ska göras?
2. **Läs COMPLETED.md** – vad är redan gjort?
3. **Läs ERRORS.md** – finns öppna buggar?
4. **Läs IMPLEMENTATION_STATUS.md** – var står Lovable/Cursor?
5. Undvik duplicerat arbete; börja med högst prioriterad uppgift.

---

## Efter varje genomförd uppgift (före commit/push)

1. **Flytta/avmarkera** uppgift i TODO.md och **lägg till post** i COMPLETED.md (datum, filer, beskrivning).
2. **Uppdatera IMPLEMENTATION_STATUS.md** om en checklist-punkt (A1–D) eller större feature blev klar.
3. **Uppdatera ERRORS.md** om buggar hittats eller fixats (Status Fixed, Solution, Commit).
4. **Kör** `npm run typecheck` och `npm run build`.
5. **Committa** med tydlig meddelande (se GITHUB_CHECKLIST.md).
6. **Pusha**; efter push, följ GITHUB_CHECKLIST "Efter Push".

---

## Lovable

**Lovable:** Implementera från GitHub; gör inte om. Följ **LOVABLE_SYNC_CHECKLIST** A1 → A6 → B1 → B2 → B3 → C1 → C2 → D steg för steg. Uppdatera IMPLEMENTATION_STATUS när du slutför en punkt. För deploy: LOVABLE_DEPLOY_CHECKLIST.md.

---

## Cursor

**Cursor:** Följ WORKFLOW.md före och efter varje uppgift. Använd TODO.md, COMPLETED.md, ERRORS.md och IMPLEMENTATION_STATUS.md som referens för status. Committa och pusha enligt GITHUB_CHECKLIST.md.
