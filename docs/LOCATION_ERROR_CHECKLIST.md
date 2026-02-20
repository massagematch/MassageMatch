# Thailand Location + Maps – Error Scan & Test Checklist

## 1. Frontend (F12 Console)

- [ ] No red JavaScript/TypeScript errors
- [ ] Location dropdowns: Region → City → Area (e.g. Southern → Phuket → Patong) populate correctly
- [ ] Maps button opens Google Maps (desktop) or Apple Maps (iOS)
- [ ] Mobile responsive (iPhone/Android)

## 2. Backend (Supabase)

```sql
SELECT location_region, location_city, location_area FROM profiles LIMIT 5;
```

- [ ] RLS: Customer read-only on others’ profiles; therapist can update own profile (including location)
- [ ] Edge function `validate-thailand-bounds`: Phuket coords only (optional server-side validation)

## 3. Test Suite (Automated)

- [x] Signup → Region "Southern" → City "Phuket" → Area "Patong" → saves to profile
- [x] Therapist "Share location" toggle → lat/lng update; MapButton shows when shared
- [x] Customer Swipe → filter by city (Phuket); "<5km" filter when customer has lat/lng
- [x] Map link format: `https://www.google.com/maps?q=7.888,98.299` (or Apple Maps on iOS)
- [x] Privacy: when `share_location` is false, show "Location private"

Run: `npm run test`

## 4. Production Readiness

- [ ] Lighthouse >95 (Performance / SEO / Best practices / Accessibility)
- [ ] No 404s/500s in F12 Network tab
- [ ] Cross-browser: Chrome, Safari, Firefox
- [ ] Geolocation permission UX (browser prompt when enabling "Share location")

## Deploy (GitHub → Lovable)

1. Add remote: `git remote add origin <your-github-repo-url>`
2. Push: `git push -u origin main`
3. In Lovable, connect repo and sync; verify deploy status and run the checks above.
