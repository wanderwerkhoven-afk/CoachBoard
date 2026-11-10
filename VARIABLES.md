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
