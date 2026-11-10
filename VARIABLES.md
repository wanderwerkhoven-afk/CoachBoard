# CoachBoard — variabelen- en locatieregister

> Versie 1.0 · 10 november 2026 · Referentie: huidige `main` bij inventarisatie.
> **Scope:** benoemde top-level configuratie, gedeelde runtime-state, publieke API, kernfuncties, datavelden en UI-locaties. Lokale tijdelijke variabelen binnen elke functie (bijvoorbeeld `i`, `el`, `m`) worden bewust niet afzonderlijk geregistreerd; die zijn functiegebonden en wijzigen vaak. Regellocaties zijn momentopnames en verschuiven na commits. Zoek primair op symboolnaam.

## 1. Bestanden en verantwoordelijkheden
| Pad | Verantwoordelijkheid |
|---|---|
| `index.html` | HTML-schermen, formulieren, modals, DOM-IDs, scriptinclusie |
| `style.css` | Layout, kleuren, responsiviteit, componentstijlen |
| `script.js` | Appstate, spelers, wedstrijden, opstellingen, statistiek, export, UI |
| `auth.js` | Firebase-initialisatie, authenticatie, uitnodigingen, Firestore-sync |
| `firestore.rules` | Database-toegangsregels; **niet** te verwarren met UI-rechten |
| `sw.js` | PWA-cache en service-worker |
| `manifest.json`, `manifest.webmanifest` | PWA-metadata |
| `CoachBoard_DEMO_dubbel_potlood_verwijderd.html` | Los demo-artefact; geen primaire applicatiebron |
| `icon.svg`, `coachboard-football-icon.svg`, PNG/ICO | App-iconen |

## 2. Top-level constanten en gedeelde state — `script.js`
| Symbool | Startregel (indicatief) | Type / betekenis | Wijzigingsimpact |
|---|---:|---|---|
| `POS` | 37 | Object: posities 1–11 met labels | Spelers, opstelling, weergave |
| `XY433` | 42 | Object: procentuele veldcoördinaten voor 4-3-3 | Posities op veld |
| `XY442` | 43 | Object: procentuele veldcoördinaten voor 4-4-2 | Posities op veld |
| `STATUS` | 44 | Object: `fit`, `limited`, `noPlay`, `absent` | Beschikbaarheid, selectie |
| `KEY` | 45 | String: `coachboard_v1_state` | LocalStorage, migratie |
| `state` | 48 | Mutabele hoofdstate, geladen via `loadState()` | Vrijwel alle schermen |
| `activeMatchId` | 125 | Huidig geselecteerde wedstrijd-ID | Wedstrijddetail |
| `chosenPositions` | 126 | `Set` van gekozen posities | Spelers/opstelling |
| `editingMatchId` | 570 | Te bewerken wedstrijd-ID | Wedstrijdmodal |
| `finishResultMatchId` | 809 | Wedstrijd in afrondflow | Resultaat |
| `finishSpecialStatus` | 812 | Bijzondere eindstatus | Afronden |
| `finishScorerDraft` | 847 | Tijdelijke doelpuntenmakers | Resultaat |
| `editPlayerSelectedPositions` | 1208 | Posities in spelerseditor | Speler bewerken |
| `editPlayerAbsenceDates` | 1264 | Afwezigheidsdatums in editor | Beschikbaarheid |
| `currentPlayerLevelFilter` | 1368 | Filter op niveau | Spelerslijst |
| `currentPlayerPositionFilter` | 1369 | Filter op positie | Spelerslijst |
| `currentPlayerSort` | 1370 | Sorteerkeuze | Spelerslijst |
| `pendingDeleteMatchId` | 1552 | Wedstrijd wacht op verwijderbevestiging | Verwijderen |
| `currentMatchesFilter` | 1684 | Wedstrijdfilter | Wedstrijden |
| `swapContext` | 2566 | Context voor wisselactie | Opstellingen |
| `lastTap` | 2567 | Laatste tik / timing | Touch-interactie |
| `dragState` | 2673 | Actieve drag-and-dropcontext | Veldinteractie |
| `currentPlayerStatsId` | 3826 | Actieve speler in statistiek | Statistiek |
| `currentPlayerHistoryFilter` | 3827 | Filter spelershistorie | Statistiek |
| `AUTH_KEY` | 4594 | String: `coachboard_auth_v1` | Lokale rol/accountstate |
| `ACCESS_MATRIX` | 4596 | Object: UI-toegangsmodel | Schermrechten |
| `lastLookedUpTeamCode` | 4640 | Laatst opgezochte teamcode | Teamkoppeling |
| `lookupDebounceTimer` | 4641 | Debounce-timer | Teamcode-opzoeking |
| `THEME_KEY` | 5120 | String: `coachboard_theme_v1` | Thema-opslag |

**Let op:** `ACCESS_MATRIX` is geen vervanging voor Firestore-securityregels. Bewaar geen vertrouwelijke informatie uitsluitend achter UI-voorwaarden.

## 3. Firebase en gedeelde state — `auth.js`
| Symbool | Startregel | Type / betekenis |
|---|---:|---|
| `firebaseConfig` | 23 | Firebase-webappconfiguratie (project, domein, app-ID, API-key etc.) |
| `app` | 33 | Firebase-appinstantie |
| `auth` | 34 | Firebase Auth-instantie |
| `db` | 35 | Firestore-instantie |
| `googleProvider` | 37 | Google-loginprovider |
| `currentUser` | 40 | Huidige Firebase-gebruiker |
| `unsubscribeFirestore` | 41 | Opruimfunctie Firestore-listener |
| `unsubscribeTeamListener` | 42 | Opruimfunctie teamlistener |
| `unsubscribePlayersListener` | 43 | Opruimfunctie spelerslistener |
| `unsubscribeNotificationsListener` | 44 | Opruimfunctie notificatielistener |
| `isApplyingCloudUpdate` | 45 | Guard tegen synchronisatielus |
| `cloudSyncTimeout` | 46 | Uitgestelde sync |
| `currentTeamCode` | 47 | Huidige teamcode |
| `currentPendingInvite` | 48 | Uitnodiging die nog verwerkt moet worden |
| `shownNotificationIds` | 49 | `Set` voor reeds getoonde meldingen |

**Configadvies:** Firebase-webconfig is doorgaans publieke clientconfiguratie, geen servergeheim. Beperk toegangsrechten met securityregels, Auth en App Check waar passend. Plaats nooit admin-SDK-credentials of private sleutels in frontendcode.

## 4. Persistente opslag en gegevensstroom
| Opslag | Sleutel / pad | Lezen/schrijven | Betekenis |
|---|---|---|---|
| Browser LocalStorage | `coachboard_v1_state` | `loadState`, `saveState` | Lokale team-/wedstrijdstate |
| Browser LocalStorage | `coachboard_auth_v1` | `authGet`, `authSave` | Lokale account-/rolweergave |
| Browser LocalStorage | `coachboard_theme_v1` | `loadCoachBoardTheme`, `applyCoachBoardTheme` | Thema |
| Firestore | `users/{userId}` | `auth.js` | Gebruikersprofiel |
| Firestore | `teams/{teamCode}` | `auth.js` | Teamdocument |
| Firestore | `teams/{teamCode}/players/{playerId}` | `auth.js` | Spelersdocument |
| Firestore | `teams/{teamCode}/notifications/{notifId}` | `auth.js` | Meldingen |
| Firestore | `invites/{token}` | `auth.js` | Uitnodigingsgegevens |
| Cache Storage | `coachboard-shell-v1` | `sw.js` | PWA-shell |

**Securitywaarschuwing:** huidige `firestore.rules` staan publieke reads van uitnodigingen, teams en spelers toe; writes naar teams/spelers zijn toegestaan voor iedere ingelogde gebruiker. Dit moet vóór productiegebruik worden aangescherpt en getest.

## 5. State-structuur en veldconventies
De hoofdstate wordt opgebouwd met `defaultState()` (regel ~128), geladen met `loadState()` en bewaard met `saveState()`. Dit zijn de in de code aantoonbaar gebruikte hoofdconcepten:

| Object | Veld | Betekenis |
|---|---|---|
| `state` | `teamName` | Teamnaam |
| `state` | `teamCode` | Teamidentificatie |
| `state` | `clubLogo` | Clublogo |
| `state` | `players` | Array spelers |
| `state` | `matches` | Array wedstrijden |
| Speler | `id`, `name` | ID en naam |
| Speler | `level` | Spelerniveau; huidige code gebruikt 1, 2 en 3 |
| Speler | `preferredAvailability` | Standaard beschikbaarheidsstatus |
| Speler | `absenceDates` | Datums waarop speler afwezig is |
| Wedstrijd | `id`, `date` | Identificatie en datum |
| Wedstrijd | `availability` | Status per speler-ID |
| Wedstrijd | `lineup1`, `lineup2` | Opstelling per helft |
| Wedstrijd | `prepared`, `completed` | Voorbereid/afgerond |
| Wedstrijd | `scorers` | Doelpuntenmakers |

Dit is een **kernveldenregister**, niet een gegarandeerd exhaustief typeschema voor elk genest veld. Leg bij refactoring het volledige JSON-schema vast en valideer met fixtures.

## 6. Functielocaties — `script.js`
### Basis en rendering
| Functie | Regel | Doel |
|---|---:|---|
| `showToast` | 2 | Toastmelding |
| `migrateCoachBoardData` | 50 | Bestaande lokale data bijwerken |
| `defaultState` | 128 | Beginstate |
| `loadState` / `saveState` | 129–130 | Opslag |
| `uid` | 193 | ID aanmaken |
| `formatDateNL` | 194 | Datumweergave |
| `esc` | 200 | HTML-escaping |
| `show` | 209 | Schermnavigatie |
| `renderAll` | 380 | Totale render |
| `renderHeader` | 381 | Header |
| `renderHome` | 1076 | Home |

### Spelers
| Functie | Regel | Doel |
|---|---:|---|
| `openPlayerEditor` | 1310 | Spelereditor |
| `deletePlayer` | 1336 | Speler verwijderen |
| `filteredPlayers` | 1372 | Filters en sortering |
| `renderPlayers` | 1410 | Spelerslijst |
| `playerAbsentOnDate` | 1288 | Afwezigheidscontrole |
| `syncPlayerAbsenceToUnpreparedMatches` | 1292 | Afwezigheid doorzetten |
| `renderPlayerAbsenceDates` | 1270 | Afwezigheidsweergave |

### Wedstrijden
| Functie | Regel | Doel |
|---|---:|---|
| `openEditMatch` / `saveEditedMatch` | 571 / 580 | Wedstrijd bewerken |
| `openQuickAddMatch` | 684 | Snel toevoegen |
| `renderMatches` | 1702 | Wedstrijdenlijst |
| `openMatch` / `renderMatchDetail` | 1757 / 1785 | Wedstrijddetail |
| `renderAvailability` | 1958 | Beschikbaarheid |
| `deleteMatch` / `confirmDeleteMatch` | 1554 / 1572 | Verwijderen |
| `openFinishResultModal` / `confirmFinishResult` | 966 / 1013 | Afronden |
| `restorePreparedMatch` | 3305 | Voorbereide wedstrijd herstellen |

### Opstellingen
| Functie | Regel | Doel |
|---|---:|---|
| `exactFitScore` | 2115 | Positiegeschiktheid |
| `proposalScore` | 2131 | Selectiescore |
| `optimizeLineup` | 2141 | Selectieoptimalisatie |
| `generateLineups` | 2315 | Opstellingen genereren |
| `assignPositions` | 2446 | Posities toewijzen |
| `drawPitch` / `drawLineups` | 2535 / 2563 | Veld tekenen |
| `openSwapChooser` / `performQuickSwap` | 2590 / 2641 | Wissels |
| `attachDrag` / `attachBenchDrag` | 2805 / 2908 | Drag-and-drop |
| `adjustEveryonePlays` | 3069 | Speeltijdcorrectie |
| `renderBench` | 3178 | Wisselbank |

