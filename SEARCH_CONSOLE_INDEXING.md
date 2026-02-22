# Google Search Console – Request Indexing

Skicka dessa URLs för indexering i **Google Search Console** (URL Inspection → Request Indexing). Byt ut `https://massagematchthai.com` mot din faktiska domän (t.ex. `https://dinapp.lovable.app` eller `https://massagematchthai.com`).

**PRIORITET 1 – robots.txt (fixar sitemap-fel):**  
Ha `public/robots.txt` med `Allow: /`, `Disallow: /admin` och `Sitemap: https://din-domän/sitemap.xml`. I Lovable: public/ → New file → robots.txt → klistra in innehåll från repot.

**Sitemap:** Search Console → Sitemaps → lägg till:  
`https://massagematchthai.com/sitemap.xml`

---

## 🏠 HOMEPAGE

- `https://massagematchthai.com/`

---

## 🔥 TOP 6 STÄDER (hög sökvolym)

- `https://massagematchthai.com/phuket`
- `https://massagematchthai.com/bangkok`
- `https://massagematchthai.com/pattaya`
- `https://massagematchthai.com/chiang-mai`
- `https://massagematchthai.com/koh-samui`
- `https://massagematchthai.com/koh-tao`

---

## 🌴 ÖVRIGA TURISTORTER

- `https://massagematchthai.com/koh-phangan`
- `https://massagematchthai.com/krabi`
- `https://massagematchthai.com/ao-nang`
- `https://massagematchthai.com/phi-phi`
- `https://massagematchthai.com/railay`
- `https://massagematchthai.com/hua-hin`
- `https://massagematchthai.com/karon`
- `https://massagematchthai.com/kata`
- `https://massagematchthai.com/mai-khao`
- `https://massagematchthai.com/jomtien`
- `https://massagematchthai.com/nimmanhaemin`
- `https://massagematchthai.com/chaweng`

---

## Steg i Search Console

1. Gå till [Google Search Console](https://search.google.com/search-console).
2. Välj din property (domän eller URL-prefix).
3. **Sitemaps:** Lägg till `sitemap.xml` (full URL: `https://din-domän/sitemap.xml`).
4. **URL Inspection:** Klistra in varje URL ovan → **Request Indexing** (max ~10 per dag; prioritera homepage + top 6 städer först).

Alla dessa stads-URL:er renderas av **CityPage** (`src/pages/cities/CityPage.tsx`) med unik titel, beskrivning och områden per stad.
