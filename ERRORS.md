# ERRORS – MassageMatch Thailand

**Lovable/Cursor:** När ett fel fixas, sätt Status till Fixed och fyll i Solution + Commit. Lägg nya fel här med Status Open.

---

## Priority levels

- **Critical:** Applikationen kraschar; data loss möjlig; betalningar fungerar inte; säkerhetshål. Fix immediately.
- **High:** Viktiga funktioner fungerar inte; dålig UX; performance issues. Fix before deploy.
- **Medium:** Mindre buggar; UI-glitch; mindre funktioner inte optimala. Fix soon.
- **Low:** Kosmetiska problem; edge cases; nice-to-have. Fix when possible.

---

## Mall för ny error

```markdown
## Error #[nummer]

**Status:** Open | In Progress | Fixed  
**Severity:** Critical | High | Medium | Low  
**Discovered:** YYYY-MM-DD HH:MM  
**Component:** [filnamn eller komponent]

### Description
[Detaljerad beskrivning]

### Error Message
\`\`\`
[Exakt felmeddelande]
\`\`\`

### Stack Trace
\`\`\`
[Full stack trace om tillgänglig]
\`\`\`

### Steps to Reproduce
1. Steg 1
2. Steg 2
3. Steg 3

### Expected Behavior
[Vad som skulle hända]

### Actual Behavior
[Vad som faktiskt händer]

### Solution
[Lämnas tom tills fixad]

### Fixed
**Date:** [Fyll i när fixad]  
**Solution:** [Beskriv lösningen]  
**Commit:** [Commit hash eller meddelande]
```

---

*(Inga errors loggade ännu.)*