### Statistiek en exports
| Functie | Regel | Doel |
|---|---:|---|
| `playerMatchMinutes` | 224 | Speeltijd per wedstrijd |
| `totalPlayerGoals` | 962 | Doelpunten totaal |
| `rebuildStoredPlayerStats` | 3276 | Statistieken herberekenen |
| `renderStats` | 3583 | Statistiekpagina |
| `renderPlayerHistory` | 3837 | Spelershistorie |
| `generatePlayerPdf` | 240 | Speler-PDF |
| `downloadSeasonBookPdf` | 3434 | Seizoensboek-PDF |
| `downloadPlayerStatsPdf` | 3910 | Spelerstatistiek-PDF |
| `shareLineupToWhatsApp` | 4264 | Opstelling delen |
| `copyHalfAsImage` | 4352 | Veldhelft kopiëren als afbeelding |

### Rechten en personalisatie
| Functie | Regel | Doel |
|---|---:|---|
| `currentAuth` | 4617 | Lokale auth-context |
| `isCoachRole` / `isPlayerRole` | 4620 / 4623 | Rolcontrole |
| `canManageTeam` | 4629 | UI-bewerkrechten |
| `ensureTeamCode` | 4632 | Teamcode |
| `authGet` / `authSave` | 4720 / 4721 | Lokale auth-opslag |
| `authApply` | 4737 | UI-auth toepassen |
| `applyCoachBoardTheme` | 5122 | Thema toepassen |
| `applyTeamColors` | 5273 | Teamkleuren |
| `openTeamColorsModal` | 5326 | Kleurinstellingen |

## 7. Functielocaties — `auth.js`
| Functie | Regel | Doel |
|---|---:|---|
| `notifyToast` | 52 | Meldingen |
| `updateAuthUI` | 76 | Auth-UI |
| `window.createPlayerInvite` | 98 | Uitnodiging maken |
| `checkInviteFromUrl` | 138 | Linkparameter verwerken |
| `linkAccountToInvite` | 179 | Account koppelen |
| `fetchTeamDataByCode` | 246 | Team opzoeken |
| `listenToTeamUpdates` | 296 | Realtime updates |
| `window.writeLastMinuteAbsenceNotification` | 368 | Afwezigheidsmelding |
| `initUserFirestoreData` | 391 | Gebruikersdata initialiseren |
| `window.syncStateToCloud` | 476 | Teamstate synchroniseren |
| `window.syncAuthToCloud` | 541 | Authdata synchroniseren |
| `handleGoogleSignIn` | 560 | Google-login |
| `handleEmailSignIn` | 571 | E-mail-login |
| `handleEmailRegister` | 587 | Registratie |
| `handleFirebaseLogout` | 603 | Uitloggen |

## 8. Publieke brug tussen scripts
De klassieke `script.js` en module `auth.js` communiceren deels via `window`. Bestaande publieke ingangen omvatten:
- `window.getCoachBoardState` en `window.setCoachBoardState`
- `window.mergePlayerUpdate`
- `window.getCoachBoardAuth` en `window.setCoachBoardAuth`
- `window.showToast`
- `window.createPlayerInvite`
- `window.fetchTeamDataByCode`
- `window.syncStateToCloud` en `window.syncAuthToCloud`
- `window.handleGoogleSignIn`, `window.handleEmailSignIn`, `window.handleEmailRegister`, `window.handleFirebaseLogout`
- `window.onFirebaseAuthSuccess`, `window.onFirebaseAuthNeedsRole`

**Wijzigingsregel:** hernoem deze functies niet zonder alle aanroepen en het laadmoment van beide scripts te controleren.

## 9. UI-locaties en DOM-contracten — `index.html`
| Element | Selector / attribuut | Doel |
|---|---|---|
| Inlogschil | `#authShell` | Authenticatie |
| Login | `#loginStep` | Inloggen |
| Registratie | `#registerStep` | Account aanmaken |
| Uitnodiging | `#inviteStep` | Speler koppelen |
| Hoofdnavigatie | `[data-screen]` | Tabnavigatie |
| Home | `#home` | Startscherm |
| Spelers | `#players` | Spelersbeheer |
| Wedstrijden | `#matches` | Wedstrijdbeheer |
| Statistiek | `#stats` | Statistieken |
| Spelerslijst | `#playerList` | Dynamische spelerkaarten |
| Spelerfilter niveau | `#playerLevelFilter` | Filter |
| Spelerfilter positie | `#playerPositionFilter` | Filter |
| Spelersortering | `#playerSort` | Sortering |
| Wedstrijdenfilter | `[data-match-filter]` | Filter |
| Toasts | `#toastStack` | Feedback |
| Script | `script.js` | App-logica |
| Module | `auth.js` | Firebase |

Bij een DOM-ID-wijziging: zoek alle `getElementById`, `querySelector`, CSS-selectors en eventlisteners die ervan afhangen.

## 10. CSS, thema en PWA
- `style.css` is het centrale stijlbestand; controleer eerst bestaande custom properties, selectors en mediaqueries voor nieuwe stijlen.
- `applyCoachBoardTheme`, `loadCoachBoardTheme` en `applyTeamColors` regelen runtime-personalisatie.
- `sw.js`: `CACHE = 'coachboard-shell-v1'` (regel 1); `SHELL` (regel 2) noemt de bestanden die gecachet worden.
- Bij deploy van gewijzigde assets moet cache-invalidering expliciet worden getest.
- Beide manifestbestanden bestaan; bepaal welk bestand leidend is voordat metadata wordt gewijzigd (`index.html` verwijst naar `manifest.webmanifest`).

## 11. Regels voor nieuwe variabelen
1. Gebruik `const` tenzij her-toewijzing nodig is; gebruik `let` voor mutabele runtime-state.
2. Configuratie bovenaan een module of in een aparte configmodule; geen verspreide magic strings.
3. Benoem booleans als `is...`, `has...`, `can...`; IDs als `...Id`; verzamelingen als meervoud.
4. Houd UI-drafts gescheiden van persistente state.
5. Wijzig opslagkeys alleen met expliciete migratie en tests.
6. Verander veldcoördinaten en selectieparameters alleen met voorbeeldopstellingen en regressietests.
7. Firestore-regels zijn de bron voor daadwerkelijke autorisatie; clientrolchecks alleen voor UX.
8. Werk dit register bij bij nieuwe globale variabelen, opslagkeys, publieke API's of schemawijzigingen.

## 12. Zo vind je variabelen snel
```bash
git grep -n 'const POS'
git grep -n 'coachboard_v1_state'
git grep -n 'syncStateToCloud'
git grep -n 'data-screen'
git grep -n 'getElementById'
git grep -n 'firebaseConfig'
```
Voor een volledig machineleesbaar symbolenoverzicht kan later een AST-parser (bijvoorbeeld Acorn/ESLint) worden toegevoegd. Dit register is de onderhoudbare menselijke index en vervangt geen statische codeanalyse.

## 13. Verificatiechecklist
- [ ] Symbolen en regellocaties opnieuw controleren na refactor.
- [ ] Volledig genest state-schema uit `defaultState()` en alle mutaties afleiden.
- [ ] Alle Firestore-velden en permissies tegen emulator testen.
- [ ] Alle DOM-ID's en eventlisteners automatisch op consistentie controleren.
- [ ] Dubbele of ongebruikte CSS-regels inventariseren.
- [ ] Migratieplan voor eventuele nieuwe opslagkeys toevoegen.

Gerelateerd: [ROADMAP.md](ROADMAP.md).


---

# Uitgebreide technische bronindex

## A. Volledige index van JavaScript-declaraties (automatisch geëxtraheerd)

> Iedere expliciete `const`/`let`/`var`-declaratie die met een eenvoudige statische bronregel-scan wordt gevonden, inclusief functie-lokale variabelen. Herhaalde namen zijn bewust behouden: ze kunnen in verschillende scopes voorkomen. Destructuring, parameters, impliciete globals en declaraties binnen complexe syntaxis vragen AST-verificatie.

