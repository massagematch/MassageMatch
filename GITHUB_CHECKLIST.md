# GitHub Push-checklista

---

## Före varje push

- [ ] Granska TODO.md, COMPLETED.md, ERRORS.md
- [ ] Kör `npm run typecheck` – inga fel
- [ ] Kör `npm run build` – lyckas
- [ ] Fixa alla öppna Critical/High i ERRORS.md (eller dokumentera varför deploy sker ändå)
- [ ] Uppdatera TESTING_LOG.md vid behov
- [ ] Verifiera att ingen känslig data finns i kod (STRIPE_SECRET_KEY, lösenord etc.)
- [ ] Kontrollera att .env är i .gitignore
- [ ] Skriv meningsfull commit message (format nedan)

---

## Commit message format

```
[CATEGORY] Kort beskrivning

- Detaljerad punkt 1
- Detaljerad punkt 2

Fixes: #issue-nummer (om tillämpligt)
Related: TODO.md task #X
```

**Kategorier:** FEAT, FIX, REFACTOR, TEST, DOCS, STYLE, PERF

---

## Efter push

- [ ] Verifiera GitHub Actions/CI passed (om konfigurerat)
- [ ] Kontrollera att Lovable auto-deploy fungerade (om kopplad)
- [ ] Testa deployed version
- [ ] Om Lovable deploy: kör LOVABLE_SYNC_CHECKLIST D (verifiering)
