# CoachBoard — ontwikkelroadmap

> Versie 1.0 · 10 november 2026 · Branch: `main` · Status: planning, geen implementatieclaims.
> Bron: inventarisatie van de repository `wanderwerkhoven-afk/CoachBoard`. De planning is een voorstel, geen toezegging over doorlooptijd.

## 1. Productvisie
CoachBoard is een Nederlandstalige, mobiel bruikbare voetbalteamapp voor coaches en spelers. De kern is het beheren van spelers, wedstrijden, beschikbaarheid, opstellingen en statistieken, met accounts en cloudopslag.

**Doelen:** eenvoudig wedstrijdbeheer, eerlijke en inzichtelijke speeltijd, betrouwbare beschikbaarheid, veilige samenwerking en een snelle PWA.
**Niet-doelen voor de eerste release:** betaalfuncties, externe competitie-API's, live wedstrijdtracking en AI-coaching.

## 2. Huidige technische uitgangssituatie (geobserveerd)
- Statische frontend: `index.html` (817 regels), `style.css` (~5325), `script.js` (~5470).
- Authenticatie/cloud: `auth.js` (~703), Firebase Authentication en Firestore.
- Offline/PWA: `sw.js`, `manifest.json`, `manifest.webmanifest`.
- Beveiliging: `firestore.rules`.
- Navigatie: Home, Spelers, Wedstrijden, Statistiek.
- In code aanwezig: spelersfiltering en -beheer, afwezigheid, wedstrijdvoorbereiding, beschikbaarheid, twee wedstrijdhelften, automatische opstellingen en wissels, statistieken, doelpunten, PDF-export, WhatsApp-delen, thema/teamkleuren, accountregistratie, uitnodigingslinks, cloudsync.
- Aanwezigheid in broncode betekent **niet** dat elk pad end-to-end getest of productierijp is.
- Geen `package.json` of geautomatiseerde tests zichtbaar in de huidige root. Er is een afzonderlijk demo-HTML-bestand.
- State wordt lokaal bewaard met `coachboard_v1_state` en authenticatiegerelateerde UI-state met `coachboard_auth_v1`.

## 3. Prioriteiten
| Niveau | Onderwerp | Reden |
|---|---|---|
| P0 | Firestore-autorisatie en privacy | Huidige regels laten publieke team-/spelerslezing toe en staan brede writes door ingelogde gebruikers toe |
| P0 | Dataverlies en synchronisatie | Lokale state en Firestore-updates kunnen conflicteren; herstel- en foutpaden moeten worden getest |
| P0 | Testbasis en regressie | Grote monolithische JS/CSS-bestanden zonder zichtbare geautomatiseerde testset |
| P1 | Spelers-, wedstrijd- en opstellingsflows | Kernfunctionaliteit betrouwbaar en toegankelijk maken |
| P1 | Mobiele UX, PWA en offline gedrag | Gebruik langs het veld |
| P2 | Modulaire architectuur, performance en extra exports | Onderhoudbaarheid en uitbreiding |

## 4. Roadmap — zes sprints (indicatief: twee weken per sprint)
### Sprint 1 — nulmeting, beveiliging en herstelbaarheid
- Functionele inventarisatie per scherm, rol en gegevensstroom.
- Back-up/export van bestaande testdata; testproject voor Firebase gebruiken.
- Firestore-regels herontwerpen met expliciete coach-/spelerrechten en lidmaatschapscontrole. Verifieer of bestaande datamodellen daarvoor geschikt zijn.
- Firebase Emulator-tests voor lezen/schrijven door eigenaar, speler, andere coach, niet-ingelogde gebruiker en ongeldige uitnodiging.
- Basale smoke tests: inloggen, spelers, wedstrijden, opslaan, verversen.
**Gereed wanneer:** ongeautoriseerde reads/writes worden geweigerd, geautoriseerde flows slagen en testdata herstelbaar is.

### Sprint 2 — data en synchronisatie
- Datamodel voor users, teams, players, matches, invites en notifications vastleggen.
- Eén bron van waarheid per gegevenssoort kiezen; lokale cache expliciet onderscheiden van cloudstate.
- Migratie van `coachboard_v1_state` documenteren en met dummydata testen.
- Conflicten, netwerkuitval, herverbinding, dubbele writes en verwijderingen afhandelen.
- Invitatietokens een vervaldatum, eenmalig gebruik en server-side validatie geven.
**Gereed wanneer:** twee apparaten dezelfde geldige teamstate zien, offline fouten zichtbaar zijn en herstel voorspelbaar is.

### Sprint 3 — spelers en beschikbaarheid
- Speler toevoegen, bewerken, verwijderen, posities, niveau, filters en sortering testen.
- Beschikbaarheidsstatussen (`fit`, `limited`, `noPlay`, `absent`) eenduidig maken.
- Afwezigheidsdatums en last-minute meldingen testen.
- Rolgebaseerde UI en serverregels consistent maken; spelers zien alleen toegestane gegevens.
- Validatie, bevestigingen, lege staten en foutmeldingen afwerken.
**Gereed wanneer:** alle spelersflows slagen voor coach en speler met correcte rechten.