| Bestand | Regel | Declaratie | Soort |
|---|---:|---|---|
| `script.js` | 4 | `stack` | const |
| `script.js` | 5 | `safe` | const |
| `script.js` | 6 | `titles` | const |
| `script.js` | 7 | `icons` | const |
| `script.js` | 8 | `toast` | const |
| `script.js` | 18 | `timer` | let |
| `script.js` | 19 | `dismiss` | const |
| `script.js` | 31 | `text` | const |
| `script.js` | 32 | `lower` | const |
| `script.js` | 33 | `type` | const |
| `script.js` | 37 | `POS` | const |
| `script.js` | 42 | `XY433` | const |
| `script.js` | 43 | `XY442` | const |
| `script.js` | 44 | `STATUS` | const |
| `script.js` | 45 | `KEY` | const |
| `script.js` | 48 | `state` | let |
| `script.js` | 51 | `changed` | let |
| `script.js` | 95 | `full1` | const |
| `script.js` | 96 | `full2` | const |
| `script.js` | 109 | `full1` | const |
| `script.js` | 110 | `full2` | const |
| `script.js` | 125 | `activeMatchId` | let |
| `script.js` | 126 | `chosenPositions` | let |
| `script.js` | 156 | `player` | const |
| `script.js` | 159 | `changed` | let |
| `script.js` | 172 | `match` | const |
| `script.js` | 196 | `m` | const |
| `script.js` | 202 | `team` | const |
| `script.js` | 226 | `h1` | const |
| `script.js` | 227 | `h2` | const |
| `script.js` | 232 | `st` | const |
| `script.js` | 241 | `p` | const |
| `script.js` | 242 | `matches` | const |
| `script.js` | 244 | `present` | let |
| `script.js` | 246 | `st` | const |
| `script.js` | 254 | `stored` | const |
| `script.js` | 255 | `minutes` | const |
| `script.js` | 256 | `possibleMinutes` | const |
| `script.js` | 257 | `minutesPct` | const |
| `script.js` | 258 | `attendancePct` | const |
| `script.js` | 260 | `historyRows` | const |
| `script.js` | 261 | `mins` | const |
| `script.js` | 262 | `status` | const |
| `script.js` | 271 | `sheet` | const |
| `script.js` | 343 | `w` | const |
| `script.js` | 364 | `lastTap` | let |
| `script.js` | 366 | `now` | const |
| `script.js` | 382 | `navP` | const |
| `script.js` | 383 | `navM` | const |
| `script.js` | 389 | `logoBtn` | const |
| `script.js` | 390 | `logoImg` | const |
| `script.js` | 391 | `logoPlaceholder` | const |
| `script.js` | 438 | `file` | const |
| `script.js` | 440 | `allowed` | const |
| `script.js` | 451 | `reader` | const |
| `script.js` | 465 | `prepared` | const |
| `script.js` | 468 | `resultFilled` | const |
| `script.js` | 469 | `dt` | const |
| `script.js` | 470 | `played` | const |
| `script.js` | 473 | `redClass` | const |
| `script.js` | 476 | `greenClass` | const |
| `script.js` | 480 | `orangeClass` | const |
| `script.js` | 499 | `openAction` | const |
| `script.js` | 500 | `id` | const |
| `script.js` | 523 | `prepared` | const |
| `script.js` | 525 | `resultFilled` | const |
| `script.js` | 526 | `dt` | const |
| `script.js` | 527 | `datePassed` | const |
| `script.js` | 542 | `key` | const |
| `script.js` | 547 | `s` | const |
| `script.js` | 557 | `id` | const |
| `script.js` | 558 | `status` | const |
| `script.js` | 570 | `editingMatchId` | let |
| `script.js` | 572 | `m` | const |
| `script.js` | 581 | `m` | const |
| `script.js` | 582 | `result` | const |
| `script.js` | 600 | `filterBtn` | const |
| `script.js` | 610 | `playedBtn` | const |
| `script.js` | 618 | `statsPlayer` | const |
| `script.js` | 622 | `id` | const |
| `script.js` | 627 | `playersPageBtn` | const |
| `script.js` | 631 | `id` | const |
| `script.js` | 639 | `back` | const |
| `script.js` | 648 | `note` | const |
| `script.js` | 650 | `match` | const |
| `script.js` | 655 | `editMatchSheetInfo` | const |
| `script.js` | 660 | `editMatchSheetResult` | const |
| `script.js` | 667 | `a` | const |
| `script.js` | 668 | `b` | const |
| `script.js` | 676 | `panels` | const |
| `script.js` | 681 | `panel` | const |
| `script.js` | 686 | `card` | const |
| `script.js` | 704 | `quickAdd` | const |
| `script.js` | 715 | `onField` | const |
| `script.js` | 724 | `goals` | const |
| `script.js` | 730 | `el` | const |
| `script.js` | 738 | `xy` | const |
| `script.js` | 741 | `p` | const |
| `script.js` | 744 | `tag` | const |
| `script.js` | 749 | `num` | const |
| `script.js` | 753 | `name` | const |
| `script.js` | 759 | `goalBalls` | const |
| `script.js` | 761 | `goals` | const |
| `script.js` | 772 | `el` | const |
| `script.js` | 774 | `ids` | const |
| `script.js` | 779 | `p` | const |
| `script.js` | 786 | `m` | const |
| `script.js` | 797 | `modal` | const |
| `script.js` | 803 | `modal` | const |
| `script.js` | 809 | `finishResultMatchId` | let |
| `script.js` | 812 | `finishSpecialStatus` | let |
| `script.js` | 821 | `scoreFields` | const |
| `script.js` | 824 | `scorerWrap` | const |
| `script.js` | 836 | `confirm` | const |
| `script.js` | 847 | `finishScorerDraft` | let |
| `script.js` | 850 | `result` | const |
| `script.js` | 852 | `home` | const |
| `script.js` | 857 | `q` | const |
| `script.js` | 860 | `exact` | const |
| `script.js` | 863 | `starts` | const |
| `script.js` | 868 | `list` | const |
| `script.js` | 878 | `box` | const |
| `script.js` | 882 | `p` | const |
| `script.js` | 883 | `value` | const |
| `script.js` | 898 | `idx` | const |
| `script.js` | 900 | `p` | const |
| `script.js` | 905 | `idx` | const |
| `script.js` | 906 | `p` | const |
| `script.js` | 916 | `homeScore` | const |
| `script.js` | 917 | `awayScore` | const |
| `script.js` | 922 | `match` | const |
| `script.js` | 925 | `ownGoals` | const |
| `script.js` | 926 | `current` | const |
| `script.js` | 935 | `resolved` | const |
| `script.js` | 936 | `entry` | const |
| `script.js` | 937 | `p` | const |
| `script.js` | 968 | `m` | const |
| `script.js` | 971 | `dt` | const |
| `script.js` | 983 | `team` | const |
| `script.js` | 984 | `homeTeam` | const |
| `script.js` | 985 | `awayTeam` | const |
| `script.js` | 990 | `hs` | let |
| `script.js` | 991 | `match` | const |
| `script.js` | 1001 | `modal` | const |
| `script.js` | 1008 | `modal` | const |
| `script.js` | 1014 | `m` | const |
| `script.js` | 1017 | `dt` | const |
| `script.js` | 1043 | `homeScore` | const |
| `script.js` | 1044 | `awayScore` | const |
| `script.js` | 1051 | `ownGoals` | const |
| `script.js` | 1052 | `scorerCheck` | const |
| `script.js` | 1077 | `navP` | const |
| `script.js` | 1078 | `navM` | const |
| `script.js` | 1082 | `wins` | let |
| `script.js` | 1085 | `result` | const |
| `script.js` | 1086 | `match` | const |
| `script.js` | 1088 | `a` | const |
| `script.js` | 1089 | `own` | const |
| `script.js` | 1090 | `opp` | const |
| `script.js` | 1096 | `points` | const |
| `script.js` | 1097 | `now` | const |
| `script.js` | 1099 | `renderCard` | const |
| `script.js` | 1100 | `s` | const |
| `script.js` | 1101 | `cardClass` | const |
| `script.js` | 1103 | `isPlayed` | const |
| `script.js` | 1135 | `futureMatches` | const |
| `script.js` | 1138 | `dt` | const |
| `script.js` | 1143 | `nextMatch` | const |
| `script.js` | 1144 | `upcoming` | const |
| `script.js` | 1146 | `playedMatches` | const |
| `script.js` | 1149 | `dt` | const |
| `script.js` | 1154 | `nextBox` | const |
| `script.js` | 1155 | `upcomingBox` | const |
| `script.js` | 1156 | `playedBox` | const |
| `script.js` | 1202 | `m` | const |
| `script.js` | 1208 | `editPlayerSelectedPositions` | let |
| `script.js` | 1211 | `box` | const |
| `script.js` | 1212 | `positionLabels` | const |
| `script.js` | 1236 | `n` | const |
| `script.js` | 1247 | `value` | const |
| `script.js` | 1248 | `input` | const |
| `script.js` | 1256 | `input` | const |
| `script.js` | 1264 | `editPlayerAbsenceDates` | let |
| `script.js` | 1271 | `box` | const |
| `script.js` | 1273 | `sorted` | const |
| `script.js` | 1312 | `p` | const |
| `script.js` | 1321 | `absenceInput` | const |
| `script.js` | 1325 | `saveBtn` | const |
| `script.js` | 1328 | `modal` | const |
| `script.js` | 1334 | `m` | const |
| `script.js` | 1337 | `p` | const |
| `script.js` | 1368 | `currentPlayerLevelFilter` | let |
| `script.js` | 1369 | `currentPlayerPositionFilter` | let |
| `script.js` | 1370 | `currentPlayerSort` | let |
| `script.js` | 1373 | `players` | const |
| `script.js` | 1374 | `levelOk` | const |
| `script.js` | 1375 | `positionOk` | const |
| `script.js` | 1380 | `firstPosition` | const |
| `script.js` | 1381 | `positions` | const |
| `script.js` | 1402 | `level` | const |
| `script.js` | 1403 | `position` | const |
| `script.js` | 1404 | `sort` | const |
| `script.js` | 1412 | `box` | const |
| `script.js` | 1418 | `visiblePlayers` | const |
| `script.js` | 1424 | `levelClass` | const |
| `script.js` | 1425 | `availabilityClass` | const |
| `script.js` | 1507 | `level` | const |
| `script.js` | 1508 | `pos` | const |
| `script.js` | 1509 | `sort` | const |
| `script.js` | 1520 | `card` | const |
| `script.js` | 1530 | `opponent` | const |
| `script.js` | 1531 | `date` | const |
| `script.js` | 1532 | `time` | const |
| `script.js` | 1535 | `availability` | const |
| `script.js` | 1552 | `pendingDeleteMatchId` | let |
| `script.js` | 1555 | `m` | const |
| `script.js` | 1560 | `modal` | const |
| `script.js` | 1567 | `modal` | const |
| `script.js` | 1574 | `id` | const |
| `script.js` | 1596 | `btn` | const |
| `script.js` | 1605 | `c` | const |
| `script.js` | 1607 | `st` | const |
| `script.js` | 1611 | `total` | const |
| `script.js` | 1612 | `present` | const |
| `script.js` | 1613 | `pct` | const |
| `script.js` | 1620 | `dt` | const |
| `script.js` | 1642 | `prepared` | const |
| `script.js` | 1644 | `resultFilled` | const |
| `script.js` | 1645 | `dt` | const |
| `script.js` | 1646 | `passed` | const |
| `script.js` | 1678 | `s` | const |
| `script.js` | 1684 | `currentMatchesFilter` | let |
| `script.js` | 1687 | `special` | const |
| `script.js` | 1690 | `dt` | const |
| `script.js` | 1703 | `box` | const |
| `script.js` | 1709 | `list` | let |
| `script.js` | 1723 | `s` | const |
| `script.js` | 1724 | `cardClass` | const |
| `script.js` | 1754 | `m` | const |
| `script.js` | 1759 | `m` | const |
| `script.js` | 1760 | `allowed` | const |
| `script.js` | 1762 | `btn` | const |
| `script.js` | 1770 | `m` | const |
| `script.js` | 1786 | `m` | const |
| `script.js` | 1787 | `s` | const |
| `script.js` | 1788 | `att` | const |
| `script.js` | 1834 | `finishPanel` | const |
| `script.js` | 1837 | `restoreCard` | const |
| `script.js` | 1838 | `restoreBtn` | const |
| `script.js` | 1848 | `m` | const |
| `script.js` | 1849 | `counts` | const |
| `script.js` | 1851 | `st` | const |
| `script.js` | 1854 | `totalPresent` | const |
| `script.js` | 1855 | `notFilled` | const |
| `script.js` | 1856 | `totalPlayers` | const |
| `script.js` | 1857 | `pct` | const |
| `script.js` | 1858 | `box` | const |
| `script.js` | 1877 | `m` | const |
| `script.js` | 1878 | `playable` | const |
| `script.js` | 1880 | `exactCounts` | const |
| `script.js` | 1881 | `pos` | let |
| `script.js` | 1885 | `groups` | const |
| `script.js` | 1891 | `groupLabels` | const |
| `script.js` | 1892 | `shortages` | const |
| `script.js` | 1895 | `low` | const |
| `script.js` | 1896 | `thin` | const |
| `script.js` | 1913 | `box` | const |
| `script.js` | 1938 | `box` | const |
| `script.js` | 1941 | `missing` | const |
| `script.js` | 1959 | `m` | const |
| `script.js` | 1963 | `todayKey` | const |
| `script.js` | 1964 | `d` | const |
| `script.js` | 1968 | `eyeIcon` | const |
| `script.js` | 1973 | `futureAbsenceCount` | const |
| `script.js` | 1975 | `row` | const |
| `script.js` | 1976 | `ownPlayer` | const |
| `script.js` | 1977 | `readonlyPlayer` | const |
| `script.js` | 1980 | `left` | const |
| `script.js` | 1989 | `dots` | const |
| `script.js` | 1993 | `b` | const |
| `script.js` | 1995 | `isSelected` | const |
| `script.js` | 2003 | `previousStatus` | const |
| `script.js` | 2006 | `labels` | const |
| `script.js` | 2007 | `current` | const |
| `script.js` | 2013 | `today` | const |
| `script.js` | 2014 | `tomorrow` | const |
| `script.js` | 2015 | `matchDay` | const |
| `script.js` | 2022 | `auth` | const |
| `script.js` | 2023 | `teamCode` | const |
| `script.js` | 2041 | `actions` | const |
| `script.js` | 2044 | `eye` | const |
| `script.js` | 2067 | `m` | const |
| `script.js` | 2076 | `v` | const |
| `script.js` | 2084 | `m` | const |
| `script.js` | 2088 | `minutes` | let |
| `script.js` | 2091 | `st` | const |
| `script.js` | 2108 | `arr` | const |
| `script.js` | 2108 | `p` | const |
| `script.js` | 2111 | `c` | let |
| `script.js` | 2112 | `s` | const |
| `script.js` | 2112 | `idx` | const |
| `script.js` | 2116 | `pp` | const |
| `script.js` | 2119 | `targetGroup` | const |
| `script.js` | 2120 | `sameGroup` | const |
| `script.js` | 2135 | `mins` | const |
| `script.js` | 2142 | `positions` | const |
| `script.js` | 2143 | `players` | const |
| `script.js` | 2144 | `N` | const |
| `script.js` | 2145 | `FULL` | const |
| `script.js` | 2146 | `NEG` | const |
| `script.js` | 2149 | `dp` | let |
| `script.js` | 2152 | `i` | let |
| `script.js` | 2153 | `p` | const |
| `script.js` | 2154 | `next` | const |
| `script.js` | 2156 | `mask` | let |
| `script.js` | 2157 | `sc` | let |
| `script.js` | 2158 | `cur` | const |
| `script.js` | 2161 | `posIdx` | let |
| `script.js` | 2163 | `pos` | const |
| `script.js` | 2164 | `score` | let |
| `script.js` | 2179 | `nmask` | const |
| `script.js` | 2180 | `nsc` | const |
| `script.js` | 2181 | `old` | const |
| `script.js` | 2199 | `best` | let |
| `script.js` | 2200 | `sc` | let |
| `script.js` | 2201 | `cand` | const |
| `script.js` | 2209 | `sc` | let |
| `script.js` | 2210 | `cand` | const |
| `script.js` | 2221 | `layers` | const |
| `script.js` | 2222 | `layer` | let |
| `script.js` | 2226 | `i` | let |
| `script.js` | 2227 | `p` | const |
| `script.js` | 2228 | `prev` | const |
| `script.js` | 2229 | `next` | const |
| `script.js` | 2231 | `mask` | let |
| `script.js` | 2232 | `sc` | let |
| `script.js` | 2233 | `cur` | const |
| `script.js` | 2236 | `posIdx` | let |
| `script.js` | 2238 | `pos` | const |
| `script.js` | 2239 | `score` | let |
| `script.js` | 2247 | `nmask` | const |
| `script.js` | 2248 | `nsc` | const |
| `script.js` | 2249 | `old` | const |
| `script.js` | 2263 | `finalSc` | let |
| `script.js` | 2264 | `finalState` | let |
| `script.js` | 2267 | `result` | const |
| `script.js` | 2268 | `mask` | let |
| `script.js` | 2270 | `i` | let |
| `script.js` | 2271 | `stateHere` | const |
| `script.js` | 2272 | `statePrevSame` | const |
| `script.js` | 2278 | `pidx` | const |
| `script.js` | 2279 | `p` | const |
| `script.js` | 2280 | `found` | let |
| `script.js` | 2282 | `posIdx` | let |
| `script.js` | 2284 | `prevMask` | const |
| `script.js` | 2285 | `prevSc` | const |
| `script.js` | 2288 | `prevState` | const |
| `script.js` | 2291 | `score` | let |
| `script.js` | 2316 | `m` | const |
| `script.js` | 2322 | `available` | const |
| `script.js` | 2328 | `level1` | const |
| `script.js` | 2329 | `level3` | const |
| `script.js` | 2332 | `orderedL3` | const |
| `script.js` | 2333 | `pref1` | const |
| `script.js` | 2337 | `forced` | const |
| `script.js` | 2349 | `l3First` | const |
| `script.js` | 2355 | `forbidSecond` | const |
| `script.js` | 2372 | `h1` | const |
| `script.js` | 2373 | `h2` | const |
| `script.js` | 2374 | `strong1` | const |
| `script.js` | 2375 | `strong2` | const |
| `script.js` | 2377 | `l3both` | const |
| `script.js` | 2383 | `offPos` | const |
| `script.js` | 2386 | `p` | const |
| `script.js` | 2393 | `exactCount` | const |
| `script.js` | 2394 | `p` | const |
| `script.js` | 2398 | `modeText` | let |
| `script.js` | 2424 | `positions` | const |
| `script.js` | 2428 | `group` | const |
| `script.js` | 2440 | `mins` | const |
| `script.js` | 2447 | `positions` | const |
| `script.js` | 2448 | `result` | const |
| `script.js` | 2449 | `used` | const |
| `script.js` | 2452 | `orderedPositions` | const |
| `script.js` | 2453 | `ca` | const |
| `script.js` | 2454 | `cb` | const |
| `script.js` | 2459 | `candidates` | const |
| `script.js` | 2465 | `best` | const |
| `script.js` | 2475 | `positions` | const |
| `script.js` | 2476 | `selected` | const |
| `script.js` | 2477 | `used` | const |
| `script.js` | 2480 | `scarcity` | const |
| `script.js` | 2485 | `item` | const |
| `script.js` | 2486 | `pos` | const |
| `script.js` | 2487 | `candidates` | const |
| `script.js` | 2490 | `score` | let |
| `script.js` | 2504 | `strongCount` | let |
| `script.js` | 2506 | `strongBench` | const |
| `script.js` | 2507 | `incoming` | const |
| `script.js` | 2510 | `bestSwap` | let |
| `script.js` | 2513 | `temp` | const |
| `script.js` | 2515 | `lineup` | const |
| `script.js` | 2516 | `fit` | let |
| `script.js` | 2518 | `pp` | const |
| `script.js` | 2536 | `el` | const |
| `script.js` | 2537 | `xy` | const |
| `script.js` | 2540 | `s` | const |
| `script.js` | 2549 | `p` | const |
| `script.js` | 2550 | `d` | const |
| `script.js` | 2563 | `m` | const |
| `script.js` | 2566 | `swapContext` | let |
| `script.js` | 2567 | `lastTap` | let |
| `script.js` | 2577 | `now` | const |
| `script.js` | 2578 | `pid` | const |
| `script.js` | 2591 | `m` | const |
| `script.js` | 2592 | `half` | const |
| `script.js` | 2593 | `lineup` | const |
| `script.js` | 2594 | `currentPlayer` | const |
| `script.js` | 2595 | `targetPos` | const |
| `script.js` | 2597 | `eligible` | const |
| `script.js` | 2616 | `box` | const |
| `script.js` | 2622 | `p` | const |
| `script.js` | 2623 | `row` | const |
| `script.js` | 2625 | `where` | const |
| `script.js` | 2627 | `btn` | const |
| `script.js` | 2636 | `modal` | const |
| `script.js` | 2643 | `m` | const |
| `script.js` | 2644 | `half` | const |
| `script.js` | 2645 | `lineup` | const |
| `script.js` | 2646 | `targetPos` | const |
| `script.js` | 2647 | `currentPid` | const |
| `script.js` | 2667 | `modal` | const |
| `script.js` | 2673 | `dragState` | let |
| `script.js` | 2677 | `m` | const |
| `script.js` | 2681 | `m` | const |
| `script.js` | 2686 | `formation` | const |
| `script.js` | 2691 | `rect` | const |
| `script.js` | 2692 | `x` | const |
| `script.js` | 2693 | `y` | const |
| `script.js` | 2694 | `xy` | const |
| `script.js` | 2695 | `best` | let |
| `script.js` | 2697 | `d` | const |
| `script.js` | 2709 | `slot` | const |
| `script.js` | 2714 | `rect` | const |
| `script.js` | 2727 | `m` | const |
| `script.js` | 2730 | `lineup` | const |
| `script.js` | 2731 | `sourceEntry` | const |
| `script.js` | 2732 | `sourcePos` | const |
| `script.js` | 2733 | `displaced` | const |
| `script.js` | 2734 | `pitch` | const |
| `script.js` | 2735 | `xy` | const |
| `script.js` | 2741 | `movingEl` | const |
| `script.js` | 2742 | `displacedEl` | const |
| `script.js` | 2786 | `finish` | const |
| `script.js` | 2788 | `moved` | const |
| `script.js` | 2789 | `swapped` | const |
| `script.js` | 2808 | `activePointerId` | let |
| `script.js` | 2810 | `move` | const |
| `script.js` | 2812 | `pitch` | const |
| `script.js` | 2815 | `rect` | const |
| `script.js` | 2816 | `inside` | const |
| `script.js` | 2819 | `pct` | const |
| `script.js` | 2824 | `pos` | const |
| `script.js` | 2833 | `end` | const |
| `script.js` | 2835 | `pitch` | const |
| `script.js` | 2836 | `targetPos` | const |
| `script.js` | 2837 | `half` | const |
| `script.js` | 2838 | `pid` | const |
| `script.js` | 2849 | `xy` | const |
| `script.js` | 2850 | `sourcePos` | const |
| `script.js` | 2864 | `cancel` | const |
| `script.js` | 2866 | `pitch` | const |
| `script.js` | 2867 | `xy` | const |
| `script.js` | 2868 | `sourcePos` | const |
| `script.js` | 2888 | `half` | const |
| `script.js` | 2889 | `pitch` | const |
| `script.js` | 2911 | `pointerId` | let |
| `script.js` | 2913 | `move` | const |
| `script.js` | 2915 | `pitch` | const |
| `script.js` | 2917 | `rect` | const |
| `script.js` | 2918 | `inside` | const |
| `script.js` | 2920 | `pos` | const |
| `script.js` | 2931 | `finish` | const |
| `script.js` | 2933 | `pitch` | const |
| `script.js` | 2934 | `targetPos` | const |
| `script.js` | 2935 | `half` | const |
| `script.js` | 2936 | `pid` | const |
| `script.js` | 2955 | `cancel` | const |
| `script.js` | 2956 | `pitch` | const |
| `script.js` | 2987 | `m` | const |
| `script.js` | 2988 | `src` | const |
| `script.js` | 2997 | `box` | const |
| `script.js` | 3008 | `m` | const |
| `script.js` | 3010 | `ids1` | const |
| `script.js` | 3011 | `ids2` | const |
| `script.js` | 3013 | `playable` | const |
| `script.js` | 3016 | `notSelected` | const |
| `script.js` | 3021 | `fullGame` | const |
| `script.js` | 3025 | `byLevel` | const |
| `script.js` | 3028 | `thresholds` | const |
| `script.js` | 3030 | `vals` | const |
| `script.js` | 3034 | `idx` | const |
| `script.js` | 3038 | `swapCandidates` | const |
| `script.js` | 3042 | `playerLine` | const |
| `script.js` | 3065 | `everyoneBtn` | const |
| `script.js` | 3071 | `m` | const |
| `script.js` | 3072 | `playable` | const |
| `script.js` | 3084 | `h1` | let |
| `script.js` | 3085 | `h2` | let |
| `script.js` | 3094 | `used` | const |
| `script.js` | 3095 | `missing` | const |
| `script.js` | 3105 | `other` | const |
| `script.js` | 3106 | `both` | const |
| `script.js` | 3110 | `candidates` | const |
| `script.js` | 3111 | `temp` | const |
| `script.js` | 3114 | `strong` | const |
| `script.js` | 3120 | `lu` | const |
| `script.js` | 3121 | `assigned` | const |
| `script.js` | 3124 | `exact` | let |
| `script.js` | 3126 | `p` | const |
| `script.js` | 3132 | `history` | const |
| `script.js` | 3133 | `levelPenalty` | const |
| `script.js` | 3140 | `incoming` | const |
| `script.js` | 3141 | `c1` | const |
| `script.js` | 3142 | `c2` | const |
| `script.js` | 3144 | `chosenHalf` | let |
| `script.js` | 3164 | `final1` | const |
| `script.js` | 3165 | `final2` | const |
| `script.js` | 3166 | `stillMissing` | const |
| `script.js` | 3168 | `msg` | const |
| `script.js` | 3179 | `m` | const |
| `script.js` | 3180 | `ids1` | const |
| `script.js` | 3181 | `selectable` | const |
| `script.js` | 3182 | `bench1` | const |
| `script.js` | 3183 | `bench2` | const |
| `script.js` | 3185 | `makeBench` | const |
| `script.js` | 3186 | `c` | const |
| `script.js` | 3190 | `chip` | const |
| `script.js` | 3212 | `m` | const |
| `script.js` | 3213 | `box` | const |
| `script.js` | 3215 | `renderHalf` | const |
| `script.js` | 3216 | `rows` | const |
| `script.js` | 3219 | `p` | const |
| `script.js` | 3231 | `_guardMatch` | const |
| `script.js` | 3237 | `m` | const |
| `script.js` | 3238 | `panel` | const |
| `script.js` | 3247 | `m` | const |
| `script.js` | 3250 | `result` | const |
| `script.js` | 3262 | `ids1` | const |
| `script.js` | 3265 | `st` | const |
| `script.js` | 3266 | `played` | const |
| `script.js` | 3284 | `ids1` | const |
| `script.js` | 3285 | `ids2` | const |
| `script.js` | 3288 | `st` | const |
| `script.js` | 3293 | `played` | const |
| `script.js` | 3306 | `matchId` | const |
| `script.js` | 3307 | `match` | const |
| `script.js` | 3346 | `banner` | const |
| `script.js` | 3348 | `passed` | const |
| `script.js` | 3363 | `wasFinal` | const |
| `script.js` | 3381 | `wins` | let |
| `script.js` | 3394 | `mt` | const |
| `script.js` | 3397 | `a` | const |
| `script.js` | 3412 | `fit` | let |
| `script.js` | 3415 | `st` | const |
| `script.js` | 3420 | `mins` | const |
| `script.js` | 3424 | `registered` | const |
| `script.js` | 3425 | `present` | const |
| `script.js` | 3435 | `btn` | const |
| `script.js` | 3436 | `original` | const |
| `script.js` | 3440 | `JsPDF` | const |
| `script.js` | 3441 | `doc` | const |
| `script.js` | 3442 | `rec` | const |
| `script.js` | 3443 | `players` | const |
| `script.js` | 3444 | `finalMatches` | const |
| `script.js` | 3448 | `club` | const |
| `script.js` | 3449 | `L` | const |
| `script.js` | 3450 | `y` | let |
| `script.js` | 3452 | `pageHeader` | const |
| `script.js` | 3457 | `section` | const |
| `script.js` | 3461 | `line` | const |
| `script.js` | 3478 | `cards` | const |
| `script.js` | 3482 | `cw` | const |
| `script.js` | 3484 | `col` | const |
| `script.js` | 3498 | `scorers` | const |
| `script.js` | 3501 | `text` | const |
| `script.js` | 3510 | `cols` | const |
| `script.js` | 3546 | `mins` | const |
| `script.js` | 3547 | `goals` | const |
| `script.js` | 3549 | `title` | const |
| `script.js` | 3559 | `scorers` | const |
| `script.js` | 3564 | `pages` | const |
| `script.js` | 3565 | `i` | let |
| `script.js` | 3584 | `rec` | const |
| `script.js` | 3593 | `rows` | const |
| `script.js` | 3594 | `minutes` | let |
| `script.js` | 3599 | `validResult` | const |
| `script.js` | 3602 | `st` | const |
| `script.js` | 3612 | `storedMatches` | const |
| `script.js` | 3615 | `storedAbsent` | const |
| `script.js` | 3619 | `attendancePct` | const |
| `script.js` | 3623 | `visibleRows` | const |
| `script.js` | 3627 | `maxMinutes` | const |
| `script.js` | 3628 | `playerStatsList` | const |
| `script.js` | 3636 | `eyeIcon` | const |
| `script.js` | 3688 | `counts` | const |
| `script.js` | 3696 | `player` | const |
| `script.js` | 3697 | `name` | const |
| `script.js` | 3698 | `totalGoals` | const |
| `script.js` | 3706 | `final` | const |
| `script.js` | 3707 | `label` | const |
| `script.js` | 3708 | `title` | const |
| `script.js` | 3749 | `target` | const |
| `script.js` | 3788 | `matches` | const |
| `script.js` | 3790 | `c` | const |
| `script.js` | 3790 | `st` | const |
| `script.js` | 3791 | `reg` | const |
| `script.js` | 3826 | `currentPlayerStatsId` | let |
| `script.js` | 3827 | `currentPlayerHistoryFilter` | let |
| `script.js` | 3838 | `p` | const |
| `script.js` | 3839 | `box` | const |
| `script.js` | 3841 | `history` | const |
| `script.js` | 3845 | `st` | const |
| `script.js` | 3846 | `mins` | const |
| `script.js` | 3858 | `filtered` | const |
| `script.js` | 3883 | `existing` | const |
| `script.js` | 3890 | `s` | const |
| `script.js` | 3911 | `p` | const |
| `script.js` | 3914 | `button` | const |
| `script.js` | 3915 | `originalHtml` | const |
| `script.js` | 3922 | `JsPDF` | const |
| `script.js` | 3923 | `doc` | const |
| `script.js` | 3925 | `totalGoals` | const |
| `script.js` | 3926 | `fit` | let |
| `script.js` | 3927 | `history` | const |
| `script.js` | 3934 | `st` | const |
| `script.js` | 3940 | `mins` | const |
| `script.js` | 3955 | `registered` | const |
| `script.js` | 3956 | `presentTotal` | const |
| `script.js` | 3957 | `pct` | const |
| `script.js` | 3959 | `left` | const |
| `script.js` | 3960 | `right` | const |
| `script.js` | 3961 | `width` | const |
| `script.js` | 3975 | `cards` | const |
| `script.js` | 3982 | `x` | let |
| `script.js` | 3983 | `y` | let |
| `script.js` | 3984 | `cardW` | const |
| `script.js` | 4003 | `attendance` | const |
| `script.js` | 4021 | `headers` | const |
| `script.js` | 4022 | `cols` | const |
| `script.js` | 4046 | `matchLines` | const |
| `script.js` | 4047 | `statusLines` | const |
| `script.js` | 4048 | `rowLines` | const |
| `script.js` | 4049 | `rowHeight` | const |
| `script.js` | 4067 | `filename` | const |
| `script.js` | 4088 | `p` | const |
| `script.js` | 4092 | `todayKey` | const |
| `script.js` | 4093 | `d` | const |
| `script.js` | 4094 | `y` | const |
| `script.js` | 4095 | `m` | const |
| `script.js` | 4096 | `day` | const |
| `script.js` | 4100 | `futureAbsenceDates` | const |
| `script.js` | 4104 | `totalGoals` | const |
| `script.js` | 4106 | `fit` | let |
| `script.js` | 4109 | `st` | const |
| `script.js` | 4114 | `mins` | const |
| `script.js` | 4119 | `registered` | const |
| `script.js` | 4120 | `presentTotal` | const |
| `script.js` | 4121 | `pct` | const |
| `script.js` | 4122 | `maxPossible` | const |
| `script.js` | 4123 | `minutesPct` | const |
| `script.js` | 4212 | `btn` | const |
| `script.js` | 4213 | `player` | const |
| `script.js` | 4219 | `deleted` | const |
| `script.js` | 4230 | `notice` | const |
| `script.js` | 4247 | `btn` | const |
| `script.js` | 4249 | `txt` | const |
| `script.js` | 4250 | `isFinalize` | const |
| `script.js` | 4255 | `m` | const |
| `script.js` | 4265 | `shareBtn` | const |
| `script.js` | 4266 | `shareText` | const |
| `script.js` | 4268 | `response` | const |
| `script.js` | 4269 | `blob` | const |
| `script.js` | 4270 | `file` | const |
| `script.js` | 4310 | `s` | const |
| `script.js` | 4319 | `btn` | const |
| `script.js` | 4323 | `node` | let |
| `script.js` | 4325 | `text` | const |
| `script.js` | 4326 | `hasField` | const |
| `script.js` | 4327 | `hasHalf` | const |
| `script.js` | 4344 | `pngBlob` | const |
| `script.js` | 4348 | `item` | const |
| `script.js` | 4354 | `target` | const |
| `script.js` | 4357 | `html2canvas` | const |
| `script.js` | 4360 | `controls` | const |
| `script.js` | 4361 | `old` | const |
| `script.js` | 4367 | `canvas` | const |
| `script.js` | 4376 | `blob` | const |
| `script.js` | 4381 | `original` | const |
| `script.js` | 4390 | `url` | const |
| `script.js` | 4391 | `a` | const |
| `script.js` | 4398 | `original` | const |
| `script.js` | 4408 | `btn` | const |
| `script.js` | 4418 | `card` | const |
| `script.js` | 4421 | `html2canvas` | const |
| `script.js` | 4424 | `controls` | const |
| `script.js` | 4425 | `previous` | const |
| `script.js` | 4431 | `canvas` | const |
| `script.js` | 4440 | `blob` | const |
| `script.js` | 4445 | `original` | const |
| `script.js` | 4454 | `url` | const |
| `script.js` | 4455 | `a` | const |
| `script.js` | 4462 | `original` | const |
| `script.js` | 4472 | `btn` | const |
| `script.js` | 4483 | `id` | const |
| `script.js` | 4484 | `name` | const |
| `script.js` | 4488 | `level` | const |
| `script.js` | 4489 | `preferredAvailability` | const |
| `script.js` | 4492 | `p` | const |
| `script.js` | 4493 | `oldDates` | const |
| `script.js` | 4503 | `p` | const |
| `script.js` | 4538 | `btn` | const |
| `script.js` | 4550 | `input` | const |
| `script.js` | 4551 | `date` | const |
| `script.js` | 4566 | `restorePreparedButton` | const |
| `script.js` | 4572 | `btn` | const |
| `script.js` | 4573 | `originalText` | const |
| `script.js` | 4578 | `ok` | const |
| `script.js` | 4594 | `AUTH_KEY` | const |
| `script.js` | 4596 | `ACCESS_MATRIX` | const |
| `script.js` | 4634 | `base` | const |
| `script.js` | 4640 | `lastLookedUpTeamCode` | let |
| `script.js` | 4641 | `lookupDebounceTimer` | let |
| `script.js` | 4644 | `codeInput` | const |
| `script.js` | 4645 | `block` | const |
| `script.js` | 4646 | `hint` | const |
| `script.js` | 4647 | `joinBtn` | const |
| `script.js` | 4648 | `select` | const |
| `script.js` | 4651 | `code` | const |
| `script.js` | 4681 | `fetchedData` | const |
| `script.js` | 4701 | `sel` | const |
| `script.js` | 4712 | `sel` | const |
| `script.js` | 4715 | `current` | const |
| `script.js` | 4736 | `el` | const |
| `script.js` | 4738 | `a` | const |
| `script.js` | 4751 | `el` | const |
| `script.js` | 4757 | `player` | const |
| `script.js` | 4769 | `a` | const |
| `script.js` | 4775 | `teamCode` | const |
| `script.js` | 4777 | `profileSection` | const |
| `script.js` | 4780 | `teamColorsSection` | const |
| `script.js` | 4787 | `player` | const |
| `script.js` | 4788 | `linked` | const |
| `script.js` | 4792 | `nameInput` | const |
| `script.js` | 4796 | `email` | const |
| `script.js` | 4799 | `a` | const |
| `script.js` | 4813 | `codeInput` | const |
| `script.js` | 4814 | `playerSelect` | const |
| `script.js` | 4827 | `codeInput` | const |
| `script.js` | 4828 | `select` | const |
| `script.js` | 4838 | `a` | const |
| `script.js` | 4844 | `codeInput` | const |
| `script.js` | 4845 | `playerSelect` | const |
| `script.js` | 4864 | `code` | const |
| `script.js` | 4865 | `playerId` | const |
| `script.js` | 4866 | `joinBtn` | const |
| `script.js` | 4882 | `fetched` | const |
| `script.js` | 4896 | `playerExists` | const |
| `script.js` | 4903 | `a` | const |
| `script.js` | 4915 | `linkedPlayer` | const |
| `script.js` | 4924 | `modal` | const |
| `script.js` | 4931 | `settingsCard` | const |
| `script.js` | 4947 | `shell` | const |
| `script.js` | 4958 | `coachOnly` | const |
| `script.js` | 4982 | `blocked` | const |
| `script.js` | 4995 | `a` | const |
| `script.js` | 4998 | `input` | const |
| `script.js` | 4999 | `newName` | const |
| `script.js` | 5005 | `duplicate` | const |
| `script.js` | 5014 | `player` | const |
| `script.js` | 5021 | `linked` | const |
| `script.js` | 5024 | `saved` | const |
| `script.js` | 5037 | `modal` | const |
| `script.js` | 5039 | `matchInfo` | const |
| `script.js` | 5041 | `opp` | const |
| `script.js` | 5042 | `dt` | const |
| `script.js` | 5048 | `modal` | const |
| `script.js` | 5062 | `modal` | const |
| `script.js` | 5063 | `title` | const |
| `script.js` | 5064 | `nameEl` | const |
| `script.js` | 5065 | `input` | const |
| `script.js` | 5066 | `copyBtn` | const |
| `script.js` | 5067 | `whatsappBtn` | const |
| `script.js` | 5076 | `link` | let |
| `script.js` | 5080 | `currentUrl` | const |
| `script.js` | 5086 | `text` | const |
| `script.js` | 5120 | `THEME_KEY` | const |
| `script.js` | 5123 | `dark` | const |
| `script.js` | 5125 | `sw` | const |
| `script.js` | 5130 | `saved` | const |
| `script.js` | 5135 | `theme` | const |
| `script.js` | 5145 | `input` | const |
| `script.js` | 5151 | `joinBtn` | const |
| `script.js` | 5152 | `code` | const |
| `script.js` | 5153 | `playerId` | const |
| `script.js` | 5162 | `nav` | const |
| `script.js` | 5165 | `ticking` | let |
| `script.js` | 5166 | `update` | const |
| `script.js` | 5171 | `onScroll` | const |
| `script.js` | 5184 | `paint` | const |
| `script.js` | 5186 | `min` | const |
| `script.js` | 5187 | `max` | const |
| `script.js` | 5188 | `val` | const |
| `script.js` | 5189 | `pct` | const |
| `script.js` | 5190 | `dark` | const |
| `script.js` | 5191 | `rest` | const |
| `script.js` | 5195 | `bind` | const |
| `script.js` | 5205 | `observer` | const |
| `script.js` | 5210 | `themeObserver` | const |
| `script.js` | 5218 | `currentAuth` | const |
| `script.js` | 5234 | `currentAuth` | const |
| `script.js` | 5252 | `c` | let |
| `script.js` | 5255 | `num` | const |
| `script.js` | 5264 | `rgb` | const |
| `script.js` | 5266 | `adjust` | const |
| `script.js` | 5267 | `r` | const |
| `script.js` | 5268 | `g` | const |
| `script.js` | 5269 | `b` | const |
| `script.js` | 5274 | `prim` | const |
| `script.js` | 5275 | `sec` | const |
| `script.js` | 5277 | `root` | const |
| `script.js` | 5278 | `rgbP` | const |
| `script.js` | 5279 | `rgbS` | const |
| `script.js` | 5310 | `dot` | const |
| `script.js` | 5317 | `prim` | const |
| `script.js` | 5318 | `sec` | const |
| `script.js` | 5328 | `settingsModal` | const |
| `script.js` | 5331 | `modal` | const |
| `script.js` | 5333 | `prim` | const |
| `script.js` | 5334 | `sec` | const |
| `script.js` | 5336 | `primInput` | const |
| `script.js` | 5337 | `primHex` | const |
| `script.js` | 5338 | `secInput` | const |
| `script.js` | 5339 | `secHex` | const |
| `script.js` | 5351 | `modal` | const |
| `script.js` | 5356 | `btn` | const |
| `script.js` | 5357 | `pill` | const |
| `script.js` | 5363 | `rgb` | const |
| `script.js` | 5370 | `isMatch` | const |
| `script.js` | 5386 | `p` | const |
| `script.js` | 5387 | `s` | const |
| `script.js` | 5388 | `primInput` | const |
| `script.js` | 5389 | `primHex` | const |
| `script.js` | 5390 | `secInput` | const |
| `script.js` | 5391 | `secHex` | const |
| `script.js` | 5404 | `hex` | const |
| `script.js` | 5405 | `hexInput` | const |
| `script.js` | 5407 | `sec` | const |
| `script.js` | 5412 | `hex` | let |
| `script.js` | 5415 | `picker` | const |
| `script.js` | 5417 | `sec` | const |
| `script.js` | 5423 | `hex` | const |
| `script.js` | 5424 | `hexInput` | const |
| `script.js` | 5426 | `prim` | const |
| `script.js` | 5431 | `hex` | let |
| `script.js` | 5434 | `picker` | const |
| `script.js` | 5436 | `prim` | const |
| `script.js` | 5443 | `prim` | const |
| `script.js` | 5444 | `sec` | const |
| `script.js` | 5456 | `p` | const |
| `script.js` | 5457 | `s` | const |
| `script.js` | 5458 | `primInput` | const |
| `script.js` | 5459 | `primHex` | const |
| `script.js` | 5460 | `secInput` | const |
| `script.js` | 5461 | `secHex` | const |
| `auth.js` | 23 | `firebaseConfig` | const |
| `auth.js` | 33 | `app` | const |
| `auth.js` | 34 | `auth` | const |
| `auth.js` | 35 | `db` | const |
| `auth.js` | 37 | `googleProvider` | const |
| `auth.js` | 40 | `currentUser` | let |
| `auth.js` | 41 | `unsubscribeFirestore` | let |
| `auth.js` | 42 | `unsubscribeTeamListener` | let |
| `auth.js` | 43 | `unsubscribePlayersListener` | let |
| `auth.js` | 44 | `unsubscribeNotificationsListener` | let |
| `auth.js` | 45 | `isApplyingCloudUpdate` | let |
| `auth.js` | 46 | `cloudSyncTimeout` | let |
| `auth.js` | 47 | `currentTeamCode` | let |
| `auth.js` | 48 | `currentPendingInvite` | let |
| `auth.js` | 49 | `shownNotificationIds` | const |
| `auth.js` | 57 | `el` | let |
| `auth.js` | 64 | `toast` | const |
| `auth.js` | 77 | `userAvatar` | const |
| `auth.js` | 78 | `settingsEmail` | const |
| `auth.js` | 79 | `cloudBadge` | const |
| `auth.js` | 80 | `cloudText` | const |
| `auth.js` | 99 | `state` | const |
| `auth.js` | 100 | `teamCode` | const |
| `auth.js` | 101 | `teamName` | const |
| `auth.js` | 104 | `token` | const |
| `auth.js` | 107 | `inviteDocRef` | const |
| `auth.js` | 120 | `player` | const |
| `auth.js` | 128 | `currentUrl` | const |
| `auth.js` | 129 | `inviteUrl` | const |
| `auth.js` | 139 | `params` | const |
| `auth.js` | 140 | `inviteToken` | const |
| `auth.js` | 144 | `inviteDocRef` | const |
| `auth.js` | 145 | `snap` | const |
| `auth.js` | 152 | `inviteData` | const |
| `auth.js` | 156 | `shell` | const |
| `auth.js` | 161 | `el` | const |
| `auth.js` | 165 | `inviteStep` | const |
| `auth.js` | 186 | `inviteDocRef` | const |
| `auth.js` | 196 | `playerDocRef` | const |
| `auth.js` | 205 | `userDocRef` | const |
| `auth.js` | 206 | `authData` | const |
| `auth.js` | 248 | `tc` | const |
| `auth.js` | 250 | `teamDocRef` | const |
| `auth.js` | 251 | `snap` | const |
| `auth.js` | 254 | `teamData` | const |
| `auth.js` | 255 | `coachState` | const |
| `auth.js` | 259 | `playersSnap` | const |
| `auth.js` | 261 | `pData` | const |
| `auth.js` | 262 | `pid` | const |
| `auth.js` | 263 | `player` | const |
| `auth.js` | 271 | `match` | const |
| `auth.js` | 314 | `teamDocRef` | const |
| `auth.js` | 318 | `snapData` | const |
| `auth.js` | 319 | `coachState` | const |
| `auth.js` | 330 | `playersColRef` | const |
| `auth.js` | 335 | `pData` | const |
| `auth.js` | 336 | `pid` | const |
| `auth.js` | 344 | `notifColRef` | const |
| `auth.js` | 346 | `authData` | const |
| `auth.js` | 350 | `notif` | const |
| `auth.js` | 351 | `notifId` | const |
| `auth.js` | 356 | `matchDate` | const |
| `auth.js` | 357 | `formattedDate` | const |
| `auth.js` | 360 | `msg` | const |
| `auth.js` | 371 | `notifId` | const |
| `auth.js` | 372 | `notifRef` | const |
| `auth.js` | 397 | `linked` | const |
| `auth.js` | 402 | `userDocRef` | const |
| `auth.js` | 403 | `docSnap` | const |
| `auth.js` | 406 | `data` | const |
| `auth.js` | 416 | `cloudAuth` | const |
| `auth.js` | 437 | `localState` | const |
| `auth.js` | 438 | `localAuth` | const |
| `auth.js` | 462 | `snapData` | const |
| `auth.js` | 481 | `authData` | const |
| `auth.js` | 482 | `teamCode` | const |
| `auth.js` | 486 | `pid` | const |
| `auth.js` | 487 | `playerObj` | const |
| `auth.js` | 488 | `matchAvailability` | const |
| `auth.js` | 495 | `playerDocRef` | const |
| `auth.js` | 510 | `teamDocRef` | const |
| `auth.js` | 519 | `userDocRef` | const |
| `auth.js` | 542 | `teamCode` | const |
| `auth.js` | 546 | `userDocRef` | const |
| `auth.js` | 562 | `result` | const |
| `auth.js` | 573 | `result` | const |
| `auth.js` | 576 | `msg` | let |
| `auth.js` | 589 | `result` | const |
| `auth.js` | 592 | `msg` | let |
| `auth.js` | 635 | `regStep` | const |
| `auth.js` | 638 | `playerName` | const |
| `auth.js` | 639 | `nameEl` | const |
| `auth.js` | 659 | `email` | const |
| `auth.js` | 660 | `pass` | const |
| `auth.js` | 661 | `passConfirm` | const |
| `auth.js` | 680 | `email` | const |
| `auth.js` | 681 | `pass` | const |
| `auth.js` | 687 | `email` | const |
| `auth.js` | 688 | `pass` | const |
| `sw.js` | 1 | `CACHE` | const |
| `sw.js` | 2 | `SHELL` | const |
| `sw.js` | 12 | `request` | const |
| `sw.js` | 14 | `url` | const |
| `sw.js` | 18 | `copy` | const |
| `sw.js` | 24 | `copy` | const |
| `sw.js` | 32 | `copy` | const |

