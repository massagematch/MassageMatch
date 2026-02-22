# Testing Checklist – MassageMatch Thailand

Använd denna checklista för att verifiera Error Boundaries, Offline Mode, Push Notifications och Lazy Loading. Gäller både PC och mobil.

---

## 1. Error Boundaries

- [ ] **Trigger:** Tillfälligt kasta ett fel i en komponent (t.ex. `throw new Error('test')` i Home), ladda om.
- [ ] **Resultat:** Sidan kraschar inte; en fallback visas med titel + meddelande + "Försök igen"-knapp.
- [ ] **Språk:** Ändra webbläsarens språk till svenska (sv) respektive thai (th) och verifiera att texterna byts (svenska / thai).
- [ ] **Återställ:** Klicka "Försök igen" – felet försvinner och innehåll visas igen (eller nästa fel fångas).

---

## 2. Offline Mode (IndexedDB)

- [ ] **Profil cache:** Logga in, vänta tills profil är laddad. Aktivera offline (DevTools → Network → Offline). Ladda om sidan. Profil ska visas från cache (ingen "Offline. Connect to load profile." om cache finns).
- [ ] **Profil utan cache:** Logga ut, sätt offline, logga in igen – ska visa "Offline. Connect to load profile." eller liknande.
- [ ] **Swipe-lista:** Öppna Swipe när du är online så att listan laddas. Sätt offline, gå till annan sida och tillbaka till Swipe (eller ladda om). Listan ska visas från cache (samma kort).
- [ ] **Cache hit tid:** Efter cache används ska sidan kännas snabb (&lt; 0,5 s typiskt).

---

## 3. Push Notifications

- [ ] **Krav:** `VITE_VAPID_PUBLIC_KEY` satt i env; migration 20 körd; `notify-push` deployad med `VAPID_PUBLIC_KEY` och `VAPID_PRIVATE_KEY`.
- [ ] **Prenumeration:** Logga in, tillåt notiser när webbläsaren frågar. Kontrollera i Supabase att `push_subscriptions` har en rad för användaren.
- [ ] **"Ny like!":** Som kund, ge en like till en freelancer som har push prenumeration. Freelancern ska få en push med titel "Ny like!" och body t.ex. "[Name] 1.8km Phuket".
- [ ] **Klick:** Klicka på notisen – fönstret/appen fokuseras eller öppnas.

---

## 4. Lazy Loading

- [ ] **Bundle:** Kör `npm run build`. Kontrollera att det finns flera chunk-filer (t.ex. för Login, Home, Swipe) i `dist/assets/`.
- [ ] **Navigering:** Öppna appen, öppna Network. Gå till Swipe, Premium, Dashboard – nya requests för respektive chunk ska ske (lazy load).
- [ ] **Fallback:** Vid långsam nätverk ska "Loading…" visas kort när du byter till en lazy route.
- [ ] **Ingen fel i konsol:** Inga fel relaterade till lazy/Suspense.

---

## 5. Performance (Thailand 4G)

- [ ] **Initial load:** I DevTools → Network, throttling "Slow 3G" eller "Fast 3G", mät tiden tills första meningsfulla innehåll. Mål: &lt; 3 sekunder.
- [ ] **Cache hit:** Efter att ha laddat profil + Swipe en gång, sätt offline och ladda om – mål: &lt; 0,5 s tills profil/swipe visas från cache.
- [ ] **Lighthouse:** Kör Lighthouse (Performance) på mobilprofil. Mål: Performance &gt; 90 (eller &gt; 95 om möjligt).

---

## 6. Mobil + PC

- [ ] **Mobil:** Testa på riktig enhet eller Chrome DevTools mobil; inloggning, swipe, notiser, offline cache.
- [ ] **PC:** Samma flöden; Error Boundary, lazy routes, push (om webbläsaren stöder det).
- [ ] **Console:** Inga fel i konsolen under normal användning (login, swipe, byt route, offline/online).

---

## 7. Sammanfattning

| Feature           | Verifierad |
|-------------------|------------|
| Error Boundaries  | ☐          |
| Offline profile   | ☐          |
| Offline swipe     | ☐          |
| Push subscription | ☐          |
| Push "Ny like!"   | ☐          |
| Lazy loading      | ☐          |
| Performance 4G    | ☐          |
| Zero console err  | ☐          |

När alla punkter är kryssade är implementationen verifierad enligt denna checklista.