### Sprint 4 — wedstrijden en opstellingen
- Wedstrijd toevoegen, wijzigen, voorbereiden, afronden en terugzetten testen.
- 4-3-3 en 4-4-2, positiegeschiktheid en automatische selectie met vaste testcases toetsen.
- Twee helften, bank, drag-and-drop en snel wisselen op mobiel testen.
- Eerlijke speeltijd en uitzonderingen expliciet specificeren.
- Historische resultaten na herberekening consistent houden.
**Gereed wanneer:** opstellingen reproduceerbaar zijn en wedstrijden zonder statistiekverlies kunnen worden afgerond.

### Sprint 5 — statistiek, delen en UX
- Doelpunten, speeltijd, seizoensstatistiek en spelershistorie valideren.
- PDF-export en afbeelding/WhatsApp-delen testen op iOS, Android en desktop.
- Navigatie, contrast, toetsenbordbediening, touch-targets en schermlezers verbeteren.
- CSS-tokens en herbruikbare componenten inventariseren; onnodige duplicatie verminderen.
**Gereed wanneer:** statistieken overeenkomen met wedstrijddata en kernflows mobiel bruikbaar zijn.

### Sprint 6 — PWA, release en onderhoud
- Service-worker-cacheversies, offline start en updategedrag controleren.
- Performance, toegankelijkheid, foutregistratie en regressietests uitvoeren.
- Documentatie, changelog, releasechecklist en herstelprocedure afronden.
- Gefaseerde test met coaches/spelers en gerichte bugfixronde.
**Gereed wanneer:** alle P0/P1-tests slagen, er geen bekende kritieke datalekken zijn en release/rollback beschreven zijn.

## 5. Backlog na de basisrelease
- Meerdere teams per coach en teamwissel.
- Uitgebreide tactiekbibliotheek en eigen formaties.
- Aanwezigheidsherinneringen en optionele pushnotificaties.
- CSV-export/import en auditlog.
- Analyse van speeltijd over langere perioden.
Deze punten zijn ideeën, geen bevestigde bestaande features.

## 6. Definitie van Done (voor iedere wijziging)
1. Concrete gebruikerswaarde en acceptatiecriteria beschreven.
2. Bestaande data en rollen niet onbedoeld gewijzigd.
3. Relevante tests uitgevoerd, inclusief fout- en offlinepad waar van toepassing.
4. Geen secrets in Git; Firebase-webconfig is op zichzelf geen geheim, beveiliging ligt bij regels en autorisatie.
5. Mobiel en desktop gecontroleerd.
6. Documentatie/variabelenregister bijgewerkt bij codewijzigingen.
7. Duidelijke commitmessage, push naar afgesproken branch, commit-SHA en testresultaten gerapporteerd.

## 7. Werkafspraken GitHub
- Standaardbranch: `main`; kleine, afgebakende commits.
- Voor risicovolle data-/securitywijzigingen bij voorkeur eerst een aparte branch en review, ook als de uiteindelijke release op `main` komt.
- Commitconventie: `docs:`, `fix:`, `feat:`, `refactor:`, `test:`, `security:`.
- Nooit productiegegevens overschrijven met demo- of migratiedata.
- Documentatie: `ROADMAP.md` en `VARIABLES.md`; update ze zodra architectuur of variabelen wijzigen.

## 8. Risicoregister
| Risico | Impact | Maatregel |
|---|---|---|
| Publieke Firestore-reads en te brede writes | Kritiek | Autorisatiemodel + emulator security tests |
| LocalStorage/cloud-conflicten | Hoog | Data-eigenaarschap, versiebeheer, hersteltests |
| Grote monolithische bestanden | Hoog | Eerst tests, dan stapsgewijs modules scheiden |
| Service-worker serveert oude bestanden | Middel | Cacheversies en updateflow testen |
| Onvoldoende validatie van uitnodigingen | Hoog | Expiratie, claims, server-side checks |
| Exportverschillen tussen browsers | Middel | Browser/device-testmatrix |
| Niet-gedocumenteerde data-migraties | Hoog | Fixtures, back-up, migratieplan |

## 9. Open beslissingen
- Is CoachBoard bedoeld voor één of meerdere teams per account?
- Welke persoonsgegevens mogen spelers onderling zien?
- Wie mag wedstrijden, beschikbaarheid en opstellingen wijzigen?
- Moet offline bewerken worden ondersteund of alleen offline lezen?
- Welke formatieregels en speeltijdregels zijn leidend?
- Is er een aparte testomgeving voor Firebase?

## 10. Eerste uitvoerbare taken
1. Test-Firebaseproject en back-upplan.
2. Security-testmatrix voor `firestore.rules`.
3. State- en Firestore-schema documenteren.
4. Smoke-testlijst per hoofdscherm.
5. Daarna gericht refactoren zonder zichtbare gedragswijzigingen.

Zie `VARIABLES.md` voor de variabelen, functies, opslaglocaties en onderhoudsafspraken.