## B. Benoemde functiedeclaraties (automatische index)

> Aanvulling op het functionele overzicht hierboven. Inline arrow callbacks, objectmethoden en anonieme functies zijn niet allemaal benoemde functiedeclaraties.

| Bestand | Regel | Functie |
|---|---:|---|
| `script.js` | 2 | `showToast` |
| `script.js` | 50 | `migrateCoachBoardData` |
| `script.js` | 128 | `defaultState` |
| `script.js` | 129 | `loadState` |
| `script.js` | 130 | `saveState` |
| `script.js` | 140 | `getCoachBoardState` |
| `script.js` | 141 | `setCoachBoardState` |
| `script.js` | 154 | `mergePlayerUpdate` |
| `script.js` | 193 | `uid` |
| `script.js` | 194 | `formatDateNL` |
| `script.js` | 200 | `esc` |
| `script.js` | 201 | `fullMatchTitle` |
| `script.js` | 209 | `show` |
| `script.js` | 218 | `matchCountsAsFinalStatistics` |
| `script.js` | 224 | `playerMatchMinutes` |
| `script.js` | 231 | `playerStatusLabel` |
| `script.js` | 240 | `generatePlayerPdf` |
| `script.js` | 353 | `bindPlayerPdfDoubleClick` |
| `script.js` | 380 | `renderAll` |
| `script.js` | 381 | `renderHeader` |
| `script.js` | 464 | `matchStepFields` |
| `script.js` | 495 | `bindMatchStepFields` |
| `script.js` | 522 | `getHomeMatchStatus` |
| `script.js` | 541 | `homeStatusCardClass` |
| `script.js` | 546 | `homeStatusButton` |
| `script.js` | 551 | `bindHomeStatusButtons` |
| `script.js` | 571 | `openEditMatch` |
| `script.js` | 579 | `closeEditMatch` |
| `script.js` | 580 | `saveEditedMatch` |
| `script.js` | 672 | `activateHomeMatchTab` |
| `script.js` | 684 | `openQuickAddMatch` |
| `script.js` | 694 | `bindHomeMatchTabs` |
| `script.js` | 714 | `getLineupBenchIds` |
| `script.js` | 723 | `playerGoalBallsForLineup` |
| `script.js` | 729 | `renderPreviewPitch` |
| `script.js` | 771 | `renderPreviewBench` |
| `script.js` | 785 | `openLineupPreview` |
| `script.js` | 802 | `closeLineupPreview` |
| `script.js` | 814 | `setFinishSpecialStatus` |
| `script.js` | 849 | `ownTeamScoreForMatch` |
| `script.js` | 856 | `resolvePlayerByName` |
| `script.js` | 867 | `refreshFinishPlayerSuggestions` |
| `script.js` | 877 | `renderFinishScorerRows` |
| `script.js` | 915 | `getOwnTeamGoalsFromInputs` |
| `script.js` | 921 | `syncFinishScorerFieldsToScore` |
| `script.js` | 934 | `getValidatedScorers` |
| `script.js` | 957 | `playerGoalsInMatch` |
| `script.js` | 962 | `totalPlayerGoals` |
| `script.js` | 966 | `openFinishResultModal` |
| `script.js` | 1006 | `closeFinishResultModal` |
| `script.js` | 1013 | `confirmFinishResult` |
| `script.js` | 1076 | `renderHome` |
| `script.js` | 1210 | `renderEditPlayerPositions` |
| `script.js` | 1246 | `setPlayerLevel` |
| `script.js` | 1255 | `setPreferredAvailabilityStatus` |
| `script.js` | 1266 | `formatAbsenceDateNL` |
| `script.js` | 1270 | `renderPlayerAbsenceDates` |
| `script.js` | 1288 | `playerAbsentOnDate` |
| `script.js` | 1292 | `syncPlayerAbsenceToUnpreparedMatches` |
| `script.js` | 1310 | `openPlayerEditor` |
| `script.js` | 1333 | `openPlayerEdit` |
| `script.js` | 1334 | `closePlayerEdit` |
| `script.js` | 1335 | `editPlayer` |
| `script.js` | 1336 | `deletePlayer` |
| `script.js` | 1372 | `filteredPlayers` |
| `script.js` | 1401 | `syncPlayerFilterIconStates` |
| `script.js` | 1410 | `renderPlayers` |
| `script.js` | 1554 | `deleteMatch` |
| `script.js` | 1565 | `closeDeleteMatchModal` |
| `script.js` | 1572 | `confirmDeleteMatch` |
| `script.js` | 1604 | `matchAttendanceStats` |
| `script.js` | 1618 | `matchHasStarted` |
| `script.js` | 1624 | `matchMayFinalize` |
| `script.js` | 1629 | `countsForStatistics` |
| `script.js` | 1634 | `matchResultDisplay` |
| `script.js` | 1641 | `compactStatusInfo` |
| `script.js` | 1662 | `compactBulletsHtml` |
| `script.js` | 1677 | `openCompactStatus` |
| `script.js` | 1686 | `isActuallyPlayedMatch` |
| `script.js` | 1694 | `setMatchesFilter` |
| `script.js` | 1702 | `renderMatches` |
| `script.js` | 1757 | `openMatch` |
| `script.js` | 1785 | `renderMatchDetail` |
| `script.js` | 1847 | `renderAvailabilitySummary` |
| `script.js` | 1876 | `renderCoverageAdvice` |
| `script.js` | 1937 | `renderMissingAvailabilitySummary` |
| `script.js` | 1958 | `renderAvailability` |
| `script.js` | 2075 | `updateModeHelp` |
| `script.js` | 2087 | `fairPolicyMinutes` |
| `script.js` | 2102 | `orderPlayers` |
| `script.js` | 2107 | `fillForHalf` |
| `script.js` | 2110 | `enforceMinStrong` |
| `script.js` | 2115 | `exactFitScore` |
| `script.js` | 2131 | `proposalScore` |
| `script.js` | 2141 | `optimizeLineup` |
| `script.js` | 2310 | `lineupPlayers` |
| `script.js` | 2315 | `generateLineups` |
| `script.js` | 2410 | `formationPositions` |
| `script.js` | 2412 | `lineGroup` |
| `script.js` | 2419 | `playerCanCoverGroup` |
| `script.js` | 2423 | `positionFitScore` |
| `script.js` | 2439 | `modePlayerScore` |
| `script.js` | 2446 | `assignPositions` |
| `script.js` | 2474 | `buildBalancedHalf` |
| `script.js` | 2535 | `drawPitch` |
| `script.js` | 2563 | `drawLineups` |
| `script.js` | 2569 | `attachSwapTrigger` |
| `script.js` | 2590 | `openSwapChooser` |
| `script.js` | 2641 | `performQuickSwap` |
| `script.js` | 2665 | `closeSwapChooser` |
| `script.js` | 2675 | `getPitchHalfFromId` |
| `script.js` | 2676 | `currentLineup` |
| `script.js` | 2680 | `setCurrentLineup` |
| `script.js` | 2685 | `lineupXY` |
| `script.js` | 2690 | `findNearestPosition` |
| `script.js` | 2703 | `clearDropTarget` |
| `script.js` | 2707 | `showDropTarget` |
| `script.js` | 2713 | `pointerPercentInPitch` |
| `script.js` | 2721 | `persistLineupAfterAnimation` |
| `script.js` | 2726 | `animateMovePlayerToPosition` |
| `script.js` | 2805 | `attachDrag` |
| `script.js` | 2908 | `attachBenchDrag` |
| `script.js` | 2986 | `restoreGenerated` |
| `script.js` | 2996 | `renderSelectionOverview` |
| `script.js` | 3069 | `adjustEveryonePlays` |
| `script.js` | 3103 | `halfScoreForReplacement` |
| `script.js` | 3178 | `renderBench` |
| `script.js` | 3211 | `renderFinalLineupSummary` |
| `script.js` | 3230 | `openFinishPanel` |
| `script.js` | 3276 | `rebuildStoredPlayerStats` |
| `script.js` | 3305 | `restorePreparedMatch` |
| `script.js` | 3360 | `rollbackMatchFromStatistics` |
| `script.js` | 3380 | `getSeasonRecord` |
| `script.js` | 3410 | `seasonBookPlayerRows` |
| `script.js` | 3434 | `downloadSeasonBookPdf` |
| `script.js` | 3583 | `renderStats` |
| `script.js` | 3683 | `showStatsMain` |
| `script.js` | 3687 | `matchScorerSummary` |
| `script.js` | 3705 | `resultScoreButtonHtml` |
| `script.js` | 3723 | `playerSheetPersonIcon` |
| `script.js` | 3731 | `matchStatsHistogramIcon` |
| `script.js` | 3739 | `statsEyeIcon` |
| `script.js` | 3746 | `openSingleMatchStats` |
| `script.js` | 3757 | `embeddedStatsLineups` |
| `script.js` | 3780 | `renderEmbeddedStatsLineups` |
| `script.js` | 3787 | `showPlayedStats` |
| `script.js` | 3829 | `playerStatusClassKey` |
| `script.js` | 3837 | `renderPlayerHistory` |
| `script.js` | 3879 | `ensureJsPdf` |
| `script.js` | 3902 | `safePdfFileName` |
| `script.js` | 3910 | `downloadPlayerStatsPdf` |
| `script.js` | 4087 | `showPlayerStats` |
| `script.js` | 4264 | `shareLineupToWhatsApp` |
| `script.js` | 4307 | `ensureHtml2Canvas` |
| `script.js` | 4318 | `findHalfCaptureElement` |
| `script.js` | 4337 | `writePngBlobToClipboard` |
| `script.js` | 4352 | `copyHalfAsImage` |
| `script.js` | 4416 | `copyPreviewHalfAsImage` |
| `script.js` | 4617 | `currentAuth` |
| `script.js` | 4620 | `isCoachRole` |
| `script.js` | 4623 | `isPlayerRole` |
| `script.js` | 4626 | `currentPlayerId` |
| `script.js` | 4629 | `canManageTeam` |
| `script.js` | 4632 | `ensureTeamCode` |
| `script.js` | 4643 | `updatePlayerTeamCodeState` |
| `script.js` | 4700 | `selPopulateWithList` |
| `script.js` | 4711 | `populatePlayerIdentitySelect` |
| `script.js` | 4720 | `authGet` |
| `script.js` | 4721 | `authSave` |
| `script.js` | 4727 | `getCoachBoardAuth` |
| `script.js` | 4728 | `setCoachBoardAuth` |
| `script.js` | 4735 | `authCode` |
| `script.js` | 4736 | `authStep` |
| `script.js` | 4737 | `authApply` |
| `script.js` | 4768 | `settingsUpdate` |
| `script.js` | 4970 | `scrubLevelInfoForPlayer` |
| `script.js` | 5036 | `showLastMinuteAbsencePopup` |
| `script.js` | 5047 | `closeLastMinuteAbsencePopup` |
| `script.js` | 5061 | `openPlayerInviteModal` |
| `script.js` | 5122 | `applyCoachBoardTheme` |
| `script.js` | 5129 | `loadCoachBoardTheme` |
| `script.js` | 5217 | `onFirebaseAuthSuccess` |
| `script.js` | 5233 | `onFirebaseAuthNeedsRole` |
| `script.js` | 5250 | `hexToRgb` |
| `script.js` | 5263 | `adjustHex` |
| `script.js` | 5273 | `applyTeamColors` |
| `script.js` | 5316 | `initTeamColors` |
| `script.js` | 5326 | `openTeamColorsModal` |
| `script.js` | 5350 | `closeTeamColorsModal` |
| `script.js` | 5355 | `updateColorPreview` |
| `auth.js` | 52 | `notifyToast` |
| `auth.js` | 76 | `updateAuthUI` |
| `auth.js` | 98 | `createPlayerInvite` |
| `auth.js` | 138 | `checkInviteFromUrl` |
| `auth.js` | 179 | `linkAccountToInvite` |
| `auth.js` | 246 | `fetchTeamDataByCode` |
| `auth.js` | 296 | `listenToTeamUpdates` |
| `auth.js` | 368 | `writeLastMinuteAbsenceNotification` |
| `auth.js` | 391 | `initUserFirestoreData` |
| `auth.js` | 476 | `syncStateToCloud` |
| `auth.js` | 541 | `syncAuthToCloud` |
| `auth.js` | 560 | `handleGoogleSignIn` |
| `auth.js` | 571 | `handleEmailSignIn` |
| `auth.js` | 587 | `handleEmailRegister` |
| `auth.js` | 603 | `handleFirebaseLogout` |

## C. Alle gedefinieerde CSS-custom-properties

> Regels verwijzen naar `style.css`. Eén variabele kan meerdere definities hebben (bijvoorbeeld per thema of mediaquery). De waarden kunnen contextafhankelijk zijn.

| Variabele | Definitieregels | Aantal definities |
|---|---|---:|
| `--bg` | 16, 3840 | 2 |
| `--black` | 17 | 1 |
| `--blob-1` | 6 | 1 |
| `--blob-2` | 7 | 1 |
| `--blob-3` | 8 | 1 |
| `--blob-sec-1` | 9 | 1 |
| `--blob-sec-2` | 10 | 1 |
| `--blob-sec-3` | 11 | 1 |
| `--border` | 17, 3844 | 2 |
| `--card` | 16, 3841 | 2 |
| `--danger` | 17 | 1 |
| `--green` | 17 | 1 |
| `--muted` | 17, 3843 | 2 |
| `--orange` | 17 | 1 |
| `--primary-color` | 2 | 1 |
| `--primary-dark` | 3 | 1 |
| `--primary-soft` | 4 | 1 |
| `--red` | 13, 3845 | 2 |
| `--red-dark` | 14, 3847 | 2 |
| `--red-soft` | 15, 3846 | 2 |
| `--secondary-color` | 5 | 1 |
| `--text` | 16, 3842 | 2 |

Aantal custom-property-definities: **30**; unieke namen: **22**; gebruikslocaties via `var(...)`: **128**.

Variabelen met een `var()`-gebruik maar zonder definitie in `style.css` (kunnen inline of via fallbacks bestaan): `--primary-soft-dark`, `--primary-dark-dark`, `--blob-dark-sec-1`, `--blob-dark-sec-2`, `--blob-dark-sec-3`, `--blob-dark-1`, `--blob-dark-2`, `--blob-dark-3`.


## D. Alle expliciete HTML-ID's

> Uit `index.html`; dynamisch in JavaScript aangemaakte ID's vallen buiten deze HTML-index.

| ID | Regel |
|---|---:|
| `toastStack` | 16 |
| `authShell` | 23 |
| `loginStep` | 29 |
| `googleLoginBtn` | 34 |
| `emailLoginForm` | 46 |
| `loginEmail` | 48 |
| `loginPassword` | 51 |
| `emailLoginBtn` | 53 |
| `showRegisterBtn` | 54 |
| `registerStep` | 58 |
| `emailRegisterForm` | 63 |
| `registerEmail` | 65 |
| `registerPassword` | 68 |
| `submitRegisterBtn` | 70 |
| `backToLoginFromRegBtn` | 71 |
| `inviteStep` | 75 |
| `inviteWelcomeTitle` | 77 |
| `inviteWelcomeSubtitle` | 78 |
| `inviteTeamName` | 84 |
| `invitePlayerName` | 88 |
| `inviteGoogleBtn` | 93 |
| `inviteShowEmailBtn` | 104 |
| `inviteAlreadyAccountBtn` | 110 |
| `inviteEmailRegisterStep` | 116 |
| `inviteEmailPlayerName` | 119 |
| `inviteEmailRegisterForm` | 121 |
| `inviteRegEmail` | 123 |
| `inviteRegPassword` | 126 |
| `inviteRegPasswordConfirm` | 129 |
| `inviteEmailSubmitBtn` | 131 |
| `inviteBackToChoiceBtn` | 132 |
| `clubLogoButton` | 141 |
| `clubLogoImage` | 142 |
| `clubLogoPlaceholder` | 143 |
| `clubLogoInput` | 145 |
| `teamNameHead` | 147 |
| `editTeamNameBtn` | 148 |
| `teamEditPanel` | 151 |
| `teamNameInput` | 152 |
| `changeClubLogo` | 154 |
| `removeClubLogo` | 155 |
| `saveTeam` | 158 |
| `cancelTeamEdit` | 159 |
| `openSettingsBtn` | 163 |
| `navPlayersCount` | 178 |
| `navMatchesCount` | 179 |
| `home` | 183 |
| `homeQuickAddMatch` | 190 |
| `homeNextPanel` | 193 |
| `homeNextMatch` | 195 |
| `homeUpcomingPanel` | 198 |
| `homeUpcomingMatches` | 200 |
| `homePlayedPanel` | 203 |
| `homePlayedMatches` | 205 |
| `players` | 209 |
| `togglePlayerAdd` | 212 |
| `playerSort` | 216 |
| `playerLevelFilter` | 221 |
| `playerPositionFilter` | 228 |
| `resetPlayerFilters` | 243 |
| `playerDeleteSuccess` | 246 |
| `playerList` | 247 |
| `matches` | 250 |
| `toggleMatchAdd` | 253 |
| `restoreSuccessBanner` | 261 |
| `matchList` | 262 |
| `matchAddCard` | 264 |
| `matchOpponent` | 269 |
| `matchType` | 273 |
| `matchDate` | 281 |
| `matchTime` | 285 |
| `matchHomeAway` | 289 |
| `addMatch` | 292 |
| `stats` | 297 |
| `statsMainView` | 298 |
| `downloadSeasonBook` | 303 |
| `openPlayedStats` | 310 |
| `statsMatches` | 312 |
| `statsWins` | 316 |
| `statsDraws` | 316 |
| `statsLosses` | 316 |
| `statsPoints` | 318 |
| `statsGoalsFor` | 321 |
| `statsGoalsAgainst` | 321 |
| `statsPlayerList` | 328 |
| `playedStatsView` | 331 |
| `playedStatsList` | 334 |
| `playerStatsView` | 336 |
| `playerStatsDetail` | 338 |
| `matchDetail` | 342 |
| `backToMatches` | 343 |
| `matchHeader` | 344 |
| `clearAvailability` | 349 |
| `availabilitySummary` | 351 |
| `availabilityList` | 358 |
| `availabilityMissingSummary` | 359 |
| `coverageAdvice` | 360 |
| `formation` | 365 |
| `minStrong` | 367 |
| `proposalMode` | 370 |
| `modeHelp` | 374 |
| `generateLineups` | 375 |
| `lineupMsg` | 378 |
| `restore1` | 386 |
| `pitch1` | 390 |
| `bench1` | 392 |
| `restore2` | 398 |
| `pitch2` | 402 |
| `shareLineupWhatsApp` | 402 |
| `bench2` | 407 |
| `selectionOverview` | 410 |
| `legacyFinishCard` | 413 |
| `openFinishPanel` | 416 |
| `finishPanel` | 418 |
| `finalResult` | 422 |
| `finalLineupSummary` | 427 |
| `finishMatch` | 429 |
| `restorePreparedCard` | 433 |
| `restorePreparedBtn` | 434 |
| `swapModal` | 442 |
| `swapInfo` | 447 |
| `closeSwap` | 449 |
| `swapOptions` | 451 |
| `editMatchModal` | 455 |
| `editOpponent` | 459 |
| `editDate` | 460 |
| `editTime` | 461 |
| `editMatchType` | 462 |
| `editHomeAway` | 463 |
| `editResult` | 464 |
| `cancelEditMatch` | 466 |
| `saveEditMatch` | 466 |
| `deleteModal` | 469 |
| `deleteMatchText` | 472 |
| `cancelDeleteMatch` | 474 |
| `confirmDeleteMatch` | 475 |
| `lineupPreviewModal` | 480 |
| `lineupPreviewMatchTitle` | 485 |
| `closeLineupPreview` | 487 |
| `previewPitch1` | 496 |
| `previewBench1` | 497 |
| `previewPitch2` | 505 |
| `previewBench2` | 506 |
| `finishResultModal` | 512 |
| `finishResultMatchTitle` | 515 |
| `finishSpecialOptions` | 522 |
| `finishScoreFields` | 535 |
| `finishHomeLabel` | 537 |
| `finishHomeScore` | 538 |
| `finishAwayLabel` | 542 |
| `finishAwayScore` | 543 |
| `finishScorersWrap` | 547 |
| `finishScorerRows` | 554 |
| `finishPlayerSuggestions` | 555 |
| `cancelFinishResult` | 559 |
| `confirmFinishResult` | 560 |
| `playerEditModal` | 566 |
| `closePlayerEdit` | 567 |
| `editPlayerId` | 568 |
| `editPlayerName` | 569 |
| `editPlayerLevel` | 571 |
| `editPlayerLevelButtons` | 572 |
| `editPlayerPositions` | 577 |
| `editPlayerPreferredAvailability` | 579 |
| `editPlayerPreferredAvailabilityButtons` | 580 |
| `editPlayerAbsenceDate` | 590 |
| `addPlayerAbsenceDate` | 591 |
| `editPlayerAbsenceDates` | 593 |
| `cancelPlayerEdit` | 596 |
| `savePlayerEdit` | 596 |
| `settingsModal` | 598 |
| `closeSettingsBtn` | 600 |
| `userAvatar` | 604 |
| `settingsEmail` | 606 |
| `settingsRoleText` | 608 |
| `cloudStatusBadge` | 609 |
| `cloudStatusText` | 611 |
| `themeSettingsSection` | 617 |
| `themeSwitch` | 624 |
| `coachTeamColorsSection` | 642 |
| `openTeamColorsBtn` | 648 |
| `teamColorsPreviewDot` | 649 |
| `playerTeamCodeSection` | 654 |
| `settingsLinkedPlayer` | 656 |
| `playerProfileSettingsSection` | 658 |
| `settingsPlayerName` | 663 |
| `savePlayerNameBtn` | 664 |
| `settingsNameSaved` | 666 |
| `logoutBtn` | 669 |
| `playerInviteModal` | 674 |
| `inviteModalTitle` | 677 |
| `closeInviteModalBtn` | 678 |
| `inviteModalPlayerName` | 682 |
| `inviteGeneratedLink` | 686 |
| `copyInviteLinkBtn` | 687 |
| `whatsappInviteBtn` | 690 |
| `lastMinuteAbsenceModal` | 697 |
| `lastMinuteMatchInfo` | 701 |
| `lastMinuteUnderstoodBtn` | 706 |
| `teamColorsModal` | 713 |
| `closeTeamColorsModalBtn` | 717 |
| `teamColorPresets` | 726 |
| `primaryColorInput` | 775 |
| `primaryColorHex` | 776 |
| `secondaryColorInput` | 784 |
| `secondaryColorHex` | 785 |
| `colorPreviewPrimaryBtn` | 794 |
| `colorPreviewPill` | 796 |
| `resetTeamColorsBtn` | 801 |
| `saveTeamColorsBtn` | 802 |

Totaal: **210** ID-attributen, **210** unieke namen.

## E. Grenzen van deze inventaris en controles
- De tabellen A–D zijn rechtstreeks uit de bronbestanden gegenereerd op basis van de vastgelegde versie van `main`. Ze vormen een **reproduceerbare bronregel-index**, geen formele JavaScript- of CSS-parser.
- **Niet automatisch afgedekt:** parameters, destructuring-bindings, object-properties, dynamische DOM-ID's, CSS-variabelen die alleen in HTML/JS staan, JavaScript-scopes, alle selector-specifieke cascades en runtime gegenereerde data.
- Voor een volledig *semantisch* register zijn AST-parsing, CSS-parsing, data-schema-extractie en een runtime-testomgeving noodzakelijk. Zonder die stappen zou een claim van 100% dekking misleidend zijn.
- Na codewijzigingen kunnen regelnummers verouderd zijn. Herhaal de inventarisatie en valideer de koppelingen.
- De tabellen bevatten mogelijk declaraties in strings/commentaar bij complexe éénregelige constructies; verifieer verdachte hits in de bron.
- **Dataminimalisatie:** registreer geen gebruikersgegevens, tokens, wachtwoorden of andere secrets in dit document.

## F. Extra bronlocaties
| Bron | Kerninstelling | Locatie |
|---|---|---|
| `sw.js` | `CACHE`, `SHELL` | Regels 1–2 |
| `firestore.rules` | Regels voor invites, teams, players, notifications, users | Hele bestand |
| `manifest.webmanifest` | Gekoppeld vanuit `index.html` | Manifest |
| `manifest.json` | Alternatief aanwezig manifest | Manifest |

**Updateprocedure:** controleer na iedere refactor opnieuw `script.js`, `auth.js`, `style.css`, `index.html`, `firestore.rules` en `sw.js`.
