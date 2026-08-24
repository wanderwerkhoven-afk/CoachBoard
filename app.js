const POS={
1:'Doel',2:'Rechtsback',3:'Centrale verdediger',4:'Centrale verdediger',5:'Linker verdediger',
6:'Centrale middenvelder',7:'Rechter middenvelder',8:'Linker middenvelder',
9:'Rechter aanvaller',10:'Centrale middenvelder/aanvaller',11:'Linker aanvaller'
};
const XY433={1:[50,82],2:[82,58],3:[61,62],4:[39,62],5:[18,58],6:[50,44],7:[78,40],8:[22,40],9:[76,20],10:[50,27],11:[24,20]};
const XY442={1:[50,82],2:[82,58],3:[61,62],4:[39,62],5:[18,58],6:[39,42],7:[78,42],8:[22,42],9:[61,20],10:[61,42],11:[39,20]};
const STATUS={fit:['g','Aanwezig en fit'],limited:['o','Halve wedstrijd'],noPlay:['r','Aanwezig, niet spelend'],absent:['k','Afwezig']};
const KEY='coachboard_v1_state';


let state=loadState();

function migrateCoachBoardData(){
  let changed=false;
  if(state.clubLogo===undefined){state.clubLogo='';changed=true;}

  state.players.forEach(p=>{
    if(!p.preferredAvailability){
      p.preferredAvailability='fit';
      changed=true;
    }
    if(!Array.isArray(p.absenceDates)){
      p.absenceDates=[];
      changed=true;
    }
  });

  // Level 3 staat bij nog niet voorbereide wedstrijden standaard op halve wedstrijd.
  state.matches.forEach(m=>{
    if(m.prepared || m.completed)return;
    if(!m.availability)m.availability={};

    state.players.forEach(p=>{
      if(p.level!==3)return;
      if(playerAbsentOnDate(p,m.date)){
        m.availability[p.id]='absent';
        changed=true;
        return;
      }
      // Alleen oude/default groene status omzetten; expliciete andere statussen laten we staan.
      if(m.availability[p.id]===undefined || m.availability[p.id]==='fit'){
        m.availability[p.id]='limited';
        changed=true;
      }
    });
  });

  // 1. Bestaande voorbereide wedstrijden uit oudere versies herkennen.
  state.matches.forEach(m=>{
    if(!Array.isArray(m.scorers)){
      m.scorers=[];
      changed=true;
    }
  });

  state.matches.forEach(m=>{
    const full1=Object.keys(m.lineup1||{}).length===11;
    const full2=Object.keys(m.lineup2||{}).length===11;

    if(m.prepared!==true && full1 && full2 && m.completed!==true){
      m.prepared=true;
      changed=true;
    }
  });

  // 2. Bestaande wedstrijden blijven ongewijzigd; verwijderde wedstrijden worden niet opnieuw toegevoegd.

  // 3. Purmersteijn expliciet als voorbereid markeren wanneer er al twee volledige opstellingen zijn.
  state.matches.forEach(m=>{
    if((m.opponent||'').toLowerCase().includes('purmersteijn')){
      const full1=Object.keys(m.lineup1||{}).length===11;
      const full2=Object.keys(m.lineup2||{}).length===11;
      if(full1 && full2 && m.prepared!==true && m.completed!==true){
        m.prepared=true;
        changed=true;
      }
    }
  });

  if(changed){
    localStorage.setItem(KEY,JSON.stringify(state));
  }
}

migrateCoachBoardData();

let activeMatchId=null;
let chosenPositions=new Set();

function defaultState(){return {"teamName": "FC Voorbeeld", "players": [{"id": "p_demo_1", "name": "Lars", "level": 1, "positions": [1], "stats": {"minutes": 630, "matches": 9, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_2", "name": "Sem", "level": 1, "positions": [2, 3], "stats": {"minutes": 630, "matches": 9, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_3", "name": "Daan", "level": 2, "positions": [3, 4], "stats": {"minutes": 525, "matches": 8, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_4", "name": "Milan", "level": 2, "positions": [4, 5], "stats": {"minutes": 490, "matches": 8, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_5", "name": "Jesse", "level": 3, "positions": [2, 5], "stats": {"minutes": 315, "matches": 7, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_6", "name": "Noah", "level": 1, "positions": [6, 10], "stats": {"minutes": 630, "matches": 9, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_7", "name": "Finn", "level": 2, "positions": [6, 7], "stats": {"minutes": 455, "matches": 8, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_8", "name": "Lucas", "level": 2, "positions": [6, 8], "stats": {"minutes": 420, "matches": 8, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_9", "name": "Mees", "level": 1, "positions": [9, 10], "stats": {"minutes": 630, "matches": 9, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_10", "name": "Sam", "level": 2, "positions": [9, 11], "stats": {"minutes": 490, "matches": 8, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_11", "name": "Bram", "level": 3, "positions": [10, 11], "stats": {"minutes": 280, "matches": 7, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_12", "name": "Thijs", "level": 3, "positions": [7, 8], "stats": {"minutes": 245, "matches": 6, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_13", "name": "Jens", "level": 2, "positions": [2, 7], "stats": {"minutes": 385, "matches": 7, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_14", "name": "Noud", "level": 3, "positions": [3, 4], "stats": {"minutes": 280, "matches": 7, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_15", "name": "Timo", "level": 2, "positions": [10, 11], "stats": {"minutes": 420, "matches": 8, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_16", "name": "Sven", "level": 2, "positions": [2, 5], "stats": {"minutes": 350, "matches": 7, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_17", "name": "Mats", "level": 3, "positions": [6, 8], "stats": {"minutes": 210, "matches": 6, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_18", "name": "Olivier", "level": 1, "positions": [3, 4], "stats": {"minutes": 560, "matches": 8, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_19", "name": "Jayden", "level": 2, "positions": [9, 10], "stats": {"minutes": 375, "matches": 7, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}, {"id": "p_demo_20", "name": "Ruben", "level": 3, "positions": [7, 11], "stats": {"minutes": 175, "matches": 5, "fit": 6, "limited": 1, "noPlay": 0, "absent": 1, "fullMatches": 0, "halfMatches": 0}}], "matches": [{"id": "m_demo_1", "opponent": "SV Westfrisia", "date": "2026-08-29", "time": "14:30", "homeAway": "Thuis", "result": "", "formation": "4-3-3", "minStrong": 8, "mode": "standard", "availability": {"p_demo_1": "fit", "p_demo_2": "fit", "p_demo_3": "fit", "p_demo_4": "fit", "p_demo_5": "fit", "p_demo_6": "fit", "p_demo_7": "fit", "p_demo_8": "fit", "p_demo_9": "fit", "p_demo_10": "fit", "p_demo_11": "limited", "p_demo_12": "fit", "p_demo_13": "fit", "p_demo_14": "noPlay", "p_demo_15": "absent", "p_demo_16": "fit", "p_demo_17": "fit", "p_demo_18": "fit", "p_demo_19": "fit", "p_demo_20": "fit"}, "lineup1": {}, "lineup2": {}, "completed": false}, {"id": "m_demo_andijk_20260815", "opponent": "Andijk", "date": "2026-08-15", "time": "14:30", "homeAway": "Thuis", "result": "", "formation": "4-3-3", "minStrong": 8, "mode": "standard", "availability": {"p_demo_1": "fit", "p_demo_2": "fit", "p_demo_3": "fit", "p_demo_4": "fit", "p_demo_5": "fit", "p_demo_6": "fit", "p_demo_7": "fit", "p_demo_8": "fit", "p_demo_9": "fit", "p_demo_10": "fit", "p_demo_11": "limited", "p_demo_12": "fit", "p_demo_13": "fit", "p_demo_14": "noPlay", "p_demo_15": "absent", "p_demo_16": "fit", "p_demo_17": "fit", "p_demo_18": "fit", "p_demo_19": "fit", "p_demo_20": "fit"}, "lineup1": {"1": "p_demo_1", "2": "p_demo_2", "3": "p_demo_3", "4": "p_demo_4", "5": "p_demo_5", "6": "p_demo_6", "7": "p_demo_7", "8": "p_demo_8", "9": "p_demo_9", "10": "p_demo_10", "11": "p_demo_11"}, "lineup2": {"1": "p_demo_1", "2": "p_demo_2", "3": "p_demo_3", "4": "p_demo_4", "5": "p_demo_5", "6": "p_demo_6", "7": "p_demo_7", "8": "p_demo_8", "9": "p_demo_9", "10": "p_demo_10", "11": "p_demo_11"}, "generatedLineup1": {"1": "p_demo_1", "2": "p_demo_2", "3": "p_demo_3", "4": "p_demo_4", "5": "p_demo_5", "6": "p_demo_6", "7": "p_demo_7", "8": "p_demo_8", "9": "p_demo_9", "10": "p_demo_10", "11": "p_demo_11"}, "generatedLineup2": {"1": "p_demo_1", "2": "p_demo_2", "3": "p_demo_3", "4": "p_demo_4", "5": "p_demo_5", "6": "p_demo_6", "7": "p_demo_7", "8": "p_demo_8", "9": "p_demo_9", "10": "p_demo_10", "11": "p_demo_11"}, "prepared": true, "completed": false}]}}
function loadState(){try{return JSON.parse(localStorage.getItem(KEY))||defaultState()}catch(e){return defaultState()}}
function saveState(){
  localStorage.setItem(KEY,JSON.stringify(state));
  renderAll();
  if(typeof window.syncStateToCloud === 'function'){
    window.syncStateToCloud(state);
  }
}

window.getCoachBoardState = function(){
  return state;
};

window.setCoachBoardState = function(newState){
  if(!newState) return;
  state = newState;
  localStorage.setItem(KEY, JSON.stringify(state));
  migrateCoachBoardData();
  renderAll();
};
function uid(prefix){return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)}
function formatDateNL(value){
  if(!value)return '—';
  const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[3]}-${m[2]}-${m[1]}`:value;
}

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fullMatchTitle(m){
  const team=state.teamName||'Mijn Team';
  return m.homeAway==='Uit'
    ? `${m.opponent} - ${team}`
    : `${team} - ${m.opponent}`;
}

document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.screen)));
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.screen===id));
  if(id==='stats'){showStatsMain();renderStats()};
}




function matchCountsAsFinalStatistics(match){
  if(!match || match.completed!==true)return false;
  if(!countsForStatistics(match))return false;
  return /^\s*\d+\s*[-–:]\s*\d+\s*$/.test((match.result||'').trim());
}

function playerMatchMinutes(match,playerId){
  if(!matchCountsAsFinalStatistics(match))return 0;
  const h1=Object.values(match.lineup1||{}).includes(playerId);
  const h2=Object.values(match.lineup2||{}).includes(playerId);
  return (h1?35:0)+(h2?35:0);
}

function playerStatusLabel(match,playerId){
  const st=match.availability?.[playerId];
  if(st==='fit')return 'Aanwezig en fit';
  if(st==='limited')return 'Halve wedstrijd';
  if(st==='noPlay')return 'Aanwezig, niet spelend';
  if(st==='absent')return 'Afwezig';
  return 'Niet geregistreerd';
}

function generatePlayerPdf(playerId){
  const p=state.players.find(x=>x.id===playerId);if(!p)return;
  const matches=[...state.matches].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

  let present=0,registered=0,reconstructedMinutes=0;
  matches.forEach(m=>{
    const st=m.availability?.[p.id];
    if(st){
      registered++;
      if(st!=='absent')present++;
    }
    reconstructedMinutes+=playerMatchMinutes(m,p.id);
  });

  const stored=p.stats?.minutes||0;
  const minutes=Math.max(stored,reconstructedMinutes);
  const possibleMinutes=registered*70;
  const minutesPct=possibleMinutes?Math.round(minutes/possibleMinutes*100):0;
  const attendancePct=registered?Math.round(present/registered*100):0;

  const historyRows=matches.map(m=>{
    const mins=playerMatchMinutes(m,p.id);
    const status=playerStatusLabel(m,p.id);
    return `<tr>
      <td>${esc(m.date||'-')}</td>
      <td>${esc(fullMatchTitle(m))}</td>
      <td>${esc(status)}</td>
      <td style="text-align:right">${mins} min</td>
    </tr>`;
  }).join('');

  const sheet=`<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CoachBoard - ${esc(p.name)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#171717;margin:28px}
  h1{margin:0;color:#c62828;font-size:22px}
  h2{font-size:17px;margin:22px 0 8px}
  .sub{color:#6b7280;margin-top:4px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
  .card{border:1px solid #ddd;border-radius:12px;padding:12px}
  .value{font-size:22px;font-weight:800}
  .bar{height:9px;background:#eee;border-radius:999px;overflow:hidden;margin-top:7px}
  .fill{height:100%;background:#c62828}
  .fill.green{background:#22c55e}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
  th,td{padding:7px;border-bottom:1px solid #eee;text-align:left}
  th{color:#6b7280}
  .no-print{margin-bottom:18px}
  button{background:#c62828;color:white;border:0;border-radius:10px;padding:10px 14px;font-size:15px}
  @media print{.no-print{display:none}body{margin:10mm}.card{break-inside:avoid}}
</style>
</head>
<body>
<div class="no-print"><button onclick="window.print()">Bewaar / deel als PDF</button></div>
<h1>CoachBoard - Spelersstatistiek</h1>
<div style="font-size:20px;font-weight:800;margin-top:8px">${esc(p.name)}</div>
<div class="sub">Niveau ${p.level} · posities ${(p.positions||[]).join(', ')||'-'}</div>

<div class="grid">
  <div class="card">
    <div class="sub">Speelminuten</div>
    <div class="value">${minutes} min</div>
    <div>${minutesPct}% van maximaal geregistreerde speeltijd</div>
    <div class="bar"><div class="fill" style="width:${Math.min(100,minutesPct)}%"></div></div>
  </div>
  <div class="card">
    <div class="sub">Aanwezigheid</div>
    <div class="value">${present}/${registered}</div>
    <div>${attendancePct}% aanwezig</div>
    <div class="bar"><div class="fill green" style="width:${attendancePct}%"></div></div>
  </div>
</div>

<h2>Samenvatting</h2>
<table>
<tr><td>Totale speelminuten</td><td style="text-align:right"><b>${minutes}</b></td></tr>
<tr><td>Gespeelde wedstrijden</td><td style="text-align:right"><b>${p.stats?.matches||0}</b></td></tr>
<tr><td>Hele wedstrijden</td><td style="text-align:right"><b>${p.stats?.fullMatches||0}</b></td></tr>
<tr><td>Halve wedstrijden</td><td style="text-align:right"><b>${p.stats?.halfMatches||0}</b></td></tr>
<tr><td>Aanwezig en fit</td><td style="text-align:right"><b>${p.stats?.fit||0}</b></td></tr>
<tr><td>Halve wedstrijd-status</td><td style="text-align:right"><b>${p.stats?.limited||0}</b></td></tr>
<tr><td>Aanwezig, niet spelend</td><td style="text-align:right"><b>${p.stats?.noPlay||0}</b></td></tr>
<tr><td>Afwezig</td><td style="text-align:right"><b>${p.stats?.absent||0}</b></td></tr>
</table>

<h2>Wedstrijdhistorie</h2>
<table>
<thead><tr><th>Datum</th><th>Wedstrijd</th><th>Status</th><th style="text-align:right">Minuten</th></tr></thead>
<tbody>${historyRows||'<tr><td colspan="4">Nog geen wedstrijden geregistreerd.</td></tr>'}</tbody>
</table>

<script>
  setTimeout(()=>window.print(),350);
<\/script>
</body>
</html>`;

  const w=window.open('','_blank');
  if(!w){
    alert('De PDF-weergave kon niet openen. Sta pop-ups toe voor CoachBoard.');
    return;
  }
  w.document.open();
  w.document.write(sheet);
  w.document.close();
}

function bindPlayerPdfDoubleClick(){
  document.querySelectorAll('[data-player-pdf]').forEach(el=>{
    if(el.dataset.pdfBound==='1')return;
    el.dataset.pdfBound='1';

    el.addEventListener('dblclick',e=>{
      e.preventDefault();
      e.stopPropagation();
      generatePlayerPdf(el.dataset.playerPdf);
    });

    let lastTap=0;
    el.addEventListener('pointerup',e=>{
      const now=Date.now();
      if(now-lastTap<420){
        e.preventDefault();
        e.stopPropagation();
        generatePlayerPdf(el.dataset.playerPdf);
        lastTap=0;
      }else{
        lastTap=now;
      }
    });
  });
}


function renderAll(){renderHeader();renderHome();renderPlayers();renderMatches();if(document.getElementById('stats').classList.contains('on'))renderStats();}
function renderHeader(){
  const navP=document.getElementById('navPlayersCount');
  const navM=document.getElementById('navMatchesCount');
  if(navP)navP.textContent=state.players.length;
  if(navM)navM.textContent=state.matches.length;
  document.getElementById('teamNameHead').textContent=state.teamName||'Mijn Team';
  document.getElementById('teamNameInput').value=state.teamName||'';

  const logoBtn=document.getElementById('clubLogoButton');
  const logoImg=document.getElementById('clubLogoImage');
  const logoPlaceholder=document.getElementById('clubLogoPlaceholder');
  if(state.clubLogo){
    logoImg.src=state.clubLogo;
    logoImg.hidden=false;
    logoPlaceholder.hidden=true;
    logoBtn.classList.add('has-logo');
  }else{
    logoImg.removeAttribute('src');
    logoImg.hidden=true;
    logoPlaceholder.hidden=false;
    logoBtn.classList.remove('has-logo');
  }
}
document.getElementById('saveTeam').addEventListener('click',()=>{
  state.teamName=document.getElementById('teamNameInput').value.trim()||'Mijn Team';
  saveState();
  document.getElementById('teamEditPanel').classList.remove('on');
});
document.getElementById('editTeamNameBtn').addEventListener('click',()=>{
  document.getElementById('teamNameInput').value=state.teamName||'';
  document.getElementById('teamEditPanel').classList.toggle('on');
});
document.getElementById('cancelTeamEdit').addEventListener('click',()=>{
  document.getElementById('teamEditPanel').classList.remove('on');
});

document.getElementById('clubLogoButton')?.addEventListener('click',()=>document.getElementById('clubLogoInput')?.click());
document.getElementById('changeClubLogo')?.addEventListener('click',()=>document.getElementById('clubLogoInput')?.click());
document.getElementById('removeClubLogo')?.addEventListener('click',()=>{
  state.clubLogo='';
  saveState();
  renderHeader();
});
document.getElementById('clubLogoInput')?.addEventListener('change',e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  const allowed=['image/png','image/jpeg','image/webp','image/svg+xml'];
  if(!allowed.includes(file.type)){
    alert('Gebruik een PNG, JPG, WEBP of SVG-bestand.');
    e.target.value='';
    return;
  }
  if(file.size>2.5*1024*1024){
    alert('Kies bij voorkeur een logo kleiner dan 2,5 MB.');
    e.target.value='';
    return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    state.clubLogo=String(reader.result||'');
    saveState();
    renderHeader();
    e.target.value='';
  };
  reader.readAsDataURL(file);
});



function matchStepFields(m){
  const prepared=m.prepared===true ||
    (Object.keys(m.lineup1||{}).length===11 && Object.keys(m.lineup2||{}).length===11);

  const resultFilled=Boolean((m.result||'').trim());
  const dt=m.date?new Date(`${m.date}T${m.time||'00:00'}`):null;
  const played=Boolean(dt && dt<=new Date());

  // 1. Nog voorbereiden
  const redClass=prepared?'red-soft':'red-full';

  // 2. Voorbereid
  const greenClass=prepared?'green-full':'green-soft';

  // 3. Uitslag toevoegen
  // Alleen inhoudelijk actief zodra de wedstrijd gespeeld is.
  const orangeClass=resultFilled?'orange-soft':'orange-full';

  return `<div class="match-steps">
    <button class="match-step ${redClass}" data-step="sheet" data-match-id="${m.id}">
      Nog voorbereiden
    </button>
    <button class="match-step ${greenClass}" data-step="sheet" data-match-id="${m.id}">
      Voorbereid
    </button>
    <button class="match-step ${orangeClass}${played?'':' inactive'}" data-step="${resultFilled?'sheet':'result'}" data-match-id="${m.id}" data-played="${played?'1':'0'}">
      Uitslag toevoegen
    </button>
  </div>`;
}

function bindMatchStepFields(container){
  if(!container)return;

  container.querySelectorAll('[data-step]').forEach(el=>{
    const openAction=()=>{
      const id=el.dataset.matchId;
      if(el.dataset.step==='result'){
        if(el.dataset.played!=='1'){
          alert('De wedstrijd is nog niet gespeeld. De uitslag kan na de wedstrijddatum worden ingevuld.');
          return;
        }
        openMatch(id);
        setTimeout(openFinishPanel,0);
      }else{
        openMatch(id);
      }
    };

    el.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      openAction();
    });
  });
}


function getHomeMatchStatus(m){
  const prepared=m.prepared===true ||
    (Object.keys(m.lineup1||{}).length===11 && Object.keys(m.lineup2||{}).length===11);
  const resultFilled=Boolean((m.result||'').trim());
  const dt=m.date?new Date(`${m.date}T${m.time||'00:00'}`):null;
  const datePassed=Boolean(dt && dt<=new Date());

  if(m.completed===true && resultFilled){
    return {key:'final',label:'Gespeeld / Def.',cls:'home-status-green'};
  }
  if(datePassed && !resultFilled){
    return {key:'result',label:'Uitslag invullen',cls:'home-status-yellow'};
  }
  if(prepared){
    return {key:'prepared',label:'Voorbereid',cls:'home-status-orange'};
  }
  return {key:'prepare',label:'Nog voor te bereiden',cls:'home-status-red'};
}

function homeStatusCardClass(m){
  const key=getHomeMatchStatus(m).key;
  return `home-card-${key}`;
}

function homeStatusButton(m){
  const s=getHomeMatchStatus(m);
  return `<button class="home-status-btn ${s.cls}" data-home-status="${s.key}" data-match-id="${m.id}">${s.label}</button>`;
}

function bindHomeStatusButtons(container){
  if(!container)return;
  container.querySelectorAll('[data-home-status]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const id=btn.dataset.matchId;
      const status=btn.dataset.homeStatus;

      openMatch(id);

      // Uitslag invullen opent direct de afrond-/uitslagsectie.
      if(status==='result')setTimeout(openFinishPanel,0);
      // Alle overige statussen openen het wedstrijdblad ter voorbereiding/inzage.
    });
  });
}


let editingMatchId=null;
function openEditMatch(id,resultOnly=false){
 const m=state.matches.find(x=>x.id===id); if(!m)return;
 editingMatchId=id;
 editOpponent.value=m.opponent||''; editDate.value=m.date||''; editTime.value=m.time||'';
 editHomeAway.value=m.homeAway||'Thuis'; editResult.value=m.result||'';
 editMatchModal.classList.add('on');
 setTimeout(()=>document.getElementById(resultOnly?'editResult':'editOpponent').focus(),30);
}
function closeEditMatch(){editingMatchId=null;editMatchModal.classList.remove('on')}
function saveEditedMatch(){
 const m=state.matches.find(x=>x.id===editingMatchId); if(!m)return;
 const result=editResult.value.trim();
 if(!editOpponent.value.trim()||!editDate.value||!editTime.value){alert('Vul tegenstander, datum en aanvangstijd in.');return}
 if(result&&!/^\d+\s*[-–:]\s*\d+$/.test(result)){alert('Gebruik voor de uitslag bijvoorbeeld 3-1.');return}
 m.opponent=editOpponent.value.trim();m.date=editDate.value;m.time=editTime.value;m.homeAway=editHomeAway.value;m.result=result;
 localStorage.setItem(KEY,JSON.stringify(state));
 closeEditMatch();



renderAll();
bindHomeMatchTabs();if(activeMatchId===m.id)renderMatchDetail();
}
cancelEditMatch.addEventListener('click',closeEditMatch);saveEditMatch.addEventListener('click',saveEditedMatch);
editMatchModal.addEventListener('click',e=>{if(e.target===editMatchModal)closeEditMatch()});

// Centrale navigatie naar statistiek-/spelerbladen.

document.addEventListener('click',e=>{
  const filterBtn=e.target.closest('[data-player-filter]');
  if(!filterBtn)return;
  e.preventDefault();
  e.stopPropagation();
  if(!currentPlayerStatsId)return;
  currentPlayerHistoryFilter=filterBtn.dataset.playerFilter;
  renderPlayerHistory(currentPlayerStatsId,currentPlayerHistoryFilter);
});

document.addEventListener('click',e=>{
  const playedBtn=e.target.closest('#openPlayedStats');
  if(playedBtn){
    e.preventDefault();
    e.stopPropagation();
    showPlayedStats();
    return;
  }

  const statsPlayer=e.target.closest('[data-player-stats]');
  if(statsPlayer){
    e.preventDefault();
    e.stopPropagation();
    const id=statsPlayer.dataset.playerStats;
    if(id)showPlayerStats(id);
    return;
  }

  const playersPageBtn=e.target.closest('[data-player-open]');
  if(playersPageBtn){
    e.preventDefault();
    e.stopPropagation();
    const id=playersPageBtn.dataset.playerOpen;
    if(!id)return;
    show('stats');
    renderStats();
    showPlayerStats(id);
    return;
  }

  const back=e.target.closest('[data-stats-back]');
  if(back){
    e.preventDefault();
    e.stopPropagation();
    showStatsMain();
  }
});

document.addEventListener('change',e=>{
  const note=e.target.closest('[data-match-note]');
  if(!note)return;
  const match=state.matches.find(x=>x.id===note.dataset.matchNote);
  if(!match)return;
  match.notes=note.value;
  localStorage.setItem(KEY,JSON.stringify(state));
});
const editMatchSheetInfo=document.getElementById('editMatchSheetInfo');
if(editMatchSheetInfo)editMatchSheetInfo.addEventListener('click',e=>{
  e.preventDefault();e.stopPropagation();
  if(activeMatchId)openEditMatch(activeMatchId,false);
});
const editMatchSheetResult=document.getElementById('editMatchSheetResult');
if(editMatchSheetResult)editMatchSheetResult.addEventListener('click',e=>{
  e.preventDefault();e.stopPropagation();
  if(activeMatchId)openEditMatch(activeMatchId,true);
});

document.addEventListener('click',e=>{
 const a=e.target.closest('[data-edit-match]'); if(a){e.preventDefault();e.stopPropagation();openEditMatch(a.dataset.editMatch);return}
 const b=e.target.closest('[data-edit-result]'); if(b){e.preventDefault();e.stopPropagation();openEditMatch(b.dataset.editResult,true)}
});


function activateHomeMatchTab(key){
  document.querySelectorAll('[data-home-tab]').forEach(tab=>
    tab.classList.toggle('on',tab.dataset.homeTab===key)
  );
  const panels={
    next:document.getElementById('homeNextPanel'),
    upcoming:document.getElementById('homeUpcomingPanel'),
    played:document.getElementById('homePlayedPanel')
  };
  const panel=panels[key];
  if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'});
}
function openQuickAddMatch(){
  show('matches');
  const card=document.getElementById('matchAddCard');
  if(card)card.classList.remove('collapsed');
  setTimeout(()=>{
    document.getElementById('matchOpponent')?.focus();
    card?.scrollIntoView({behavior:'smooth',block:'nearest'});
  },40);
}

function bindHomeMatchTabs(){
  document.querySelectorAll('[data-home-tab]').forEach(tab=>{
    if(tab.dataset.bound==='1')return;
    tab.dataset.bound='1';
    tab.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      activateHomeMatchTab(tab.dataset.homeTab);
    });
  });

  const quickAdd=document.getElementById('homeQuickAddMatch');
  if(quickAdd && quickAdd.dataset.bound!=='1'){
    quickAdd.dataset.bound='1';
    quickAdd.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();openQuickAddMatch();
    });
  }
}


function getLineupBenchIds(m,lineup){
  const onField=new Set(Object.values(lineup||{}));
  return state.players
    .filter(p=>['fit','limited'].includes(m.availability?.[p.id]))
    .filter(p=>!onField.has(p.id))
    .map(p=>p.id);
}


function playerGoalBallsForLineup(match,playerId){
  const goals=(match.scorers||[]).filter(id=>id===playerId).length;
  if(!goals)return '';
  return `<span class="preview-goal-balls" title="${goals} doelpunt${goals===1?'':'en'}">${Array.from({length:goals},()=>'<span class="preview-goal-ball">⚽</span>').join('')}</span>`;
}

function renderPreviewPitch(targetId,m,lineup){
  const el=document.getElementById(targetId);
  if(!el)return;
  el.innerHTML='';
  el.style.backgroundImage=getComputedStyle(document.getElementById('pitch1')).backgroundImage;
  el.style.backgroundSize=getComputedStyle(document.getElementById('pitch1')).backgroundSize;
  el.style.backgroundPosition=getComputedStyle(document.getElementById('pitch1')).backgroundPosition;
  el.style.backgroundRepeat='no-repeat';

  const xy=(m.formation||'4-3-3')==='4-4-2'?XY442:XY433;

  Object.entries(lineup||{}).forEach(([pos,pid])=>{
    const p=state.players.find(x=>x.id===pid);
    if(!p||!xy[pos])return;

    const tag=document.createElement('div');
    tag.className=`preview-player level-${p.level}`;
    tag.style.left=xy[pos][0]+'%';
    tag.style.top=xy[pos][1]+'%';

    const num=document.createElement('span');
    num.className='num';
    num.textContent=pos;

    const name=document.createElement('span');
    name.className='preview-player-name';
    name.textContent=(p.name||'').trim().split(/\s+/)[0]||p.name;

    tag.append(num,name);

    const goalBalls=playerGoalBallsForLineup(m,p.id);
    if(goalBalls){
      const goals=document.createElement('span');
      goals.className='preview-player-goals';
      goals.innerHTML=goalBalls;
      tag.appendChild(goals);
    }

    el.appendChild(tag);
  });
}

function renderPreviewBench(targetId,m,lineup){
  const el=document.getElementById(targetId);
  if(!el)return;
  const ids=getLineupBenchIds(m,lineup);

  el.innerHTML='<strong style="margin-right:4px">Wissels</strong>'+
    (ids.length
      ? ids.map(pid=>{
          const p=state.players.find(x=>x.id===pid);
          return `<span class="preview-bench-chip">${esc((p?.name||'').trim().split(/\s+/)[0]||'')}</span>`;
        }).join('')
      : '<span class="muted">Geen wisselspelers</span>');
}

function openLineupPreview(matchId){
  const m=state.matches.find(x=>x.id===matchId);
  if(!m)return;

  document.getElementById('lineupPreviewMatchTitle').textContent=
    `${fullMatchTitle(m)} · ${formatDateNL(m.date)} · ${m.time||'—'}`;

  renderPreviewPitch('previewPitch1',m,m.lineup1||{});
  renderPreviewPitch('previewPitch2',m,m.lineup2||{});
  renderPreviewBench('previewBench1',m,m.lineup1||{});
  renderPreviewBench('previewBench2',m,m.lineup2||{});

  const modal=document.getElementById('lineupPreviewModal');
  modal.classList.add('on');
  modal.setAttribute('aria-hidden','false');
}

function closeLineupPreview(){
  const modal=document.getElementById('lineupPreviewModal');
  modal.classList.remove('on');
  modal.setAttribute('aria-hidden','true');
}


let finishResultMatchId=null;


let finishSpecialStatus=null;

function setFinishSpecialStatus(status){
  finishSpecialStatus=(finishSpecialStatus===status)?null:status;

  document.querySelectorAll('[data-finish-special]').forEach(btn=>{
    btn.classList.toggle('selected',btn.dataset.finishSpecial===finishSpecialStatus);
  });

  const scoreFields=document.getElementById('finishScoreFields');
  if(scoreFields)scoreFields.classList.toggle('finish-score-disabled',!!finishSpecialStatus);

  const scorerWrap=document.getElementById('finishScorersWrap');
  if(scorerWrap){
    scorerWrap.style.opacity=finishSpecialStatus?'.45':'1';
    scorerWrap.style.pointerEvents=finishSpecialStatus?'none':'auto';
  }
  if(finishSpecialStatus){
    finishScorerDraft=[];
    renderFinishScorerRows();
  }else if(finishResultMatchId){
    syncFinishScorerFieldsToScore();
  }

  const confirm=document.getElementById('confirmFinishResult');
  if(confirm){
    confirm.textContent=finishSpecialStatus==='Verplaatst'
      ? 'Status opslaan'
      : finishSpecialStatus
        ? 'Afronden & opslaan'
        : 'Afronden & opslaan';
  }
}


let finishScorerDraft=[];

function ownTeamScoreForMatch(match){
  const result=(match?.result||'').match(/^\s*(\d+)\s*[-–:]\s*(\d+)\s*$/);
  if(!result)return 0;
  const home=+result[1],away=+result[2];
  return match.homeAway==='Uit'?away:home;
}

function resolvePlayerByName(value){
  const q=String(value||'').trim().toLocaleLowerCase('nl');
  if(!q)return null;

  const exact=state.players.find(p=>p.name.trim().toLocaleLowerCase('nl')===q);
  if(exact)return exact;

  const starts=state.players.filter(p=>p.name.trim().toLocaleLowerCase('nl').startsWith(q));
  return starts.length===1?starts[0]:null;
}

function refreshFinishPlayerSuggestions(){
  const list=document.getElementById('finishPlayerSuggestions');
  if(!list)return;
  list.innerHTML=state.players
    .slice()
    .sort((a,b)=>a.name.localeCompare(b.name,'nl'))
    .map(p=>`<option value="${esc(p.name)}"></option>`)
    .join('');
}

function renderFinishScorerRows(){
  const box=document.getElementById('finishScorerRows');
  if(!box)return;

  box.innerHTML=finishScorerDraft.map((entry,index)=>{
    const p=state.players.find(x=>x.id===entry.playerId);
    const value=p?.name||entry.name||'';
    return `<div class="finish-scorer-row">
      <span class="finish-scorer-goal-label">Doelpunt ${index+1}</span>
      <input
        type="text"
        list="finishPlayerSuggestions"
        data-finish-scorer-input="${index}"
        placeholder="Naam doelpuntenmaker"
        value="${esc(value)}"
        autocomplete="off">
    </div>`;
  }).join('');

  box.querySelectorAll('[data-finish-scorer-input]').forEach(input=>{
    input.addEventListener('input',()=>{
      const idx=+input.dataset.finishScorerInput;
      finishScorerDraft[idx]={playerId:null,name:input.value};
      const p=resolvePlayerByName(input.value);
      if(p)finishScorerDraft[idx]={playerId:p.id,name:p.name};
    });

    input.addEventListener('change',()=>{
      const idx=+input.dataset.finishScorerInput;
      const p=resolvePlayerByName(input.value);
      if(p){
        finishScorerDraft[idx]={playerId:p.id,name:p.name};
        input.value=p.name;
      }
    });
  });
}

function getOwnTeamGoalsFromInputs(match){
  const homeScore=Math.max(0,Number(document.getElementById('finishHomeScore')?.value)||0);
  const awayScore=Math.max(0,Number(document.getElementById('finishAwayScore')?.value)||0);
  return match?.homeAway==='Uit'?awayScore:homeScore;
}

function syncFinishScorerFieldsToScore(){
  const match=state.matches.find(x=>x.id===finishResultMatchId);
  if(!match)return;

  const ownGoals=getOwnTeamGoalsFromInputs(match);
  const current=[...finishScorerDraft];

  finishScorerDraft=Array.from({length:ownGoals},(_,i)=>
    current[i]||{playerId:null,name:''}
  );

  renderFinishScorerRows();
}
function getValidatedScorers(match,expectedGoals){
  const resolved=[];
  for(const entry of finishScorerDraft){
    const p=entry.playerId
      ? state.players.find(x=>x.id===entry.playerId)
      : resolvePlayerByName(entry.name);

    if(!p){
      return {ok:false,message:`Controleer de doelpuntenmaker "${entry.name||'onbekend'}". Kies een bestaande speler.`};
    }
    resolved.push(p.id);
  }

  if(expectedGoals!==resolved.length){
    return {
      ok:false,
      message:`Het aantal ingevulde doelpuntenmakers (${resolved.length}) moet gelijk zijn aan het aantal doelpunten van ${state.teamName||'ons team'} (${expectedGoals}).`
    };
  }

  return {ok:true,scorers:resolved};
}

function playerGoalsInMatch(match,playerId){
  if(!matchCountsAsFinalStatistics(match))return 0;
  return (match.scorers||[]).filter(id=>id===playerId).length;
}

function totalPlayerGoals(playerId){
  return state.matches.reduce((sum,m)=>sum+playerGoalsInMatch(m,playerId),0);
}

function openFinishResultModal(matchId){
  const m=state.matches.find(x=>x.id===matchId);
  if(!m)return;

  const dt=new Date(`${m.date}T${m.time||'00:00'}`);
  if(dt>new Date()){
    alert('Deze wedstrijd is nog niet gespeeld. De uitslag kan pas na de aanvangstijd worden ingevoerd.');
    return;
  }

  finishResultMatchId=matchId;
  finishSpecialStatus=null;
  setFinishSpecialStatus(null);
  document.getElementById('finishResultMatchTitle').textContent=
    `${fullMatchTitle(m)} · ${formatDateNL(m.date)} · ${m.time||'—'}`;

  const team=state.teamName||document.getElementById('teamNameHead')?.textContent||'Ons team';
  const homeTeam=m.homeAway==='Uit'?m.opponent:team;
  const awayTeam=m.homeAway==='Uit'?team:m.opponent;

  document.getElementById('finishHomeLabel').textContent=homeTeam;
  document.getElementById('finishAwayLabel').textContent=awayTeam;

  let hs=0,as=0;
  const match=(m.result||'').match(/^\s*(\d+)\s*[-–:]\s*(\d+)\s*$/);
  if(match){hs=+match[1];as=+match[2];}

  document.getElementById('finishHomeScore').value=hs;
  document.getElementById('finishAwayScore').value=as;

  refreshFinishPlayerSuggestions();
  finishScorerDraft=(m.scorers||[]).map(playerId=>({playerId,name:state.players.find(p=>p.id===playerId)?.name||''}));
  syncFinishScorerFieldsToScore();

  const modal=document.getElementById('finishResultModal');
  modal.classList.add('on');
  modal.setAttribute('aria-hidden','false');
}

function closeFinishResultModal(){
  finishResultMatchId=null;
  const modal=document.getElementById('finishResultModal');
  modal.classList.remove('on');
  modal.setAttribute('aria-hidden','true');
}

function confirmFinishResult(){
  const m=state.matches.find(x=>x.id===finishResultMatchId);
  if(!m)return;

  const dt=new Date(`${m.date}T${m.time||'00:00'}`);
  if(dt>new Date()){
    alert('Deze wedstrijd is nog niet gespeeld en kan nog niet worden afgerond.');
    return;
  }

  if(finishSpecialStatus){
    m.result='';
    m.scorers=[];
    m.matchStatus=finishSpecialStatus;

    if(finishSpecialStatus==='Verplaatst'){
      // A moved match is not a played/finalized match and must not enter statistics.
      m.completed=false;
      m.excludeFromStats=true;
      saveState();
      closeFinishResultModal();
      renderAll();
      return;
    }

    // Cancelled/abandoned matches are closed administratively but have no score
    // and must not count as a played result in statistics.
    m.completed=true;
    m.excludeFromStats=true;
  }else{
    const homeScore=Number(document.getElementById('finishHomeScore').value);
    const awayScore=Number(document.getElementById('finishAwayScore').value);

    if(!Number.isInteger(homeScore) || homeScore<0 || !Number.isInteger(awayScore) || awayScore<0){
      alert('Vul een geldige uitslag in.');
      return;
    }

    const ownGoals=m.homeAway==='Uit'?awayScore:homeScore;
    const scorerCheck=getValidatedScorers(m,ownGoals);
    if(!scorerCheck.ok){
      alert(scorerCheck.message);
      return;
    }

    m.result=`${homeScore}-${awayScore}`;
    m.scorers=scorerCheck.scorers;
    m.matchStatus='Gespeeld';
    m.excludeFromStats=false;
    m.completed=true;
    m.restoredFromFinal=false;
  }

  // Mark final lineups as the current lineups at the moment of completion.
  m.finalLineup1=JSON.parse(JSON.stringify(m.lineup1||{}));
  m.finalLineup2=JSON.parse(JSON.stringify(m.lineup2||{}));

  rebuildStoredPlayerStats();
  saveState();
  closeFinishResultModal();
  renderAll();
}

function renderHome(){
  const navP=document.getElementById('navPlayersCount');
  const navM=document.getElementById('navMatchesCount');
  if(navP)navP.textContent=state.players.length;
  if(navM)navM.textContent=state.matches.length;

  let wins=0,draws=0,losses=0,played=0;
  state.matches.forEach(m=>{
    if(!countsForStatistics(m))return;
    const result=(m.result||'').trim();
    const match=result.match(/^\s*(\d+)\s*[-–:]\s*(\d+)\s*$/);
    if(!match)return;
    const a=+match[1],b=+match[2];
    const own=m.homeAway==='Uit'?b:a;
    const opp=m.homeAway==='Uit'?a:b;
    played++;
    if(own>opp)wins++;
    else if(own===opp)draws++;
    else losses++;
  });
  const points=wins*3+draws;
  const now=new Date();

  const renderCard=m=>{
    const s=compactStatusInfo(m);
    const cardClass=s.key==='final'?'match-card-completed':s.key==='prepared'?'match-card-prepared':'match-card-open';

    const isPlayed = s.key==='final' || s.key==='result' || ['Afgelast','Verplaatst','Geannuleerd'].includes(m.matchStatus);
    return `<div class="card match-compact ${cardClass} ${homeStatusCardClass(m)}">
      <div class="match-compact-head">
        <div class="match-compact-title">
          <b>${esc(fullMatchTitle(m))}</b>
          <div class="muted">${esc(formatDateNL(m.date))} · ${esc(m.time||'—')} · ${esc(m.homeAway||'')} · ${esc(m.matchType||'Competitie')}</div>
        </div>
        <div class="match-head-right">
          ${s.key==='final'?resultScoreButtonHtml(m,`data-home-finish="${m.id}"`):''}
          ${s.key==='result'?resultScoreButtonHtml(m,`data-home-finish="${m.id}"`):''}
          ${(s.key==='final'||s.key==='result')?`<button class="match-refined-open match-stats-eye" data-home-match-stats="${m.id}" title="Wedstrijdstatistiek bekijken" aria-label="Wedstrijdstatistiek bekijken">${statsEyeIcon()}</button>`:''}
          ${s.key==='prepared'?`<button class="home-lineup-btn lineup-icon-only" data-home-lineup="${m.id}" title="Opstelling bekijken" aria-label="Opstelling bekijken"><svg viewBox="0 0 32 24" aria-hidden="true">
  <rect x="2.5" y="3" width="27" height="18" rx="1.8"
        fill="none" stroke="currentColor" stroke-width="1.15"/>
  <path d="M16 3v18"
        fill="none" stroke="currentColor" stroke-width="1.05"/>
  <circle cx="16" cy="12" r="3.1"
          fill="none" stroke="currentColor" stroke-width="1.05"/>
  <circle cx="16" cy="12" r=".55" fill="currentColor"/>
  <path d="M2.5 7.7h4.2v8.6H2.5M29.5 7.7h-4.2v8.6h4.2"
        fill="none" stroke="currentColor" stroke-width="1"/>
</svg></button>`:''}
          <button class="match-refined-open ${s.key==='prepared'?'status-prepared-pencil':s.key==='prepare'?'status-needs-prep-pencil':''}" data-home-open-sheet="${m.id}" title="Wedstrijdblad openen" aria-label="Wedstrijdblad openen">✎</button>
        </div>
      </div>
      <div class="match-compact-bottom">
        <button class="match-inline-status ${s.key} status-iconless-hidden" data-home-status-open="${m.id}" aria-label="${s.label}" title="${s.label}"></button>
        ${compactBulletsHtml(m)}
      </div>
    </div>`;
  };

  const futureMatches=[...state.matches]
    .filter(m=>{
      if(!m.date)return false;
      const dt=new Date(`${m.date}T${m.time||'00:00'}`);
      return dt>now && m.completed!==true;
    })
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

  const nextMatch=futureMatches[0]||null;
  const upcoming=futureMatches.slice(1);

  const playedMatches=[...state.matches]
    .filter(m=>{
      if(!m.date)return false;
      const dt=new Date(`${m.date}T${m.time||'00:00'}`);
      return dt<=now || m.completed===true || Boolean((m.result||'').trim());
    })
    .sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));

  const nextBox=document.getElementById('homeNextMatch');
  const upcomingBox=document.getElementById('homeUpcomingMatches');
  const playedBox=document.getElementById('homePlayedMatches');

  nextBox.innerHTML=nextMatch
    ?renderCard(nextMatch)
    :'<div class="card empty">Geen eerstvolgende wedstrijd.</div>';

  upcomingBox.innerHTML=upcoming.length
    ?upcoming.map(renderCard).join('')
    :'<div class="card empty">Geen verdere aankomende wedstrijden.</div>';

  playedBox.innerHTML=playedMatches.length
    ?playedMatches.map(renderCard).join('')
    :'<div class="card empty">Nog geen gespeelde wedstrijden.</div>';

  document.querySelectorAll('[data-home-open-sheet]').forEach(b=>
    b.addEventListener('click',()=>{
      openMatch(b.dataset.homeOpenSheet);
    })
  );

  document.querySelectorAll('[data-home-match-stats]').forEach(b=>
    b.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      openSingleMatchStats(b.dataset.homeMatchStats);
    })
  );

  document.querySelectorAll('[data-home-lineup]').forEach(b=>
    b.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      openLineupPreview(b.dataset.homeLineup);
    })
  );

  document.querySelectorAll('[data-home-finish]').forEach(b=>
    b.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      openFinishResultModal(b.dataset.homeFinish);
    })
  );

  document.querySelectorAll('[data-home-status-open]').forEach(b=>
    b.addEventListener('click',()=>{
      const m=state.matches.find(x=>x.id===b.dataset.homeStatusOpen);
      if(m)openCompactStatus(m);
    })
  );
  bindHomeMatchTabs();
}
let editPlayerSelectedPositions=[];

function renderEditPlayerPositions(){
  const box=document.getElementById('editPlayerPositions');
  const positionLabels={
    1:'Keeper',
    2:'Rechtsback',
    3:'Centrale verdediger',
    4:'Centrale verdediger',
    5:'Linksback',
    6:'Centrale middenvelder',
    7:'Rechts midden',
    8:'Links midden',
    9:'Rechts aanvaller',
    10:'Spits / Aanvallende middenvelder',
    11:'Links aanvaller'
  };
  box.innerHTML=Array.from({length:11},(_,i)=>i+1).map(pos=>`
    <button
      type="button"
      class="player-pos-choice ${editPlayerSelectedPositions.includes(pos)?'on':''}"
      data-edit-pos="${pos}"
      data-pos-label="${esc(positionLabels[pos])}"
      title="${pos} · ${esc(positionLabels[pos])}"
      aria-label="Positie ${pos}: ${esc(positionLabels[pos])}">
      ${pos}
    </button>`).join('');
  box.querySelectorAll('[data-edit-pos]').forEach(b=>b.onclick=()=>{
    const n=+b.dataset.editPos;
    editPlayerSelectedPositions=editPlayerSelectedPositions.includes(n)
      ?editPlayerSelectedPositions.filter(x=>x!==n)
      :[...editPlayerSelectedPositions,n].sort((a,b)=>a-b);
    b.classList.toggle('on',editPlayerSelectedPositions.includes(n));
  });
}



function setPlayerLevel(level){
  const value=String(level||2);
  const input=document.getElementById('editPlayerLevel');
  if(input)input.value=value;
  document.querySelectorAll('[data-player-level]').forEach(btn=>{
    btn.classList.toggle('on',btn.dataset.playerLevel===value);
  });
}

function setPreferredAvailabilityStatus(status){
  const input=document.getElementById('editPlayerPreferredAvailability');
  if(input)input.value=status||'fit';
  document.querySelectorAll('[data-pref-status]').forEach(btn=>{
    btn.classList.toggle('on',btn.dataset.prefStatus===(status||'fit'));
  });
}


let editPlayerAbsenceDates=[];

function formatAbsenceDateNL(value){
  return formatDateNL(value);
}

function renderPlayerAbsenceDates(){
  const box=document.getElementById('editPlayerAbsenceDates');
  if(!box)return;
  const sorted=[...editPlayerAbsenceDates].sort();
  box.innerHTML=sorted.map(date=>`
    <span class="player-absence-chip">
      ${esc(formatAbsenceDateNL(date))}
      <button type="button" class="player-absence-remove" data-remove-absence="${esc(date)}" title="Datum verwijderen" aria-label="Datum verwijderen">×</button>
    </span>`).join('');

  box.querySelectorAll('[data-remove-absence]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      editPlayerAbsenceDates=editPlayerAbsenceDates.filter(d=>d!==btn.dataset.removeAbsence);
      renderPlayerAbsenceDates();
    });
  });
}

function playerAbsentOnDate(player,date){
  return Boolean(date && Array.isArray(player?.absenceDates) && player.absenceDates.includes(date));
}

function syncPlayerAbsenceToUnpreparedMatches(player,oldDates=[]){
  if(!player)return;
  state.matches.forEach(match=>{
    if(match.completed || match.prepared)return;
    if(!match.availability)match.availability={};

    if(playerAbsentOnDate(player,match.date)){
      match.availability[player.id]='absent';
      return;
    }

    // If a previously registered absence date was removed, restore the player's normal preference.
    if(oldDates.includes(match.date) && match.availability[player.id]==='absent'){
      match.availability[player.id]=player.preferredAvailability||'fit';
    }
  });
}

function openPlayerEditor(id=null){
  const p=id?state.players.find(x=>x.id===id):null;
  document.getElementById('editPlayerId').value=p?.id||'';
  document.getElementById('editPlayerName').value=p?.name||'';
  setPlayerLevel(p?.level||2);
  setPreferredAvailabilityStatus(p?.preferredAvailability||'fit');
  editPlayerSelectedPositions=[...(p?.positions||[])].map(Number);
  renderEditPlayerPositions();

  editPlayerAbsenceDates=[...(p?.absenceDates||[])];
  const absenceInput=document.getElementById('editPlayerAbsenceDate');
  if(absenceInput)absenceInput.value='';
  renderPlayerAbsenceDates();

  const saveBtn=document.getElementById('savePlayerEdit');
  if(saveBtn)saveBtn.textContent='Opslaan';

  const modal=document.getElementById('playerEditModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  setTimeout(()=>document.getElementById('editPlayerName')?.focus(),30);
}
function openPlayerEdit(id){openPlayerEditor(id);}
function closePlayerEdit(){const m=document.getElementById('playerEditModal');m.classList.remove('show');m.setAttribute('aria-hidden','true');}
function editPlayer(id){openPlayerEdit(id);}
function deletePlayer(id){
  const p=state.players.find(x=>x.id===id);
  if(!p)return false;

  state.players=state.players.filter(x=>x.id!==id);

  state.matches.forEach(m=>{
    if(m.availability)delete m.availability[id];

    // Verwijder de speler ook uit beide opstellingen.
    ['lineup1','lineup2','finalLineup1','finalLineup2'].forEach(key=>{
      if(!m[key])return;
      Object.keys(m[key]).forEach(pos=>{
        if(m[key][pos]===id)delete m[key][pos];
      });
    });

    // Eventuele doelpunten van een verwijderde speler worden uit de registratie gehaald.
    if(Array.isArray(m.scorers)){
      m.scorers=m.scorers.filter(playerId=>playerId!==id);
    }
  });

  if(typeof rebuildStoredPlayerStats==='function'){
    rebuildStoredPlayerStats();
  }

  localStorage.setItem(KEY,JSON.stringify(state));
  renderAll();
  return true;
}

let currentPlayerLevelFilter='all';
let currentPlayerPositionFilter='all';
let currentPlayerSort='level-asc';

function filteredPlayers(){
  const players=state.players.filter(p=>{
    const levelOk=currentPlayerLevelFilter==='all' || String(p.level)===currentPlayerLevelFilter;
    const positionOk=currentPlayerPositionFilter==='all' ||
      (p.positions||[]).map(String).includes(currentPlayerPositionFilter);
    return levelOk && positionOk;
  });

  const firstPosition=p=>{
    const positions=(p.positions||[]).map(Number).filter(Number.isFinite);
    return positions.length?Math.min(...positions):99;
  };

  return players.sort((a,b)=>{
    if(currentPlayerSort==='level-desc')
      return Number(b.level)-Number(a.level) || a.name.localeCompare(b.name,'nl');

    if(currentPlayerSort==='position-asc')
      return firstPosition(a)-firstPosition(b) || Number(a.level)-Number(b.level) || a.name.localeCompare(b.name,'nl');

    if(currentPlayerSort==='name-asc')
      return a.name.localeCompare(b.name,'nl');

    // Default: alle N1 bovenaan, daarna N2, daarna N3.
    return Number(a.level)-Number(b.level) || firstPosition(a)-firstPosition(b) || a.name.localeCompare(b.name,'nl');
  });
}


function syncPlayerFilterIconStates(){
  const level=document.getElementById('playerLevelFilter');
  const position=document.getElementById('playerPositionFilter');
  const sort=document.getElementById('playerSort');
  level?.classList.toggle('filter-active',level.value!=='all');
  position?.classList.toggle('filter-active',position.value!=='all');
  sort?.classList.toggle('filter-active',sort.value!=='name-asc');
}

function renderPlayers(){
  syncPlayerFilterIconStates();
  const box=document.getElementById('playerList');
  if(!state.players.length){
    box.innerHTML='<div class="card empty">Nog geen spelers toegevoegd.</div>';
    return;
  }

  const visiblePlayers=filteredPlayers();
  if(!visiblePlayers.length){
    box.innerHTML='<div class="card empty">Geen spelers gevonden met deze filters.</div>';
    return;
  }

  const levelClass=l=>`level-n${l}`;
  const availabilityClass=s=>({
    fit:'availability-fit',
    limited:'availability-limited',
    noPlay:'availability-noPlay',
    absent:'availability-absent'
  })[s||'fit'];

  box.innerHTML=`
    <div class="players-table-head">
      <div>Speler</div>
      <div>Niveau</div>
      <div>Positie(s)</div>
      <div>Goals</div>
      <div>Beschikbaarheid</div>
      <div>Acties</div>
    </div>
    <div class="players-table-body">
      ${visiblePlayers.map(p=>`
        <div class="player-row-card">
          <div class="player-col player-col-name">
            <button type="button" class="player-name-open" data-player-open="${p.id}" title="Open spelerblad">
              ${esc(p.name)}
            </button>
          </div>

          <div class="player-col">
            <span class="player-level-badge ${levelClass(p.level)}">N${p.level}</span>
          </div>

          <div class="player-col player-positions-inline player-positions-text">
            ${(p.positions||[]).length ? (p.positions||[]).join(' / ') : '<span class="muted">—</span>'}
          </div>

          <div class="player-col player-goals-col" title="Totaal aantal doelpunten">
            ${totalPlayerGoals(p.id)}
          </div>

          <div class="player-col player-availability-col">
            <span class="player-availability-dot ${availabilityClass(p.preferredAvailability)}"
              title="${({fit:'Hele wedstrijd',limited:'Halve wedstrijd',noPlay:'Niet spelend',absent:'Afwezig'})[p.preferredAvailability||'fit']}"></span>
          </div>

          <div class="player-icon-actions">
            <button class="player-icon-btn edit" data-edit="${p.id}" title="Speler bewerken" aria-label="Speler bewerken">
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="m4 16.5-.7 4.2 4.2-.7L18.8 8.7l-3.5-3.5L4 16.5Zm13-13 3.5 3.5 1-1a1.4 1.4 0 0 0 0-2l-1.5-1.5a1.4 1.4 0 0 0-2 0l-1 1Z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
      `).join('')}
    </div>`;

  box.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openPlayerEditor(b.dataset.edit)));
  box.querySelectorAll('[data-player-open]').forEach(b=>b.addEventListener('click',()=>openPlayerStats(b.dataset.playerOpen)));
}



document.getElementById('playerLevelFilter')?.addEventListener('change',e=>{
  currentPlayerLevelFilter=e.target.value;
  renderPlayers();
});
document.getElementById('playerPositionFilter')?.addEventListener('change',e=>{
  currentPlayerPositionFilter=e.target.value;
  renderPlayers();
});
document.getElementById('playerSort')?.addEventListener('change',e=>{
  currentPlayerSort=e.target.value;
  renderPlayers();
});
document.getElementById('resetPlayerFilters')?.addEventListener('click',()=>{
  currentPlayerLevelFilter='all';
  currentPlayerPositionFilter='all';
  currentPlayerSort='level-asc';

  const level=document.getElementById('playerLevelFilter');
  const pos=document.getElementById('playerPositionFilter');
  const sort=document.getElementById('playerSort');
  if(level)level.value='all';
  if(pos)pos.value='all';
  if(sort)sort.value='level-asc';

  renderPlayers();
});

document.getElementById('togglePlayerAdd')?.addEventListener('click',()=>openPlayerEditor());

document.getElementById('toggleMatchAdd')?.addEventListener('click',()=>{
  const card=document.getElementById('matchAddCard');
  if(!card)return;
  card.classList.toggle('collapsed');
  if(!card.classList.contains('collapsed')){
    setTimeout(()=>document.getElementById('matchOpponent')?.focus(),30);
    card.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
});

document.getElementById('addMatch').addEventListener('click',()=>{
  const opponent=document.getElementById('matchOpponent').value.trim();
  const date=document.getElementById('matchDate').value;
  const time=document.getElementById('matchTime').value;
  if(!opponent||!date||!time){alert('Vul tegenstander, datum en tijd in.');return}

  const availability={};
  state.players.forEach(p=>availability[p.id]=playerAbsentOnDate(p,date)?'absent':(p.level===3?'limited':(p.preferredAvailability||'fit')));

  state.matches.push({
    id:uid('m'),opponent,date,time,
    matchType:document.getElementById('matchType').value,
    homeAway:document.getElementById('matchHomeAway').value,
    result:'',
    formation:'4-3-3',minStrong:8,mode:'standard',
    availability,lineup1:{},lineup2:{},completed:false,prepared:false
  });

  ['matchOpponent','matchDate','matchTime'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('matchType').value='Competitie';
  saveState();
  document.getElementById('matchAddCard')?.classList.add('collapsed');
});
let pendingDeleteMatchId=null;

function deleteMatch(id){
  const m=state.matches.find(x=>x.id===id);
  if(!m)return;
  pendingDeleteMatchId=id;
  document.getElementById('deleteMatchText').textContent=
    `${fullMatchTitle(m)} · ${formatDateNL(m.date)} ${m.time||''}`;
  const modal=document.getElementById('deleteModal');
  modal.classList.add('on');
  modal.setAttribute('aria-hidden','false');
}

function closeDeleteMatchModal(){
  pendingDeleteMatchId=null;
  const modal=document.getElementById('deleteModal');
  modal.classList.remove('on');
  modal.setAttribute('aria-hidden','true');
}

function confirmDeleteMatch(){
  if(!pendingDeleteMatchId)return;
  const id=pendingDeleteMatchId;

  state.matches=state.matches.filter(m=>m.id!==id);
  localStorage.setItem(KEY,JSON.stringify(state));

  if(activeMatchId===id){
    activeMatchId=null;
    show('matches');
  }

  closeDeleteMatchModal();
  renderAll();
}

document.getElementById('cancelDeleteMatch').addEventListener('click',closeDeleteMatchModal);
document.getElementById('confirmDeleteMatch').addEventListener('click',confirmDeleteMatch);
document.getElementById('deleteModal').addEventListener('click',e=>{
  if(e.target.id==='deleteModal')closeDeleteMatchModal();
});


document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-delmatch]');
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  deleteMatch(btn.dataset.delmatch);
});


function matchAttendanceStats(m){
  const c={fit:0,limited:0,noPlay:0,absent:0,unfilled:0};
  state.players.forEach(p=>{
    const st=m.availability?.[p.id];
    if(st && c[st]!==undefined)c[st]++;
    else c.unfilled++;
  });
  const total=state.players.length;
  const present=c.fit+c.limited+c.noPlay;
  const pct=total?Math.round(present/total*100):0;
  return {c,total,present,pct};
}


function matchHasStarted(m){
  if(!m || !m.date)return false;
  const dt=new Date(`${m.date}T${m.time||'00:00'}`);
  return !Number.isNaN(dt.getTime()) && dt<=new Date();
}

function matchMayFinalize(m){
  return matchHasStarted(m);
}


function countsForStatistics(m){
  return !m?.excludeFromStats &&
    !['Afgelast','Verplaatst','Geannuleerd'].includes(m?.matchStatus);
}

function matchResultDisplay(m){
  if(m?.matchStatus==='Afgelast') return 'Afgelast';
  if(m?.matchStatus==='Verplaatst') return 'Verplaatst';
  if(m?.matchStatus==='Geannuleerd') return 'Geannuleerd';
  return (m?.result||'').trim();
}

function compactStatusInfo(m){
  const prepared=m.prepared===true ||
    (Object.keys(m.lineup1||{}).length===11 && Object.keys(m.lineup2||{}).length===11);
  const resultFilled=Boolean((m.result||'').trim());
  const dt=m.date?new Date(`${m.date}T${m.time||'00:00'}`):null;
  const passed=Boolean(dt && dt<=new Date());

  // Alleen expliciet definitief opgeslagen wedstrijden zijn groen/definitief.
  if(m.completed===true && resultFilled)
    return {key:'final',label:'Opgeslagen definitief'};

  // Na herstellen: bij verstreken datum moet de uitslag opnieuw worden ingevuld.
  if(passed && !resultFilled)
    return {key:'result',label:'Uitslag invullen'};

  if(prepared)
    return {key:'prepared',label:'Voorbereid'};

  return {key:'prepare',label:'Nog voor te bereiden'};
}

function compactBulletsHtml(m){
  const {c,present,total,pct}=matchAttendanceStats(m);
  return `<div class="match-bullets">
    <span class="match-bullet-item"><i class="soft-dot g"></i>${c.fit}</span>
    <span class="match-bullet-item"><i class="soft-dot o"></i>${c.limited}</span>
    <span class="match-bullet-item"><i class="soft-dot r"></i>${c.noPlay}</span>
    <span class="match-bullet-item"><i class="soft-dot k"></i>${c.absent}</span>
    <span class="match-bullet-item" title="Nog niet ingevuld"><i class="soft-dot empty"></i>${c.unfilled}</span>
  </div>
  <div class="match-total">
    <span class="label">Totaal</span>
    <b>${present}/${total} (${pct}%)</b>
  </div>`;
}

function openCompactStatus(m){
  const s=compactStatusInfo(m);
  openMatch(m.id);
  if(s.key==='result')setTimeout(openFinishPanel,0);
}


let currentMatchesFilter='all';

function isActuallyPlayedMatch(m){
  const special=['Afgelast','Verplaatst','Geannuleerd'].includes(m?.matchStatus);
  if(special)return false;
  if(!m?.date)return false;
  const dt=new Date(`${m.date}T${m.time||'00:00'}`);
  return !Number.isNaN(dt.getTime()) && dt<=new Date();
}

function setMatchesFilter(filter){
  currentMatchesFilter=filter==='played'?'played':'all';
  document.querySelectorAll('[data-match-filter]').forEach(btn=>{
    btn.classList.toggle('on',btn.dataset.matchFilter===currentMatchesFilter);
  });
  renderMatches();
}

function renderMatches(){
  const box=document.getElementById('matchList');if(!box)return;
  if(!state.matches.length){
    box.innerHTML='<div class="card empty">Nog geen wedstrijden toegevoegd.</div>';
    return;
  }

  let list=[...state.matches].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

  if(currentMatchesFilter==='played'){
    list=list.filter(isActuallyPlayedMatch);
  }

  if(!list.length){
    box.innerHTML=currentMatchesFilter==='played'
      ?'<div class="card empty">Nog geen gespeelde wedstrijden met uitslag.</div>'
      :'<div class="card empty">Geen wedstrijden gevonden.</div>';
    return;
  }

  box.innerHTML=list.map(m=>{
    const s=compactStatusInfo(m);
    const cardClass=s.key==='final'?'match-card-completed':s.key==='prepared'?'match-card-prepared':'match-card-open';

    return `<div class="card match-compact ${cardClass}">
      <div class="match-compact-head">
        <div class="match-compact-title">
          <b>${esc(fullMatchTitle(m))}</b>
          <div class="muted">${esc(formatDateNL(m.date))} · ${esc(m.time||'—')} · ${esc(m.homeAway||'')} · ${esc(m.matchType||'Competitie')}</div>
        </div>
        <div class="match-compact-actions">
          ${s.key==='final'
            ?`${resultScoreButtonHtml(m,`data-open="${m.id}"`)}<button class="match-refined-open match-stats-eye" data-open-match-stats="${m.id}" title="Wedstrijdstatistiek bekijken" aria-label="Wedstrijdstatistiek bekijken">${statsEyeIcon()}</button>`
            :s.key==='result'
              ?`${resultScoreButtonHtml(m,`data-open="${m.id}"`)}<button class="match-refined-open match-stats-eye" data-open-match-stats="${m.id}" title="Wedstrijdstatistiek bekijken" aria-label="Wedstrijdstatistiek bekijken">${statsEyeIcon()}</button>`
              :`<button class="match-refined-open ${s.key==='prepared'?'status-prepared-pencil':s.key==='prepare'?'status-needs-prep-pencil':''}" data-open="${m.id}" title="Wedstrijdblad openen" aria-label="Wedstrijdblad openen">✎</button>`}
        </div>
      </div>
      <div class="match-compact-bottom">
        <button class="match-inline-status ${s.key} status-iconless-hidden" data-status-open="${m.id}" aria-label="${s.label}" title="${s.label}"></button>
        ${compactBulletsHtml(m)}
      </div>
    </div>`;
  }).join('');

  box.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openMatch(b.dataset.open)));
  box.querySelectorAll('[data-open-match-stats]').forEach(b=>b.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    openSingleMatchStats(b.dataset.openMatchStats);
  }));
  box.querySelectorAll('[data-status-open]').forEach(b=>b.addEventListener('click',()=>{
    const m=state.matches.find(x=>x.id===b.dataset.statusOpen);if(m)openCompactStatus(m);
  }));
}
function openMatch(id){
  setTimeout(()=>{
    const m=state.matches.find(x=>x.id===id);
    const allowed=matchMayFinalize(m);
    ['finishMatchBtn','saveStatsBtn','completeMatchBtn','saveToStats','btnFinishMatch'].forEach(btnId=>{
      const btn=document.getElementById(btnId);
      if(btn){
        btn.disabled=!allowed;
        btn.title=allowed?'':'Deze wedstrijd kan pas na de aanvangstijd worden afgerond.';
      }
    });
  },0);

  activeMatchId=id;const m=state.matches.find(x=>x.id===id);
if(!m)return;
  if(!m.availability)m.availability={};
  state.players.forEach(p=>{
    if(!m.prepared && playerAbsentOnDate(p,m.date)){
      m.availability[p.id]='absent';
    }else if(m.availability[p.id]===undefined){
      m.availability[p.id]=p.level===3?'limited':(p.preferredAvailability||'fit');
    }
  });
  saveState();
  show('matchDetail');renderMatchDetail();
}
document.getElementById('backToMatches').addEventListener('click',()=>show('matches'));

function renderMatchDetail(){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const s=compactStatusInfo(m);
  const att=matchAttendanceStats(m);

  document.getElementById('matchHeader').innerHTML=`
    <div class="card match-detail-summary ${s.key==='final'?'match-card-completed':s.key==='prepared'?'match-card-prepared':'match-card-open'}">
      <div class="match-detail-top">
        <div class="match-detail-main">
          <div class="match-detail-title">
            <div class="section-title">${esc(fullMatchTitle(m))}</div>
          </div>
          <div class="muted match-detail-meta">${esc(formatDateNL(m.date))} · ${esc(m.time)} · ${esc(m.homeAway)} · ${esc(m.matchType||'Competitie')}</div>
        </div>

        <div class="match-detail-actions">
          ${resultScoreButtonHtml(m,`data-sheet-edit-result="${m.id}"`)}
          <button class="match-delete-icon" data-sheet-delete="${m.id}" title="Wedstrijd verwijderen" aria-label="Wedstrijd verwijderen"><svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
<path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-1 11H8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/>
</svg></button>
        </div>
      </div>

      <div class="match-detail-bottom">
        <span class="match-detail-status ${s.key}">${s.label}</span>
        <div class="match-detail-attendance">
          <span class="match-bullet-item"><i class="soft-dot g"></i>${att.c.fit}</span>
          <span class="match-bullet-item"><i class="soft-dot o"></i>${att.c.limited}</span>
          <span class="match-bullet-item"><i class="soft-dot r"></i>${att.c.noPlay}</span>
          <span class="match-bullet-item"><i class="soft-dot k"></i>${att.c.absent}</span>
          <span class="match-bullet-item" title="Nog niet ingevuld"><i class="soft-dot empty"></i>${att.c.unfilled}</span>
        </div>
        <div class="match-detail-total">
          <span class="label">Totaal</span>
          <b>${att.present}/${att.total} (${att.pct}%)</b>
        </div>
      </div>
    </div>`;

  document.querySelector('[data-sheet-edit-result]')?.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();openEditMatch(m.id,true);
  });
  document.querySelector('[data-sheet-delete]')?.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();deleteMatch(m.id);
  });
  document.getElementById('formation').value=m.formation||'4-3-3';
  document.getElementById('minStrong').value=m.minStrong??8;
  document.getElementById('proposalMode').value=m.mode||'standard';
  updateModeHelp();renderAvailability();drawLineups();renderBench();renderSelectionOverview();
  const finishPanel=document.getElementById('finishPanel');
  if(finishPanel?.classList.contains('on'))renderFinalLineupSummary();

  const restoreCard=document.getElementById('restorePreparedCard');
  const restoreBtn=document.getElementById('restorePreparedBtn');
  if(restoreCard){
    restoreCard.style.display=(m.completed===true && Boolean((m.result||'').trim()))?'block':'none';
  }
  if(restoreBtn){
    restoreBtn.dataset.restoreMatchId=m.id;
  }
}

function renderAvailabilitySummary(){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const counts={fit:0,limited:0,noPlay:0,absent:0};
  state.players.forEach(p=>{
    const st=m.availability?.[p.id];
    if(st && counts[st]!==undefined)counts[st]++;
  });
  const totalPresent=counts.fit+counts.limited+counts.noPlay;
  const notFilled=state.players.filter(p=>!m.availability?.[p.id]).length;
  const totalPlayers=state.players.length;
  const pct=totalPlayers?Math.round(totalPresent/totalPlayers*100):0;
  const box=document.getElementById('availabilitySummary');if(!box)return;

  box.className='avail-summary';
  box.innerHTML=`
    <div class="avail-chips">
      <div class="avail-chip"><i class="soft-dot g"></i><strong>${counts.fit}</strong></div>
      <div class="avail-chip"><i class="soft-dot o"></i><strong>${counts.limited}</strong></div>
      <div class="avail-chip"><i class="soft-dot r"></i><strong>${counts.noPlay}</strong></div>
      <div class="avail-chip"><i class="soft-dot k"></i><strong>${counts.absent}</strong></div>
      <div class="avail-chip avail-chip-unfilled" title="Nog niet ingevuld">
        <i class="soft-dot empty"></i><strong>${notFilled}</strong>
      </div>
      <div class="match-detail-total">
        <span class="label">Totaal</span>
        <b>${totalPresent}/${totalPlayers} (${pct}%)</b>
      </div>
    </div>`;
}
function renderCoverageAdvice(){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const playable=state.players.filter(p=>['fit','limited'].includes(m.availability?.[p.id]));

  const exactCounts={};
  for(let pos=1;pos<=11;pos++){
    exactCounts[pos]=playable.filter(p=>(p.positions||[]).includes(pos)).length;
  }

  const groups={
    defence:[2,3,4,5],
    midfield:[6,7,8],
    attack:[9,10,11]
  };

  const groupLabels={defence:'Verdediging',midfield:'Middenveld',attack:'Aanval'};
  const shortages=[];

  Object.entries(groups).forEach(([group,positions])=>{
    const low=positions.filter(pos=>exactCounts[pos]<=1);
    const thin=positions.filter(pos=>exactCounts[pos]===2);

    if(low.length){
      shortages.push({
        group,
        level:'low',
        text:`${groupLabels[group]} krap: ${low.map(pos=>`pos. ${pos} (${exactCounts[pos]})`).join(', ')}`
      });
    }else if(thin.length>=2){
      shortages.push({
        group,
        level:'thin',
        text:`${groupLabels[group]} beperkt: ${thin.map(pos=>`pos. ${pos} (${exactCounts[pos]})`).join(', ')}`
      });
    }
  });

  const box=document.getElementById('coverageAdvice');if(!box)return;

  if(!playable.length){
    box.innerHTML='<div class="coverage-advice"><strong>Positie-advies:</strong> nog geen speelbare spelers geselecteerd.</div>';
    return;
  }

  if(!shortages.length){
    box.innerHTML=`<div class="coverage-advice"><strong>Positie-advies:</strong> alle linies hebben op dit moment voldoende dubbele bezetting.</div>`;
    return;
  }

  box.innerHTML=`
    <div class="coverage-advice">
      <strong>Positie-advies</strong>
      <div class="coverage-line">
        ${shortages.map(s=>`<span class="coverage-tag ${s.level==='low'?'warn':''}">${s.text}</span>`).join('')}
      </div>
      <div class="muted" style="margin-top:5px">Gebaseerd op spelers die groen of oranje staan.</div>
    </div>
  `;
}


function renderMissingAvailabilitySummary(match){
  const box=document.getElementById('availabilityMissingSummary');
  if(!box || !match)return;

  const missing=state.players
    .filter(p=>!match.availability?.[p.id])
    .map(p=>p.name);

  if(!missing.length){
    box.hidden=true;
    box.innerHTML='';
    return;
  }

  box.hidden=false;
  box.innerHTML=`
    <strong>Nog niet ingevuld (${missing.length}):</strong>
    <span class="availability-missing-names">${missing.map(esc).join(', ')}</span>
  `;
}

function renderAvailability(){
  const m=state.matches.find(x=>x.id===activeMatchId),box=document.getElementById('availabilityList');box.innerHTML='';
  renderAvailabilitySummary();
  renderCoverageAdvice();

  const todayKey=(()=>{
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const eyeIcon=`<svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fill="currentColor"/>
  </svg>`;

  state.players.forEach(p=>{
    const futureAbsenceCount=(p.absenceDates||[]).filter(date=>date>=todayKey).length;

    const row=document.createElement('div');
    row.className='row';

    const left=document.createElement('div');
    left.className='prepare-player-left';
    left.innerHTML=`
      <div class="prepare-player-name-line">
        <b>${esc(p.name)}</b>
        ${futureAbsenceCount?`<span class="prepare-future-absence-count">(${futureAbsenceCount})</span>`:''}
      </div>
      <div class="muted">N${p.level} · pos. ${(p.positions||[]).join(', ')||'—'}</div>`;

    const dots=document.createElement('div');
    dots.className='status-dots';

    Object.entries(STATUS).forEach(([key,[cls,label]])=>{
      const b=document.createElement('button');
      b.type='button';
      const isSelected=m.availability[p.id]===key;
      b.className='dot '+cls+(isSelected?' sel':'');
      b.title=label;
      b.setAttribute('aria-label',label+(isSelected?' geselecteerd':''));
      b.textContent=isSelected?'✓':'';
      b.addEventListener('click',()=>{
        m.availability[p.id]=m.availability[p.id]===key?null:key;
        saveState();
        renderMatchDetail();
      });
      dots.appendChild(b);
    });

    const actions=document.createElement('div');
    actions.className='prepare-player-actions';

    const eye=document.createElement('button');
    eye.type='button';
    eye.className='prepare-eye-btn';
    eye.title='Spelerblad bekijken';
    eye.setAttribute('aria-label',`Spelerblad van ${p.name} bekijken`);
    eye.innerHTML=eyeIcon;
    eye.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      show('stats');
      renderStats();
      showPlayerStats(p.id);
    });

    actions.append(eye,dots);
    row.append(left,actions);
    box.appendChild(row);
  });

  renderMissingAvailabilitySummary(m);
}
document.getElementById('clearAvailability')?.addEventListener('click',()=>{
  const m=state.matches.find(x=>x.id===activeMatchId);
  if(!m)return;
  if(!m.availability)m.availability={};
  state.players.forEach(p=>{m.availability[p.id]=null;});
  saveState();
  renderMatchDetail();
});
document.getElementById('proposalMode').addEventListener('change',updateModeHelp);
function updateModeHelp(){
  const v=document.getElementById('proposalMode').value;
  document.getElementById('modeHelp').textContent=
    v==='standard'
      ?'Standaard: uitgebalanceerde opstelling op basis van aanwezigheid, positie en de gekozen minimale balansbezetting. Geen gebruik van historie.'
      :'Eerlijk wisselbeleid: speelminuten uit wedstrijden waarin de speler beschikbaar was bepalen de prioriteit. Afwezigheid telt niet mee. Niveau 3 staat standaard op halve wedstrijd en speelt maximaal 35 minuten.';
}

document.getElementById('generateLineups').addEventListener('click',generateLineups);
document.getElementById('formation').addEventListener('change',()=>{const m=state.matches.find(x=>x.id===activeMatchId);m.formation=document.getElementById('formation').value;saveState();drawLineups()});


function fairPolicyMinutes(playerId){
  let minutes=0;
  state.matches.forEach(match=>{
    if(!countsForStatistics(match))return;
    const st=match.availability?.[playerId];

    // Afwezig / niet geregistreerd / aanwezig maar niet spelend:
    // deze wedstrijd telt niet mee voor het eerlijk wisselbeleid.
    if(!['fit','limited'].includes(st))return;

    minutes+=playerMatchMinutes(match,playerId);
  });
  return minutes;
}

function orderPlayers(list,mode){
  if(mode==='strong')return [...list].sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
  if(mode==='fair')return [...list].sort((a,b)=>fairPolicyMinutes(a.id)-fairPolicyMinutes(b.id)||a.level-b.level);
  return [...list].sort((a,b)=>a.name.localeCompare(b.name));
}
function fillForHalf(base,candidates){
  const arr=[...base];for(const p of candidates){if(arr.length>=11)break;if(!arr.includes(p))arr.push(p)}return arr;
}
function enforceMinStrong(arr,strongPool,minStrong){
  let c=arr.filter(p=>p.level<=2).length;
  for(const s of strongPool){if(c>=minStrong)break;if(arr.includes(s))continue;const idx=arr.findIndex(p=>p.level===3);if(idx>=0){arr[idx]=s;c++}}
}

function exactFitScore(player,pos){
  const pp=player.positions||[];
  if(pp.includes(pos)) return 10000;

  const targetGroup=lineGroup(pos);
  const sameGroup=pp.some(x=>lineGroup(x)===targetGroup);
  if(sameGroup) return 1200;

  // Noodoplossing: middenvelder <-> aanvaller iets minder zwaar bestraffen.
  if(targetGroup==='attack' && pp.some(x=>lineGroup(x)==='midfield')) return 250;
  if(targetGroup==='midfield' && pp.some(x=>lineGroup(x)==='attack')) return 250;
  if(targetGroup==='defence' && pp.some(x=>lineGroup(x)==='midfield')) return 100;

  return -8000;
}

function proposalScore(player,mode){
  if(mode==='fair'){
    // Alleen speelminuten uit wedstrijden waarin de speler beschikbaar was tellen mee.
    // Status 'Afwezig' heeft dus geen negatieve invloed op de eerlijke prioriteit.
    const mins=fairPolicyMinutes(player.id);
    return Math.max(0,900-mins);
  }
  return 0;
}

function optimizeLineup(pool,mode,minStrong,preferredL3Ids=null,forbiddenL3Ids=null,forceIds=null){
  const positions=[1,2,3,4,5,6,7,8,9,10,11];
  const players=[...pool];
  const N=players.length;
  const FULL=(1<<11)-1;
  const NEG=-1e15;

  // dp[mask][strongCount] = {score, prevMask, prevStrong, playerIndex, posIndex}
  let dp=Array.from({length:1<<11},()=>Array(12).fill(null));
  dp[0][0]={score:0,prev:null};

  for(let i=0;i<N;i++){
    const p=players[i];
    const next=dp.map(row=>row.map(x=>x?{...x}:null));

    for(let mask=0;mask<=FULL;mask++){
      for(let sc=0;sc<=11;sc++){
        const cur=dp[mask][sc];
        if(!cur)continue;

        for(let posIdx=0;posIdx<11;posIdx++){
          if(mask&(1<<posIdx))continue;
          const pos=positions[posIdx];
          let score=cur.score + exactFitScore(p,pos) + proposalScore(p,mode);

          if(p.level<=2) score += 120;
          if(p.level===1) score += 80;

          if(p.level===3 && preferredL3Ids){
            score += preferredL3Ids.has(p.id) ? 350 : -450;
          }
          if(p.level===3 && forbiddenL3Ids && forbiddenL3Ids.has(p.id)){
            score -= 5000;
          }
          if(forceIds && forceIds.has(p.id)){
            score += 15000;
          }

          const nmask=mask|(1<<posIdx);
          const nsc=Math.min(11,sc+(p.level<=2?1:0));
          const old=next[nmask][nsc];

          if(!old || score>old.score){
            next[nmask][nsc]={
              score,
              prevMask:mask,
              prevStrong:sc,
              playerIndex:i,
              posIndex:posIdx,
              from:cur
            };
          }
        }
      }
    }
    dp=next;
  }

  let best=null,bestSc=null;
  for(let sc=Math.max(0,minStrong);sc<=11;sc++){
    const cand=dp[FULL][sc];
    if(cand && (!best || cand.score>best.score)){
      best=cand;bestSc=sc;
    }
  }

  // Als minStrong onmogelijk is, kies beste haalbare volledige opstelling.
  if(!best){
    for(let sc=0;sc<=11;sc++){
      const cand=dp[FULL][sc];
      if(cand && (!best || cand.score>best.score)){
        best=cand;bestSc=sc;
      }
    }
  }

  if(!best)return {};

  // Backtracking is easier with memoized recursive reconstruction.
  // Re-run a compact DP with parent pointers per processed player.
  const layers=[];
  let layer=Array.from({length:1<<11},()=>Array(12).fill(null));
  layer[0][0]={score:0,parent:null};
  layers.push(layer);

  for(let i=0;i<N;i++){
    const p=players[i];
    const prev=layers[layers.length-1];
    const next=prev.map(row=>row.map(x=>x?{...x}:null));

    for(let mask=0;mask<=FULL;mask++){
      for(let sc=0;sc<=11;sc++){
        const cur=prev[mask][sc];
        if(!cur)continue;

        for(let posIdx=0;posIdx<11;posIdx++){
          if(mask&(1<<posIdx))continue;
          const pos=positions[posIdx];
          let score=cur.score + exactFitScore(p,pos) + proposalScore(p,mode);

          if(p.level<=2) score += 120;
          if(p.level===1) score += 80;
          if(p.level===3 && preferredL3Ids) score += preferredL3Ids.has(p.id)?350:-450;
          if(p.level===3 && forbiddenL3Ids && forbiddenL3Ids.has(p.id)) score -= 5000;
          if(forceIds && forceIds.has(p.id)) score += 15000;

          const nmask=mask|(1<<posIdx);
          const nsc=Math.min(11,sc+(p.level<=2?1:0));
          const old=next[nmask][nsc];

          if(!old || score>old.score){
            next[nmask][nsc]={
              score,
              parent:{mask,sc,playerIndex:i,posIndex:posIdx,took:true}
            };
          }
        }
      }
    }
    layers.push(next);
  }

  let finalSc=bestSc;
  let finalState=layers[N][FULL][finalSc];
  if(!finalState)return {};

  const result={};
  let mask=FULL,sc=finalSc;

  for(let i=N;i>0;i--){
    const stateHere=layers[i][mask][sc];
    const statePrevSame=layers[i-1][mask][sc];

    if(statePrevSame && stateHere && Math.abs(statePrevSame.score-stateHere.score)<1e-9){
      continue;
    }

    const pidx=i-1;
    const p=players[pidx];
    let found=false;

    for(let posIdx=0;posIdx<11&&!found;posIdx++){
      if(!(mask&(1<<posIdx)))continue;
      const prevMask=mask^(1<<posIdx);
      const prevSc=sc-(p.level<=2?1:0);
      if(prevSc<0)continue;

      const prevState=layers[i-1][prevMask][prevSc];
      if(!prevState)continue;

      let score=prevState.score + exactFitScore(p,positions[posIdx]) + proposalScore(p,mode);
      if(p.level<=2) score += 120;
      if(p.level===1) score += 80;
      if(p.level===3 && preferredL3Ids) score += preferredL3Ids.has(p.id)?350:-450;
      if(p.level===3 && forbiddenL3Ids && forbiddenL3Ids.has(p.id)) score -= 5000;
      if(forceIds && forceIds.has(p.id)) score += 15000;

      if(Math.abs(score-stateHere.score)<1e-9){
        result[positions[posIdx]]=p.id;
        mask=prevMask;
        sc=prevSc;
        found=true;
      }
    }
  }

  return result;
}

function lineupPlayers(lineup){
  return Object.values(lineup||{}).map(id=>state.players.find(p=>p.id===id)).filter(Boolean);
}


function generateLineups(){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;

  m.formation=document.getElementById('formation').value;
  m.minStrong=Math.max(6,Math.min(11,+document.getElementById('minStrong').value||8));
  m.mode=document.getElementById('proposalMode').value;

  const available=state.players.filter(p=>['fit','limited'].includes(m.availability[p.id]));
  if(available.length<11){
    document.getElementById('lineupMsg').innerHTML=`<div class="msg">Er zijn slechts ${available.length} speelbare spelers. Voor een volledige opstelling zijn minimaal 11 nodig.</div>`;
    return;
  }

  const level1=available.filter(p=>p.level===1);
  const level3=available.filter(p=>p.level===3);

  // Niveau 3 zoveel mogelijk over één helft verdelen.
  const orderedL3=orderPlayers(level3,m.mode);
  const pref1=new Set(),pref2=new Set();
  orderedL3.forEach((p,i)=>(i%2===0?pref1:pref2).add(p.id));

  // Bij balans 10/11 niveau 1 in beide helften forceren.
  const forced=m.minStrong>=10 ? new Set(level1.map(p=>p.id)) : null;

  // Eerste helft volledig optimaliseren op positie + voorstelmodus.
  m.lineup1=optimizeLineup(
    available,
    m.mode,
    m.minStrong,
    pref1,
    null,
    forced
  );

  const l3First=new Set(
    lineupPlayers(m.lineup1).filter(p=>p.level===3).map(p=>p.id)
  );

  // Bij eerlijk wisselbeleid niveau 3 hard weren uit tweede helft als hij al eerste helft speelde,
  // zolang er genoeg andere spelers beschikbaar zijn.
  const forbidSecond=(m.mode==='fair' && available.length>=12) ? l3First : null;

  m.lineup2=optimizeLineup(
    available,
    m.mode,
    m.minStrong,
    pref2,
    forbidSecond,
    forced
  );

  m.prepared=true;
  m.generatedLineup1=JSON.parse(JSON.stringify(m.lineup1));
  m.generatedLineup2=JSON.parse(JSON.stringify(m.lineup2));

  saveState();renderMatchDetail();

  const h1=lineupPlayers(m.lineup1);
  const h2=lineupPlayers(m.lineup2);
  const strong1=h1.filter(p=>p.level<=2).length;
  const strong2=h2.filter(p=>p.level<=2).length;

  const l3both=state.players.filter(
    p=>p.level===3 &&
    Object.values(m.lineup1).includes(p.id) &&
    Object.values(m.lineup2).includes(p.id)
  );

  const offPos=[];
  [[m.lineup1,'1e helft'],[m.lineup2,'2e helft']].forEach(([lu,half])=>{
    Object.entries(lu||{}).forEach(([pos,pid])=>{
      const p=state.players.find(x=>x.id===pid);
      if(p && !(p.positions||[]).includes(+pos)){
        offPos.push(`${p.name} (${half}, pos. ${pos})`);
      }
    });
  });

  const exactCount=(lu)=>Object.entries(lu||{}).filter(([pos,pid])=>{
    const p=state.players.find(x=>x.id===pid);
    return p && (p.positions||[]).includes(+pos);
  }).length;

  let modeText=m.mode==='fair'
    ?`Eerlijk wisselbeleid: historie en speelminuten zijn meegenomen.`
    :`Standaard: geen historie gebruikt.`;

  document.getElementById('lineupMsg').innerHTML=`<div class="msg">
    ${modeText}
    Balansbezetting: ${strong1} niveau 1/2 in de 1e helft en ${strong2} in de 2e helft.
    Exact op eigen positienummer: ${exactCount(m.lineup1)}/11 en ${exactCount(m.lineup2)}/11.
    ${l3both.length?` Niveau 3 in beide helften door beperkte alternatieven: ${l3both.map(p=>esc(p.name)).join(', ')}.`:''}
    ${offPos.length?` Noodbezetting buiten opgegeven positie: ${offPos.map(esc).join(', ')}.`:''}
  </div>`;
}
function formationPositions(f){return [1,2,3,4,5,6,7,8,9,10,11]}

function lineGroup(pos){
  if(pos===1)return 'keeper';
  if([2,3,4,5].includes(pos))return 'defence';
  if([6,7,8].includes(pos))return 'midfield';
  return 'attack';
}

function playerCanCoverGroup(player,group){
  return (player.positions||[]).some(p=>lineGroup(p)===group);
}

function positionFitScore(player,pos){
  const positions=player.positions||[];
  if(positions.includes(pos)) return 1000;

  // Goede noodoplossing binnen dezelfde linie.
  const group=lineGroup(pos);
  if(playerCanCoverGroup(player,group)) return 180;

  // Centrale spelers kunnen in uiterste nood iets breder/vooruit of terug.
  if(group==='midfield' && positions.some(p=>[9,10,11].includes(p))) return 80;
  if(group==='attack' && positions.some(p=>[6,7,8,10].includes(p))) return 80;
  if(group==='defence' && positions.some(p=>[6,7,8].includes(p))) return 60;

  return -500;
}

function modePlayerScore(player,mode){
  const mins=player.stats?.minutes||0;
  if(mode==='strong') return (4-player.level)*75;
  if(mode==='fair') return Math.max(0,700-mins)/8;
  return 0;
}

function assignPositions(selected,formation){
  const positions=formationPositions(formation);
  const result={};
  const used=new Set();

  // Eerst de moeilijkst bezetbare posities invullen.
  const orderedPositions=[...positions].sort((a,b)=>{
    const ca=selected.filter(p=>(p.positions||[]).includes(a)).length;
    const cb=selected.filter(p=>(p.positions||[]).includes(b)).length;
    return ca-cb;
  });

  orderedPositions.forEach(pos=>{
    const candidates=selected
      .filter(p=>!used.has(p.id))
      .map(p=>({p,score:positionFitScore(p,pos)}))
      .sort((a,b)=>b.score-a.score || a.p.level-b.p.level || a.p.name.localeCompare(b.p.name));

    if(candidates.length){
      const best=candidates[0];
      result[pos]=best.p.id;
      used.add(best.p.id);
    }
  });

  return result;
}

function buildBalancedHalf(pool,mode,minStrong,preferredL3Ids){
  const positions=formationPositions(document.getElementById('formation').value);
  const selected=[];
  const used=new Set();

  // Score per speler over het totaal: positiegeschiktheid + gekozen voorstelmodus.
  const scarcity=positions.map(pos=>({
    pos,
    count:pool.filter(p=>(p.positions||[]).includes(pos)).length
  })).sort((a,b)=>a.count-b.count);

  for(const item of scarcity){
    const pos=item.pos;
    const candidates=pool
      .filter(p=>!used.has(p.id))
      .map(p=>{
        let score=positionFitScore(p,pos)+modePlayerScore(p,mode);
        if(p.level===3 && preferredL3Ids && preferredL3Ids.has(p.id)) score+=90;
        if(p.level===3 && preferredL3Ids && !preferredL3Ids.has(p.id)) score-=120;
        return {p,score};
      })
      .sort((a,b)=>b.score-a.score);

    if(candidates.length){
      selected.push(candidates[0].p);
      used.add(candidates[0].p.id);
    }
  }

  // Zorg dat het minimum niveau 1+2 gehaald wordt, zonder de veldbalans onnodig kapot te maken.
  let strongCount=selected.filter(p=>p.level<=2).length;
  if(strongCount<minStrong){
    const strongBench=pool.filter(p=>p.level<=2 && !used.has(p.id));
    for(const incoming of strongBench){
      if(strongCount>=minStrong)break;

      let bestSwap=null;
      selected.forEach((outgoing,idx)=>{
        if(outgoing.level!==3)return;
        const temp=[...selected];
        temp[idx]=incoming;
        const lineup=assignPositions(temp,document.getElementById('formation').value);
        let fit=0;
        Object.entries(lineup).forEach(([pos,pid])=>{
          const pp=temp.find(x=>x.id===pid);
          fit+=positionFitScore(pp,+pos);
        });
        if(!bestSwap || fit>bestSwap.fit) bestSwap={idx,fit};
      });

      if(bestSwap){
        used.delete(selected[bestSwap.idx].id);
        selected[bestSwap.idx]=incoming;
        used.add(incoming.id);
        strongCount++;
      }
    }
  }

  return selected.slice(0,11);
}
function drawPitch(id,lineup,formation){
  const el=document.getElementById(id);el.innerHTML='';
  const xy=formation==='4-4-2'?XY442:XY433;

  Object.keys(xy).forEach(pos=>{
    const s=document.createElement('div');
    s.className='slot';
    s.style.left=xy[pos][0]+'%';
    s.style.top=xy[pos][1]+'%';
    s.dataset.pos=pos;
    el.appendChild(s);
  });

  Object.entries(lineup||{}).forEach(([pos,pid])=>{
    const p=state.players.find(x=>x.id===pid);if(!p||!xy[pos])return;
    const d=document.createElement('div');
    d.className=`player level-${p.level}`;
    d.style.left=xy[pos][0]+'%';
    d.style.top=xy[pos][1]+'%';
    d.textContent=(p.name||'').trim().split(/\s+/)[0]||p.name;
    d.dataset.pid=pid;
    d.dataset.pos=pos;
    d.dataset.pitch=id;
    el.appendChild(d);
    attachDrag(d);
    attachSwapTrigger(d);
  });
}
function drawLineups(){const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;drawPitch('pitch1',m.lineup1,m.formation);drawPitch('pitch2',m.lineup2,m.formation)}


let swapContext=null;
let lastTap={pid:null,time:0};

function attachSwapTrigger(el){
  el.addEventListener('dblclick',e=>{
    e.preventDefault();
    e.stopPropagation();
    openSwapChooser(el.dataset.pitch,el.dataset.pos,el.dataset.pid);
  });

  el.addEventListener('pointerup',e=>{
    const now=Date.now();
    const pid=el.dataset.pid;
    if(lastTap.pid===pid && now-lastTap.time<420){
      e.preventDefault();
      e.stopPropagation();
      lastTap={pid:null,time:0};
      openSwapChooser(el.dataset.pitch,el.dataset.pos,el.dataset.pid);
    }else{
      lastTap={pid,time:now};
    }
  });
}

function openSwapChooser(pitchId,pos,currentPid){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const half=pitchId==='pitch1'?1:2;
  const lineup=half===1?m.lineup1:m.lineup2;
  const currentPlayer=state.players.find(p=>p.id===currentPid);
  const targetPos=+pos;

  const eligible=state.players
    .filter(p=>p.id!==currentPid)
    .filter(p=>['fit','limited'].includes(m.availability?.[p.id]))
    .filter(p=>(p.positions||[]).includes(targetPos))
    .map(p=>({
      player:p,
      onFieldPos:Object.entries(lineup||{}).find(([k,id])=>id===p.id)?.[0]||null
    }))
    .sort((a,b)=>{
      // Eerst spelers op de bank, daarna niveau en eerlijkheid.
      if(Boolean(a.onFieldPos)!==Boolean(b.onFieldPos)) return a.onFieldPos?1:-1;
      if(a.player.level!==b.player.level) return a.player.level-b.player.level;
      return (a.player.stats?.minutes||0)-(b.player.stats?.minutes||0);
    });

  swapContext={half,targetPos,currentPid};
  document.getElementById('swapInfo').textContent=
    `Positie ${targetPos} · ${POS[targetPos]} · huidig: ${currentPlayer?.name||''}`;

  const box=document.getElementById('swapOptions');
  if(!eligible.length){
    box.innerHTML='<div class="empty">Geen andere aanwezige speler met deze positie beschikbaar.</div>';
  }else{
    box.innerHTML='';
    eligible.forEach(item=>{
      const p=item.player;
      const row=document.createElement('div');
      row.className='swap-option';
      const where=item.onFieldPos?`Staat nu op positie ${item.onFieldPos}`:'Wisselspeler';
      row.innerHTML=`<div><b class="pdf-player-name" data-player-pdf="${p.id}" title="Dubbelklik voor PDF">${esc(p.name)}</b><div class="muted">Niveau ${p.level} · ${where}</div></div>`;
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent='Wissel';
      btn.addEventListener('click',()=>performQuickSwap(p.id,item.onFieldPos));
      row.appendChild(btn);
      box.appendChild(row);
    });
  }

  const modal=document.getElementById('swapModal');
  modal.classList.add('on');
  modal.setAttribute('aria-hidden','false');
}

function performQuickSwap(newPid,newPos){
  if(!swapContext)return;
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const half=swapContext.half;
  const lineup={...(half===1?m.lineup1:m.lineup2)};
  const targetPos=String(swapContext.targetPos);
  const currentPid=lineup[targetPos];

  if(newPos){
    // Nieuwe speler stond al in het veld: wissel de twee posities.
    lineup[targetPos]=newPid;
    lineup[String(newPos)]=currentPid;
  }else{
    // Nieuwe speler kwam van de bank: huidige speler gaat naar de bank.
    lineup[targetPos]=newPid;
  }

  if(half===1)m.lineup1=lineup;else m.lineup2=lineup;
  m.prepared=true;
  saveState();
  renderMatchDetail();
  closeSwapChooser();
}

function closeSwapChooser(){
  swapContext=null;
  const modal=document.getElementById('swapModal');
  modal.classList.remove('on');
  modal.setAttribute('aria-hidden','true');
}


let dragState=null;

function getPitchHalfFromId(id){return id==='pitch1'?1:2}
function currentLineup(half){
  const m=state.matches.find(x=>x.id===activeMatchId);
  return half===1?m.lineup1:m.lineup2;
}
function setCurrentLineup(half,val){
  const m=state.matches.find(x=>x.id===activeMatchId);
  if(half===1)m.lineup1=val;else m.lineup2=val;
}

function findNearestPosition(pitchEl,clientX,clientY){
  const rect=pitchEl.getBoundingClientRect();
  const x=((clientX-rect.left)/rect.width)*100;
  const y=((clientY-rect.top)/rect.height)*100;
  const formation=document.getElementById('formation').value;
  const xy=formation==='4-4-2'?XY442:XY433;
  let best=null,bestD=Infinity;
  Object.entries(xy).forEach(([pos,[px,py]])=>{
    const d=(px-x)*(px-x)+(py-y)*(py-y);
    if(d<bestD){bestD=d;best=+pos}
  });
  return best;
}

function movePlayerToPosition(half,pid,targetPos){
  const m=state.matches.find(x=>x.id===activeMatchId);
  const lineup={...(half===1?m.lineup1:m.lineup2)};
  const sourceEntry=Object.entries(lineup).find(([pos,id])=>id===pid);
  const sourcePos=sourceEntry?+sourceEntry[0]:null;
  const displaced=lineup[targetPos];

  if(sourcePos!==null) delete lineup[sourcePos];
  lineup[targetPos]=pid;
  if(displaced && displaced!==pid){
    if(sourcePos!==null) lineup[sourcePos]=displaced;
    else delete lineup[targetPos] && (lineup[targetPos]=pid);
  }

  if(displaced && displaced!==pid && sourcePos===null){
    // Speler kwam van bank: speler op doelpositie gaat naar bank.
    lineup[targetPos]=pid;
  }

  setCurrentLineup(half,lineup);
  saveState();renderMatchDetail();
}

function attachDrag(el){
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    el.classList.add('dragging');
    dragState={pid:el.dataset.pid,half:getPitchHalfFromId(el.dataset.pitch),el};
  });
  el.addEventListener('pointerup',e=>{
    if(!dragState)return;
    const pitch=document.getElementById(dragState.half===1?'pitch1':'pitch2');
    const rect=pitch.getBoundingClientRect();
    if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){
      const pos=findNearestPosition(pitch,e.clientX,e.clientY);
      movePlayerToPosition(dragState.half,dragState.pid,pos);
    }
    dragState.el?.classList.remove('dragging');dragState=null;
  });
}

function attachBenchDrag(el){
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    el.classList.add('dragging');
    dragState={pid:el.dataset.pid,half:+el.dataset.half,el,fromBench:true};
  });
  el.addEventListener('pointerup',e=>{
    if(!dragState)return;
    const pitch=document.getElementById(dragState.half===1?'pitch1':'pitch2');
    const rect=pitch.getBoundingClientRect();
    if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){
      const pos=findNearestPosition(pitch,e.clientX,e.clientY);
      movePlayerToPosition(dragState.half,dragState.pid,pos);
    }
    dragState.el?.classList.remove('dragging');dragState=null;
  });
}

function restoreGenerated(half){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const src=half===1?m.generatedLineup1:m.generatedLineup2;
  if(!src){alert('Genereer eerst een opstelling.');return}
  if(half===1)m.lineup1=JSON.parse(JSON.stringify(src));
  else m.lineup2=JSON.parse(JSON.stringify(src));
  saveState();renderMatchDetail();
}


function renderSelectionOverview(){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const box=document.getElementById('selectionOverview');if(!box)return;

  const ids1=new Set(Object.values(m.lineup1||{}));
  const ids2=new Set(Object.values(m.lineup2||{}));

  const playable=state.players.filter(p=>['fit','limited'].includes(m.availability?.[p.id]));

  // Speelbare spelers die in geen van beide helften staan.
  const notSelected=playable
    .filter(p=>!ids1.has(p.id)&&!ids2.has(p.id))
    .sort((a,b)=>a.name.localeCompare(b.name));

  // Alleen spelers die nu beide helften staan kunnen een wisselbeurt-advies krijgen.
  const fullGame=playable.filter(p=>ids1.has(p.id)&&ids2.has(p.id));

  // Vergelijk historische minuten binnen hetzelfde niveau.
  // Bovenste 40% van een niveau = relatief veel gespeeld.
  const byLevel={1:[],2:[],3:[]};
  state.players.forEach(p=>byLevel[p.level]?.push(p));

  const thresholds={};
  [1,2,3].forEach(level=>{
    const vals=byLevel[level]
      .map(p=>p.stats?.minutes||0)
      .sort((a,b)=>a-b);
    if(!vals.length){thresholds[level]=Infinity;return}
    const idx=Math.max(0,Math.floor(vals.length*0.60));
    thresholds[level]=vals[Math.min(idx,vals.length-1)];
  });

  const swapCandidates=fullGame
    .filter(p=>(p.stats?.minutes||0)>=thresholds[p.level])
    .sort((a,b)=>(b.stats?.minutes||0)-(a.stats?.minutes||0));

  const playerLine=(p,reason)=>`
    <div class="overview-player">
      <div><b class="pdf-player-name" data-player-pdf="${p.id}" title="Dubbelklik voor PDF">${esc(p.name)}</b><div class="muted">Niveau ${p.level} · pos. ${(p.positions||[]).join(', ')||'—'}</div></div>
      <div class="overview-reason">${reason}</div>
    </div>`;

  box.innerHTML=`
    <div class="overview-block">
      <div class="overview-title">Niet opgesteld hele wedstrijd (${notSelected.length})</div>
      ${notSelected.length
        ?notSelected.map(p=>playerLine(p,'0 min')).join('')
        :'<div class="muted">Geen speelbare spelers die de hele wedstrijd niet zijn opgesteld.</div>'}
      ${notSelected.length?'<button class="btn" id="playEveryoneBtn" style="margin-top:9px;width:100%">Pas aan - Iedereen spelen</button>':''}
    </div>
    <div class="overview-block">
      <div class="overview-title">Mogelijke wisselbeurt volgens statistiek (${swapCandidates.length})</div>
      <div class="muted" style="margin-bottom:4px">Spelers die nu 70 minuten staan en historisch relatief veel speelminuten hebben binnen hun eigen niveau.</div>
      ${swapCandidates.length
        ?swapCandidates.map(p=>playerLine(p,`${p.stats?.minutes||0} historische min`)).join('')
        :'<div class="muted">Op basis van de huidige statistiek geen duidelijke wisselkandidaat.</div>'}
    </div>
  `;

  const everyoneBtn=document.getElementById('playEveryoneBtn');
  if(everyoneBtn)everyoneBtn.addEventListener('click',adjustEveryonePlays);
}

function adjustEveryonePlays(){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const playable=state.players.filter(p=>['fit','limited'].includes(m.availability?.[p.id]));

  if(playable.length<11){
    alert('Er zijn minder dan 11 speelbare spelers.');
    return;
  }
  if(playable.length>22){
    alert('Met meer dan 22 aanwezige speelbare spelers kan niet iedereen minimaal één helft spelen.');
    return;
  }

  // Begin bij de huidige opstellingen, zodat handmatige keuzes zoveel mogelijk behouden blijven.
  let h1=lineupPlayers(m.lineup1);
  let h2=lineupPlayers(m.lineup2);

  // Als er nog geen volledige opstelling is, eerst genereren via de bestaande logica.
  if(h1.length<11 || h2.length<11){
    generateLineups();
    h1=lineupPlayers(m.lineup1);
    h2=lineupPlayers(m.lineup2);
  }

  const used=new Set([...h1,...h2].map(p=>p.id));
  const missing=playable
    .filter(p=>!used.has(p.id))
    .sort((a,b)=>{
      // Niveau 3 en spelers met weinig historische minuten krijgen eerst een halve wedstrijd.
      if(a.level!==b.level)return b.level-a.level;
      return (a.stats?.minutes||0)-(b.stats?.minutes||0);
    });

  function halfScoreForReplacement(halfPlayers,incoming){
    // Zoek iemand die beide helften speelt en dus zonder 0 minuten te krijgen één helft kan afstaan.
    const other=halfPlayers===h1?h2:h1;
    const both=halfPlayers
      .map((p,idx)=>({p,idx}))
      .filter(x=>other.some(o=>o.id===x.p.id));

    const candidates=both.map(x=>{
      const temp=[...halfPlayers];
      temp[x.idx]=incoming;

      const strong=temp.filter(p=>p.level<=2).length;
      if(strong<m.minStrong)return null;

      // Bij balans 10/11 mogen niveau-1 spelers niet uit één van de helften verdwijnen.
      if(m.minStrong>=10 && x.p.level===1)return null;

      const lu=optimizeLineup(temp,m.mode,Math.min(m.minStrong,temp.filter(p=>p.level<=2).length));
      const assigned=lineupPlayers(lu);
      if(assigned.length<11)return null;

      let exact=0;
      Object.entries(lu).forEach(([pos,pid])=>{
        const p=temp.find(z=>z.id===pid);
        if(p&&(p.positions||[]).includes(+pos))exact++;
      });

      // Voorkeur: speler met veel historische minuten laat een helft vallen,
      // terwijl positiegeschiktheid en balans intact blijven.
      const history=x.p.stats?.minutes||0;
      const levelPenalty=x.p.level===1?300:x.p.level===2?100:0;
      return {idx:x.idx,out:x.p,score:exact*100+history/10-levelPenalty};
    }).filter(Boolean).sort((a,b)=>b.score-a.score);

    return candidates[0]||null;
  }

  for(const incoming of missing){
    const c1=halfScoreForReplacement(h1,incoming);
    const c2=halfScoreForReplacement(h2,incoming);

    let chosenHalf=null,choice=null;
    if(c1&&c2){
      if(c1.score>=c2.score){chosenHalf=1;choice=c1}else{chosenHalf=2;choice=c2}
    }else if(c1){chosenHalf=1;choice=c1}
    else if(c2){chosenHalf=2;choice=c2}

    if(!choice)continue;

    if(chosenHalf===1)h1[choice.idx]=incoming;
    else h2[choice.idx]=incoming;
  }

  // Heroptimaliseer de posities binnen de gekozen 11 spelers per helft.
  m.lineup1=optimizeLineup(h1,m.mode,Math.min(m.minStrong,h1.filter(p=>p.level<=2).length));
  m.lineup2=optimizeLineup(h2,m.mode,Math.min(m.minStrong,h2.filter(p=>p.level<=2).length));
  m.prepared=true;

  saveState();
  renderMatchDetail();

  const final1=new Set(Object.values(m.lineup1||{}));
  const final2=new Set(Object.values(m.lineup2||{}));
  const stillMissing=playable.filter(p=>!final1.has(p.id)&&!final2.has(p.id));

  const msg=document.getElementById('lineupMsg');
  if(msg){
    msg.innerHTML=`<div class="msg">${
      stillMissing.length
        ?`De opstelling is aangepast, maar ${stillMissing.map(p=>esc(p.name)).join(', ')} kon niet worden ingepast zonder de ingestelde minimale balansbezetting te doorbreken.`
        :'De opstellingen zijn aangepast zodat iedere aanwezige speelbare speler minimaal één helft is opgesteld. De positie- en balansregels zijn zoveel mogelijk behouden.'
    }</div>`;
  }
}

function renderBench(){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const ids1=new Set(Object.values(m.lineup1||{})),ids2=new Set(Object.values(m.lineup2||{}));
  const selectable=state.players.filter(p=>['fit','limited'].includes(m.availability[p.id]));
  const bench1=selectable.filter(p=>!ids1.has(p.id));
  const bench2=selectable.filter(p=>!ids2.has(p.id));

  const makeBench=(containerId,arr,half)=>{
    const c=document.getElementById(containerId);
    c.innerHTML=`<b>Wisselspelers ${half===1?'1e':'2e'} helft (${arr.length})</b><div class="muted" style="margin:4px 0 8px">Sleep een speler naar het veld om te wisselen</div>`;
    if(!arr.length){c.innerHTML+='<span class="muted">Geen wisselspelers</span>';return;}
    arr.forEach(p=>{
      const chip=document.createElement('span');
      chip.className=`bench-chip level-${p.level}`;
      chip.textContent=`${p.name} · N${p.level}`;
      chip.dataset.pid=p.id;
      chip.dataset.half=half;
      c.appendChild(chip);
      attachBenchDrag(chip);
    });
  };

  makeBench('bench1',bench1,1);
  makeBench('bench2',bench2,2);
}

document.getElementById('closeSwap').addEventListener('click',closeSwapChooser);
document.getElementById('swapModal').addEventListener('click',e=>{if(e.target.id==='swapModal')closeSwapChooser();});
document.getElementById('restore1').addEventListener('click',()=>restoreGenerated(1));
document.getElementById('restore2').addEventListener('click',()=>restoreGenerated(2));


function renderFinalLineupSummary(){
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const box=document.getElementById('finalLineupSummary');if(!box)return;

  const renderHalf=(lineup,title)=>{
    const rows=Object.entries(lineup||{})
      .sort((a,b)=>+a[0]-+b[0])
      .map(([pos,pid])=>{
        const p=state.players.find(x=>x.id===pid);
        return p?`<div class="final-player"><b style="display:inline">${pos}</b> · ${esc(p.name)} <span class="muted">N${p.level}</span></div>`:'';
      }).join('');
    return `<div class="final-half"><b>${title}</b>${rows||'<div class="muted">Nog geen volledige opstelling.</div>'}</div>`;
  };

  box.innerHTML=
    renderHalf(m.lineup1,'1e helft · 0–35 min')+
    renderHalf(m.lineup2,'2e helft · 35–70 min');
}

function openFinishPanel(){
  const _guardMatch=state.matches.find(x=>x.id===currentMatchId);
  if(_guardMatch && !matchMayFinalize(_guardMatch)){
    alert('Deze wedstrijd is nog niet gespeeld. Afronden en opslaan in statistieken kan pas nadat de wedstrijd is begonnen.');
    return;
  }

  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  const panel=document.getElementById('finishPanel');
  panel.classList.add('on');
  document.getElementById('finalResult').value=m.result||'';
  renderFinalLineupSummary();
}

document.getElementById('openFinishPanel').addEventListener('click',openFinishPanel);

document.getElementById('finishMatch').addEventListener('click',()=>{
  const m=state.matches.find(x=>x.id===activeMatchId);if(!m)return;
  if(m.completed){alert('Deze wedstrijd is al verwerkt in de statistieken.');return}

  const result=document.getElementById('finalResult').value.trim();
  if(!/^\s*\d+\s*[-–:]\s*\d+\s*$/.test(result)){
    alert('Vul een geldige uitslag in, bijvoorbeeld 3-1.');
    return;
  }
  if(Object.keys(m.lineup1||{}).length!==11 || Object.keys(m.lineup2||{}).length!==11){
    alert('Controleer eerst de definitieve opstelling: beide helften moeten 11 spelers bevatten.');
    return;
  }

  m.result=result;
  m.prepared=true;
  const ids1=new Set(Object.values(m.lineup1||{})),ids2=new Set(Object.values(m.lineup2||{}));
  state.players.forEach(p=>{
    p.stats=p.stats||{minutes:0,matches:0,fit:0,limited:0,noPlay:0,absent:0,fullMatches:0,halfMatches:0};
    const st=m.availability[p.id]||'absent';p.stats[st]=(p.stats[st]||0)+1;
    const played=(ids1.has(p.id)?35:0)+(ids2.has(p.id)?35:0);
    if(played>0)p.stats.matches=(p.stats.matches||0)+1;
    p.stats.minutes=(p.stats.minutes||0)+played;
    if(played===70)p.stats.fullMatches=(p.stats.fullMatches||0)+1;
    if(played===35)p.stats.halfMatches=(p.stats.halfMatches||0)+1;
  });
  m.completed=true;m.restoredFromFinal=false;saveState();renderHome();alert('Wedstrijd en definitieve opstelling zijn opgeslagen in de statistieken.');
});


function rebuildStoredPlayerStats(){
  state.players.forEach(p=>{
    p.stats={minutes:0,matches:0,fit:0,limited:0,noPlay:0,absent:0,fullMatches:0,halfMatches:0};
  });

  state.matches.forEach(match=>{
    if(!matchCountsAsFinalStatistics(match))return;

    const ids1=new Set(Object.values(match.lineup1||{}));
    const ids2=new Set(Object.values(match.lineup2||{}));

    state.players.forEach(p=>{
      const st=match.availability?.[p.id];
      if(['fit','limited','noPlay','absent'].includes(st)){
        p.stats[st]=(p.stats[st]||0)+1;
      }

      const played=(ids1.has(p.id)?35:0)+(ids2.has(p.id)?35:0);
      if(played>0){
        p.stats.matches++;
        p.stats.minutes+=played;
      }
      if(played===70)p.stats.fullMatches++;
      if(played===35)p.stats.halfMatches++;
    });
  });
}


function restorePreparedMatch(button){
  const matchId=button?.dataset?.restoreMatchId || activeMatchId;
  const match=state.matches.find(m=>m.id===matchId);

  if(!match){
    alert('Wedstrijd kon niet worden gevonden.');
    return false;
  }

  // Browser-confirm dialogs kunnen in een embedded demo worden geblokkeerd.
  // Daarom voeren we het herstel direct uit.
  match.completed=false;
  match.prepared=true;
  match.result='';
  match.scorers=[];
  match.matchStatus='Voorbereid';
  match.excludeFromStats=false;
  match.finalLineup1=null;
  match.finalLineup2=null;
  match.restoredFromFinal=true;

  // Alle opgeslagen spelerstatistieken opnieuw opbouwen op basis van
  // uitsluitend wedstrijden die nog definitief zijn.
  rebuildStoredPlayerStats();

  // Direct persistent opslaan.
  localStorage.setItem(KEY,JSON.stringify(state));

  activeMatchId=match.id;

  // Meteen alle kaarten/statistieken verversen.
  renderHeader();
  renderHome();
  renderPlayers();
  renderMatches();
  renderStats();

  // Ga terug naar Wedstrijden zodat de gewijzigde status zichtbaar is.
  show('matches');
  renderMatches();

  const banner=document.getElementById('restoreSuccessBanner');
  if(banner){
    const passed=match.date && new Date(`${match.date}T${match.time||'00:00'}`)<=new Date();
    banner.textContent=passed
      ? 'Wedstrijd hersteld. Omdat de datum verstreken is, staat de wedstrijd nu op Uitslag invullen.'
      : 'Wedstrijd hersteld naar Voorbereid. De statistieken zijn bijgewerkt.';
    banner.hidden=false;
    setTimeout(()=>{banner.hidden=true;},4500);
  }

  return true;
}


function rollbackMatchFromStatistics(match){
  if(!match)return false;

  const wasFinal=match.completed===true || Boolean((match.result||'').trim());
  if(!wasFinal)return false;

  match.completed=false;
  match.prepared=true;
  match.result='';
  match.scorers=[];
  match.matchStatus='Voorbereid';
  match.excludeFromStats=false;
  match.finalLineup1=null;
  match.finalLineup2=null;
  match.restoredFromFinal=true;

  rebuildStoredPlayerStats();
  return true;
}

function getSeasonRecord(){
  let wins=0,draws=0,losses=0,played=0,points=0,goalsFor=0,goalsAgainst=0,total=0;

  state.matches.forEach(m=>{
    if(!countsForStatistics(m))return;

    // Het seizoensoverzicht en de puntentelling gelden uitsluitend voor competitiewedstrijden.
    if((m.matchType||'Competitie')!=='Competitie')return;

    // Afgelast/verplaatst/geannuleerd tellen niet mee in het seizoenstotaal.
    if(['Afgelast','Verplaatst','Geannuleerd'].includes(m.matchStatus))return;

    total++;

    const mt=(m.result||'').trim().match(/^\s*(\d+)\s*[-–:]\s*(\d+)\s*$/);
    if(!mt)return;

    const a=+mt[1],b=+mt[2],own=m.homeAway==='Uit'?b:a,opp=m.homeAway==='Uit'?a:b;
    played++;
    goalsFor+=own;
    goalsAgainst+=opp;

    if(own>opp){wins++;points+=3;}
    else if(own===opp){draws++;points+=1;}
    else{losses++;}
  });

  return {wins,draws,losses,played,total,points,goalsFor,goalsAgainst};
}

function seasonBookPlayerRows(){
  return state.players.map(p=>{
    let fit=0,limited=0,noPlay=0,absent=0,minutes=0,played=0;
    state.matches.forEach(m=>{
      if(!matchCountsAsFinalStatistics(m))return;
      const st=m.availability?.[p.id];
      if(st==='fit')fit++;
      if(st==='limited')limited++;
      if(st==='noPlay')noPlay++;
      if(st==='absent')absent++;
      const mins=playerMatchMinutes(m,p.id);
      minutes+=mins;
      if(mins>0)played++;
    });
    const registered=fit+limited+noPlay+absent;
    const present=fit+limited+noPlay;
    return {
      p,played,minutes,goals:totalPlayerGoals(p.id),
      fit,limited,noPlay,absent,
      attendance:registered?Math.round(present/registered*100):0
    };
  }).sort((a,b)=>b.minutes-a.minutes || b.goals-a.goals || a.p.name.localeCompare(b.p.name,'nl'));
}

async function downloadSeasonBookPdf(){
  const btn=document.getElementById('downloadSeasonBook');
  const original=btn?.innerHTML||'';
  if(btn){btn.disabled=true;btn.innerHTML='…';}

  try{
    const JsPDF=await ensureJsPdf();
    const doc=new JsPDF({unit:'mm',format:'a4',orientation:'portrait'});
    const rec=getSeasonRecord();
    const players=seasonBookPlayerRows();
    const finalMatches=[...state.matches]
      .filter(m=>matchCountsAsFinalStatistics(m) && /^\s*\d+\s*[-–:]\s*\d+\s*$/.test((m.result||'').trim()))
      .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

    const club=state.teamName||state.team||'CoachBoard';
    const L=15,R=195,W=180;
    let y=18;

    const pageHeader=(title)=>{
      doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text(title,L,18);
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text(club,L,25);
      y=34;
    };
    const section=(title)=>{
      if(y>270){doc.addPage();pageHeader('Seizoensboek');}
      doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(title,L,y);y+=7;
    };
    const line=(label,value)=>{
      if(y>282){doc.addPage();pageHeader('Seizoensboek');}
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(label,L,y);
      doc.setFont('helvetica','bold');doc.text(String(value),R,y,{align:'right'});y+=6;
    };

    // Cover
    doc.setFont('helvetica','bold');doc.setFontSize(26);doc.text('Seizoensboek',L,45);
    doc.setFontSize(17);doc.text(club,L,57);
    doc.setFont('helvetica','normal');doc.setFontSize(10);
    doc.text('Wedstrijden, uitslagen, spelersstatistieken en doelpunten',L,67);
    doc.setDrawColor(210);doc.line(L,76,R,76);
    doc.setFontSize(9);
    doc.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}`,L,84);

    // Season summary
    doc.addPage(); pageHeader('1. Seizoensoverzicht');
    const cards=[
      ['Wedstrijden',`${rec.played}/${rec.total}`],['Winst',rec.wins],['Gelijk',rec.draws],
      ['Verlies',rec.losses],['Punten',rec.points],['Doelpunten',`${rec.goalsFor} - ${rec.goalsAgainst}`]
    ];
    const cw=56, ch=21;
    cards.forEach((c,i)=>{
      const col=i%3,row=Math.floor(i/3),x=L+col*62,cy=y+row*27;
      doc.roundedRect(x,cy,cw,ch,2,2);
      doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(String(c[0]),x+4,cy+7);
      doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text(String(c[1]),x+4,cy+16);
    });
    y+=61;

    section('Wedstrijden');
    if(!finalMatches.length){line('Gespeelde wedstrijden','0');}
    finalMatches.forEach(m=>{
      if(y>274){doc.addPage();pageHeader('Wedstrijden');}
      doc.setFont('helvetica','bold');doc.setFontSize(9);
      doc.text(`${formatDateNL(m.date)}  ${fullMatchTitle(m)}`,L,y);
      doc.text(m.result||'-',R,y,{align:'right'});y+=5;
      const scorers=(m.scorers||[]).map(id=>state.players.find(p=>p.id===id)?.name).filter(Boolean);
      doc.setFont('helvetica','normal');doc.setFontSize(8);
      if(scorers.length){
        const text=doc.splitTextToSize(`Doelpuntenmakers: ${scorers.join(', ')}`,W);
        doc.text(text,L,y);y+=text.length*4;
      }
      y+=3;
    });

    // Player overview
    doc.addPage();pageHeader('2. Spelersoverzicht');
    doc.setFont('helvetica','bold');doc.setFontSize(8);
    const cols=[15,73,92,111,133,154,176];
    ['Speler','Niv.','Pos.','Wed.','Min.','Goals','Aanw.'].forEach((h,i)=>doc.text(h,cols[i],y));
    y+=3;doc.line(L,y,R,y);y+=5;
    doc.setFont('helvetica','normal');
    players.forEach(r=>{
      if(y>282){doc.addPage();pageHeader('2. Spelersoverzicht');}
      doc.text(r.p.name.slice(0,28),cols[0],y);
      doc.text(`N${r.p.level}`,cols[1],y);
      doc.text((r.p.positions||[]).join('/')||'-',cols[2],y);
      doc.text(String(r.played),cols[3],y);
      doc.text(String(r.minutes),cols[4],y);
      doc.text(String(r.goals),cols[5],y);
      doc.text(`${r.attendance}%`,cols[6],y);
      y+=6;
    });

    // Individual player chapters
    players.forEach((r,index)=>{
      doc.addPage();pageHeader(`3.${index+1} ${r.p.name}`);
      line('Niveau',`N${r.p.level}`);
      line('Posities',(r.p.positions||[]).join(' / ')||'-');
      line('Gespeelde wedstrijden',r.played);
      line('Speelminuten',r.minutes);
      line('Doelpunten',r.goals);
      line('Aanwezigheid',`${r.attendance}%`);
      line('Hele wedstrijd',r.fit);
      line('Halve wedstrijd',r.limited);
      line('Aanwezig / niet spelend',r.noPlay);
      line('Afwezig',r.absent);

      y+=3;section('Wedstrijdhistorie');
      state.matches
        .filter(m=>matchCountsAsFinalStatistics(m) && (m.availability?.[r.p.id] || playerMatchMinutes(m,r.p.id)>0))
        .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
        .forEach(m=>{
          if(y>279){doc.addPage();pageHeader(`${r.p.name} - wedstrijdhistorie`);}
          const mins=playerMatchMinutes(m,r.p.id);
          const goals=playerGoalsInMatch(m,r.p.id);
          doc.setFont('helvetica','normal');doc.setFontSize(8);
          const title=doc.splitTextToSize(`${formatDateNL(m.date)} · ${fullMatchTitle(m)}`,115);
          doc.text(title,L,y);
          doc.setFont('helvetica','bold');
          doc.text(`${mins} min · ${goals} goal${goals===1?'':'s'}`,R,y,{align:'right'});
          y+=Math.max(6,title.length*4+2);
        });
    });

    // Goal scorers ranking
    doc.addPage();pageHeader('4. Doelpuntenmakers');
    const scorers=players.filter(r=>r.goals>0).sort((a,b)=>b.goals-a.goals || a.p.name.localeCompare(b.p.name,'nl'));
    if(!scorers.length)line('Doelpunten','Nog geen');
    scorers.forEach((r,i)=>line(`${i+1}. ${r.p.name}`,r.goals));

    // Footer page numbers
    const pages=doc.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      doc.setPage(i);
      doc.setFont('helvetica','normal');doc.setFontSize(7);
      doc.text(`CoachBoard · Seizoensboek · ${i}/${pages}`,105,291,{align:'center'});
    }

    doc.save(`CoachBoard_Seizoensboek_${safePdfFileName(club)}.pdf`);
    if(btn){
      btn.innerHTML='✓';
      setTimeout(()=>{btn.disabled=false;btn.innerHTML=original;},1500);
    }
  }catch(err){
    console.error(err);
    if(btn){btn.disabled=false;btn.innerHTML=original;}
    alert('Het seizoensboek kon niet worden gemaakt. Controleer de internetverbinding en probeer opnieuw.');
  }
}

function renderStats(){
  const rec=getSeasonRecord();
  document.getElementById('statsMatches').textContent=`${rec.played}/${rec.total}`;
  document.getElementById('statsWins').textContent=rec.wins;
  document.getElementById('statsDraws').textContent=rec.draws;
  document.getElementById('statsLosses').textContent=rec.losses;
  document.getElementById('statsPoints').textContent=rec.points;
  document.getElementById('statsGoalsFor').textContent=rec.goalsFor;
  document.getElementById('statsGoalsAgainst').textContent=rec.goalsAgainst;

  const rows=state.players.map(p=>{
    let minutes=0,present=0,registered=0;

    state.matches.forEach(m=>{
      if(!countsForStatistics(m))return;

      const validResult=/^\s*\d+\s*[-–:]\s*\d+\s*$/.test((m.result||'').trim());
      if(!validResult)return;

      const st=m.availability?.[p.id];
      if(st){
        registered++;
        if(st!=='absent')present++;
      }
      minutes+=playerMatchMinutes(m,p.id);
    });

    if(!minutes && Number(p.stats?.minutes)>0)minutes=Number(p.stats.minutes);

    const storedMatches=Number(p.stats?.matches||0);
    if(!registered && storedMatches>0){
      registered=storedMatches;
      const storedAbsent=Number(p.stats?.absent||0);
      present=Math.max(0,registered-storedAbsent);
    }

    const attendancePct=registered?Math.round(present/registered*100):0;
    return {p,minutes,present,registered,attendancePct};
  });

  const maxMinutes=Math.max(70,...rows.map(r=>r.minutes));
  const playerStatsList=document.getElementById('statsPlayerList');
  if(!playerStatsList)return;

  if(!rows.length){
    playerStatsList.innerHTML='<div class="card empty">Nog geen spelers beschikbaar voor statistieken.</div>';
    return;
  }

  const eyeIcon=`<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fill="currentColor"/>
  </svg>`;

  playerStatsList.innerHTML=`
    <div class="stats-player-head stats-player-head-compact">
      <div>Speler</div>
      <div>Niveau</div>
      <div>Positie(s)</div>
      <div></div>
    </div>
    <div class="stats-player-list">
      ${rows.map(r=>`
        <div class="stats-player-card stats-player-card-bars-below">
          <div class="stats-player-main stats-player-main-with-bars">
            <button type="button" class="stats-player-name" data-player-stats="${r.p.id}">${esc(r.p.name)}</button>

            <div class="stats-bars-below-name">
              <div class="stats-inline-bar">
                <span class="stats-inline-label">Min.</span>
                <div class="stats-track"><div class="stats-fill-min" style="width:${r.minutes?Math.min(100,(r.minutes/maxMinutes)*100):0}%"></div></div>
                <span class="stats-inline-value">${r.minutes}</span>
              </div>
              <div class="stats-inline-bar">
                <span class="stats-inline-label">Aanw.</span>
                <div class="stats-track"><div class="stats-fill-att" style="width:${r.attendancePct||0}%"></div></div>
                <span class="stats-inline-value">${r.attendancePct}%</span>
              </div>
            </div>
          </div>

          <div>
            <span class="stats-level-badge level-${r.p.level}">N${r.p.level}</span>
          </div>

          <div class="stats-position-list">
            ${(r.p.positions||[]).map(pos=>`<span class="stats-position-pill">${pos}</span>`).join('')||'<span class="muted">—</span>'}
          </div>

        </div>
      `).join('')}
    </div>`;

  playerStatsList.querySelectorAll('[data-player-stats]').forEach(btn=>{
    btn.addEventListener('click',()=>showPlayerStats(btn.dataset.playerStats));
  });
}
function showStatsMain(){
  statsMainView.style.display='';playedStatsView.style.display='none';playerStatsView.style.display='none';
}

function matchScorerSummary(match){
  const counts=new Map();
  (match.scorers||[]).forEach(playerId=>{
    counts.set(playerId,(counts.get(playerId)||0)+1);
  });

  if(!counts.size)return '';

  return [...counts.entries()].map(([playerId,count])=>{
    const player=state.players.find(p=>p.id===playerId);
    const name=player?.name||'Onbekende speler';
    const totalGoals=totalPlayerGoals(playerId);
    return `<span class="match-scorer-name"><span class="match-scorer-ball">⚽</span>${esc(name)} <b class="match-scorer-total">(${totalGoals})</b></span>`;
  }).join('');
}



function resultScoreButtonHtml(m,attrs=''){
  const final=Boolean((m.result||'').trim());
  const label=final ? esc(matchResultDisplay(m)||m.result) : '.. - ..';
  const title=final ? 'Uitslag bekijken' : 'Uitslag invullen';
  return `<button class="result-score-icon ${final?'is-final':'is-pending'}" ${attrs} title="${title}" aria-label="${title}">
    <span>${label}</span>
  </button>`;
}

function statsEyeIcon(){
  return `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
    <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"/>
  </svg>`;
}

function openSingleMatchStats(matchId){
  show('stats');
  showPlayedStats();
  const target=document.querySelector(`[data-match-stat-id="${CSS.escape(matchId)}"]`);
  if(target){
    document.querySelectorAll('.match-stat-row').forEach(el=>el.style.display=el===target?'':'none');
    target.scrollIntoView({block:'start',behavior:'smooth'});
  }
}


function embeddedStatsLineups(match){
  return `
    <div class="match-stat-lineups">
      <div class="match-stat-lineups-title">Opstellingen</div>

      <div class="match-stat-lineup-half">
        <div class="match-stat-lineup-half-head">
          <b>1e helft</b><span class="muted">0–35 min</span>
        </div>
        <div class="preview-pitch match-stat-preview-pitch" id="statsPitch1-${match.id}"></div>
        <div class="preview-bench match-stat-preview-bench" id="statsBench1-${match.id}"></div>
      </div>

      <div class="match-stat-lineup-half">
        <div class="match-stat-lineup-half-head">
          <b>2e helft</b><span class="muted">35–70 min</span>
        </div>
        <div class="preview-pitch match-stat-preview-pitch" id="statsPitch2-${match.id}"></div>
        <div class="preview-bench match-stat-preview-bench" id="statsBench2-${match.id}"></div>
      </div>
    </div>`;
}

function renderEmbeddedStatsLineups(match){
  renderPreviewPitch(`statsPitch1-${match.id}`,match,match.lineup1||{});
  renderPreviewPitch(`statsPitch2-${match.id}`,match,match.lineup2||{});
  renderPreviewBench(`statsBench1-${match.id}`,match,match.lineup1||{});
  renderPreviewBench(`statsBench2-${match.id}`,match,match.lineup2||{});
}

function showPlayedStats(){
  const matches=[...state.matches].filter(m=>(m.result||'').trim()).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  playedStatsList.innerHTML=matches.length?matches.map(m=>{
    const c={fit:0,limited:0,noPlay:0,absent:0};state.players.forEach(p=>{const st=m.availability?.[p.id];if(st&&c[st]!==undefined)c[st]++});
    const reg=c.fit+c.limited+c.noPlay+c.absent,present=c.fit+c.limited+c.noPlay,pct=reg?Math.round(present/reg*100):0;
    return `<div class="match-stat-row" data-match-stat-id="${m.id}">
      <div class="match-stat-head">
        <div>
          <b>${esc(fullMatchTitle(m))}</b>
          <div class="muted">${esc(formatDateNL(m.date))}</div>
        </div>
        <div class="match-stat-head-actions">
          <div class="match-stat-result">
            <b>${esc(m.result)}</b>
            <div class="muted">${present}/${reg} · ${pct}% aanwezig</div>
          </div>
        </div>
      </div>
      <div class="attendance-mini compact-status-counts">
        <span class="status-chip" title="Hele wedstrijd"><i class="mini g"></i>${c.fit}</span>
        <span class="status-chip" title="Halve wedstrijd"><i class="mini o"></i>${c.limited}</span>
        <span class="status-chip" title="Aanwezig / niet spelend"><i class="mini r"></i>${c.noPlay}</span>
        <span class="status-chip" title="Afwezig"><i class="mini k"></i>${c.absent}</span>
      </div>
      ${m.scorers?.length?`<div class="match-scorers-stat">
        <span class="match-scorers-label">Doelpuntenmakers</span>
        <div class="match-scorers-names">${matchScorerSummary(m)}</div>
      </div>`:''}
      <div class="note-field"><label>Opmerkingen</label><textarea data-match-note="${m.id}" placeholder="Opmerking over deze wedstrijd...">${esc(m.notes||'')}</textarea></div>
      ${embeddedStatsLineups(m)}
    </div>`;
  }).join(''):'<div class="empty">Nog geen gespeelde wedstrijden met uitslag.</div>';

  matches.forEach(m=>renderEmbeddedStatsLineups(m));

  statsMainView.style.display='none';
  playedStatsView.style.display='';
  playerStatsView.style.display='none';
}
let currentPlayerStatsId=null;
let currentPlayerHistoryFilter='all';

function playerStatusClassKey(st){
  if(st==='fit')return 'fit';
  if(st==='limited')return 'limited';
  if(st==='noPlay')return 'noPlay';
  if(st==='absent')return 'absent';
  return 'fit';
}

function renderPlayerHistory(playerId,filter='all'){
  const p=state.players.find(x=>x.id===playerId);if(!p)return;
  const box=document.getElementById('playerHistoryList');if(!box)return;

  const history=[];
  [...state.matches]
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
    .forEach(m=>{
      const st=m.availability?.[p.id];
      const mins=playerMatchMinutes(m,p.id);
      if(st||mins>0){
        history.push({
          m,
          statusKey:st||'fit',
          statusLabel:playerStatusLabel(m,p.id),
          mins,
          goals:playerGoalsInMatch(m,p.id)
        });
      }
    });

  const filtered=filter==='all'?history:history.filter(h=>h.statusKey===filter);

  box.innerHTML=filtered.length?filtered.map(h=>`
    <div class="row">
      <div>
        <b>${esc(fullMatchTitle(h.m))}</b>
        <div class="muted">${esc(formatDateNL(h.m.date))}</div>
      </div>
      <div class="player-history-right">
        ${h.goals?`<span class="player-history-goals">${h.goals} ⚽</span>`:''}
        <span class="status-bullet ${playerStatusClassKey(h.statusKey)}" title="${esc(h.statusLabel)}"></span>
        <b>${h.mins} min</b>
      </div>
    </div>`).join(''):'<div class="muted">Geen wedstrijden binnen dit filter.</div>';

  document.querySelectorAll('[data-player-filter]').forEach(btn=>{
    btn.classList.toggle('on',btn.dataset.playerFilter===filter);
  });
}


async function ensureJsPdf(){
  if(window.jspdf?.jsPDF)return window.jspdf.jsPDF;

  return new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-coachboard-jspdf]');
    if(existing){
      existing.addEventListener('load',()=>resolve(window.jspdf?.jsPDF));
      existing.addEventListener('error',()=>reject(new Error('PDF-module kon niet worden geladen.')));
      return;
    }

    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
    s.dataset.coachboardJspdf='1';
    s.onload=()=>{
      if(window.jspdf?.jsPDF)resolve(window.jspdf.jsPDF);
      else reject(new Error('PDF-module is niet beschikbaar.'));
    };
    s.onerror=()=>reject(new Error('PDF-module kon niet worden geladen.'));
    document.head.appendChild(s);
  });
}

function safePdfFileName(name){
  return String(name||'speler')
    .trim()
    .replace(/[\\/:*?"<>|]+/g,'-')
    .replace(/\s+/g,'_')
    .slice(0,80) || 'speler';
}

async function downloadPlayerStatsPdf(playerId){
  const p=state.players.find(x=>x.id===playerId);
  if(!p)return;

  const button=document.getElementById('downloadPlayerPdf');
  const originalHtml=button?.innerHTML||'';
  if(button){
    button.disabled=true;
    button.innerHTML='PDF maken...';
  }

  try{
    const JsPDF=await ensureJsPdf();
    const doc=new JsPDF({unit:'mm',format:'a4',orientation:'portrait'});

    const totalGoals=totalPlayerGoals(p.id);
    let fit=0,half=0,presentNoPlay=0,absent=0,played=0,minutes=0;
    const history=[];

    [...state.matches]
      .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
      .forEach(m=>{
        if(!matchCountsAsFinalStatistics(m))return;

        const st=m.availability?.[p.id];
        if(st==='fit')fit++;
        if(st==='limited')half++;
        if(st==='noPlay')presentNoPlay++;
        if(st==='absent')absent++;

        const mins=playerMatchMinutes(m,p.id);
        if(mins>0)played++;
        minutes+=mins;

        if(st||mins>0){
          history.push({
            date:formatDateNL(m.date),
            match:fullMatchTitle(m),
            status:playerStatusLabel(m,p.id),
            minutes:mins,
            goals:playerGoalsInMatch(m,p.id)
          });
        }
      });

    const registered=fit+half+presentNoPlay+absent;
    const presentTotal=fit+half+presentNoPlay;
    const pct=registered?Math.round(presentTotal/registered*100):0;

    const left=15;
    const right=195;
    const width=180;

    doc.setFont('helvetica','bold');
    doc.setFontSize(20);
    doc.text('CoachBoard - Spelerstatistiek',left,18);

    doc.setFontSize(16);
    doc.text(p.name,left,29);

    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.text(`Niveau ${p.level}  |  Posities ${(p.positions||[]).join(' / ')||'-'}`,left,36);

    // Summary cards
    const cards=[
      ['Wedstrijden',String(played)],
      ['Speelminuten',String(minutes)],
      ['Doelpunten',String(totalGoals)],
      ['Aanwezigheid',`${presentTotal}/${registered} (${pct}%)`]
    ];

    let x=left;
    let y=46;
    const cardW=42.5;
    cards.forEach(([label,value],idx)=>{
      x=left+idx*(cardW+3.3);
      doc.roundedRect(x,y,cardW,20,2,2);
      doc.setFont('helvetica','normal');
      doc.setFontSize(8);
      doc.text(label,x+3,y+6);
      doc.setFont('helvetica','bold');
      doc.setFontSize(13);
      doc.text(value,x+3,y+14);
    });

    y=76;
    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.text('Aanwezigheid',left,y);

    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    const attendance=[
      `Hele wedstrijd: ${fit}`,
      `Halve wedstrijd: ${half}`,
      `Aanwezig, niet spelend: ${presentNoPlay}`,
      `Afwezig: ${absent}`
    ];
    y+=7;
    attendance.forEach(line=>{
      doc.text(line,left,y);
      y+=5;
    });

    y+=5;
    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.text('Wedstrijdhistorie',left,y);
    y+=7;

    const headers=['Datum','Wedstrijd','Status','Min.','Goals'];
    const cols=[15,42,111,163,180];

    doc.setFontSize(8);
    headers.forEach((h,i)=>doc.text(h,cols[i],y));
    y+=3;
    doc.line(left,y,right,y);
    y+=5;

    doc.setFont('helvetica','normal');
    doc.setFontSize(8);

    history.forEach(row=>{
      if(y>280){
        doc.addPage();
        y=18;
        doc.setFont('helvetica','bold');
        doc.setFontSize(8);
        headers.forEach((h,i)=>doc.text(h,cols[i],y));
        y+=3;
        doc.line(left,y,right,y);
        y+=5;
        doc.setFont('helvetica','normal');
      }

      const matchLines=doc.splitTextToSize(row.match,64);
      const statusLines=doc.splitTextToSize(row.status,47);
      const rowLines=Math.max(matchLines.length,statusLines.length,1);
      const rowHeight=Math.max(6,rowLines*4.2);

      doc.text(row.date,cols[0],y);
      doc.text(matchLines,cols[1],y);
      doc.text(statusLines,cols[2],y);
      doc.text(String(row.minutes),cols[3],y);
      doc.text(String(row.goals||0),cols[4],y);

      y+=rowHeight;
      doc.setDrawColor(225);
      doc.line(left,y-1,right,y-1);
      doc.setDrawColor(0);
    });

    if(!history.length){
      doc.text('Nog geen gespeelde wedstrijden beschikbaar.',left,y);
    }

    const filename=`CoachBoard_${safePdfFileName(p.name)}_statistiek.pdf`;
    doc.save(filename);

    if(button){
      button.innerHTML='✓ PDF gedownload';
      setTimeout(()=>{
        button.disabled=false;
        button.innerHTML=originalHtml;
      },1800);
    }
  }catch(err){
    console.error(err);
    if(button){
      button.disabled=false;
      button.innerHTML=originalHtml;
    }
    alert('Het downloaden van de PDF is niet gelukt. Controleer je internetverbinding en probeer opnieuw.');
  }
}

function showPlayerStats(playerId){
  const p=state.players.find(x=>x.id===playerId);if(!p)return;
  currentPlayerStatsId=playerId;
  currentPlayerHistoryFilter='all';

  const todayKey=(()=>{
    const d=new Date();
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  })();

  const futureAbsenceDates=[...(p.absenceDates||[])]
    .filter(date=>date>=todayKey)
    .sort();

  const totalGoals=totalPlayerGoals(p.id);

  let fit=0,half=0,presentNoPlay=0,absent=0,played=0,minutes=0;
  [...state.matches].forEach(m=>{
    if(!matchCountsAsFinalStatistics(m))return;
    const st=m.availability?.[p.id];
    if(st==='fit')fit++;
    if(st==='limited')half++;
    if(st==='noPlay')presentNoPlay++;
    if(st==='absent')absent++;
    const mins=playerMatchMinutes(m,p.id);
    if(mins>0)played++;
    minutes+=mins;
  });

  const registered=fit+half+presentNoPlay+absent;
  const presentTotal=fit+half+presentNoPlay;
  const pct=registered?Math.round((presentTotal/registered)*100):0;
  const maxPossible=Math.max(70,registered*70);
  const minutesPct=Math.min(100,Math.round(minutes/maxPossible*100));

  playerStatsDetail.innerHTML=`
    <div class="player-sheet-head">
      <div class="section-title" style="margin:0">Spelerblad</div>
      <div class="player-sheet-id">
        <div class="player-name">${esc(p.name)}${futureAbsenceDates.length?`<span class="player-future-absence-count">(${futureAbsenceDates.length})</span>`:''}</div>
        <div class="player-meta">Niveau ${p.level} · pos. ${(p.positions||[]).join(', ')||'—'}</div>
      </div>
    </div>

    <div class="player-sheet-actions">
      <button class="player-download-pdf-btn" id="downloadPlayerPdf" title="Spelerstatistiek downloaden als PDF">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Download PDF
      </button>
    </div>

    <div class="stats-section-card">
      <div class="section-title" style="margin-top:0">Aanwezigheid</div>
      <div class="player-attendance-row">
        <div class="player-att-box"><span>Hele wedstrijd</span><b>${fit}</b></div>
        <div class="player-att-box"><span>Halve wedstrijd</span><b>${half}</b></div>
        <div class="player-att-box"><span>Aanwezig</span><b>${presentNoPlay}</b></div>
        <div class="player-att-box">
  <span>Afwezig${futureAbsenceDates.length?` <em class="player-att-future-count">(${futureAbsenceDates.length})</em>`:''}</span>
  <b>${absent}</b>
</div>
        <div class="player-att-box"><span>Aanwezigheid</span><b>${presentTotal}/${registered}</b><span>${pct}%</span></div>
      </div>

      <div class="player-progress-grid">
        <span>Speelminuten</span>
        <div class="player-progress-track"><div class="player-progress-fill" style="width:${minutesPct}%"></div></div>
        <span class="player-progress-value">${minutes} min</span>

        <span>Aanwezigheid</span>
        <div class="player-progress-track"><div class="player-progress-fill att" style="width:${pct}%"></div></div>
        <span class="player-progress-value">${pct}%</span>
      </div>
    </div>

    <div class="stats-section-card">
      <div class="section-title" style="margin-top:0">Gespeelde wedstrijden</div>
      <div class="player-detail-grid player-detail-grid-goals">
        <div class="player-stat-box"><span class="muted">Wedstrijden</span><b>${played}</b></div>
        <div class="player-stat-box"><span class="muted">Speelminuten</span><b>${minutes}</b></div>
        <div class="player-stat-box"><span class="muted">Doelpunten</span><b>${totalGoals}</b></div>
      </div>

      <div class="player-filter-row">
        <button class="player-filter-btn on" data-player-filter="all">Alle</button>
        <button class="player-filter-btn" data-player-filter="fit">Hele wedstrijd</button>
        <button class="player-filter-btn" data-player-filter="limited">Halve wedstrijd</button>
        <button class="player-filter-btn" data-player-filter="noPlay">Aanwezig</button>
        <button class="player-filter-btn" data-player-filter="absent">Afwezig</button>
      </div>

      <div id="playerHistoryList"></div>
    </div>

    <div class="stats-section-card player-future-absence-card">
      <div class="section-title" style="margin-top:0">
        Geplande afwezigheid
        ${futureAbsenceDates.length?`<span class="player-future-absence-count">(${futureAbsenceDates.length})</span>`:''}
      </div>
      ${futureAbsenceDates.length
        ? `<div class="player-future-absence-list">
            ${futureAbsenceDates.map(date=>`<span class="player-future-absence-date">${esc(formatDateNL(date))}</span>`).join('')}
          </div>`
        : '<div class="player-future-absence-empty">Geen toekomstige afwezigheidsdatums gepland.</div>'}
    </div>

    <div class="player-delete-bottom">
      <button class="player-sheet-delete-btn" id="deletePlayerFromSheet" title="Speler verwijderen" aria-label="Speler verwijderen">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-1 11H8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" fill="currentColor"/>
        </svg>
        Verwijder speler
      </button>
    </div>`;

  document.getElementById('downloadPlayerPdf')?.addEventListener('click',()=>downloadPlayerStatsPdf(playerId));
  document.getElementById('deletePlayerFromSheet')?.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();

    const btn=e.currentTarget;
    const player=state.players.find(x=>x.id===playerId);
    if(!player)return;

    btn.disabled=true;
    btn.textContent='Verwijderen...';

    const deleted=deletePlayer(playerId);
    if(!deleted){
      btn.disabled=false;
      btn.textContent='Verwijder speler';
      return;
    }

    currentPlayerStatsId=null;
    show('players');
    renderPlayers();

    const notice=document.getElementById('playerDeleteSuccess');
    if(notice){
      notice.textContent=`${player.name} is verwijderd.`;
      notice.hidden=false;
      setTimeout(()=>{notice.hidden=true;},3500);
    }
  });
  renderPlayerHistory(playerId,'all');

  statsMainView.style.display='none';
  playedStatsView.style.display='none';
  playerStatsView.style.display='';
}

renderAll();

document.addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn)return;
  const txt=(btn.textContent||'').trim().toLowerCase();
  const isFinalize=txt.includes('wedstrijd afronden') ||
                   txt.includes('opslaan in statistieken') ||
                   txt.includes('wedstrijd opslaan in statistieken');
  if(!isFinalize)return;

  const m=state.matches.find(x=>x.id===currentMatchId);
  if(m && !matchMayFinalize(m)){
    e.preventDefault();
    e.stopImmediatePropagation();
    alert('Deze wedstrijd is nog niet gespeeld. Je kunt hem pas na de aanvangstijd afronden en opslaan in de statistieken.');
  }
},true);


async function shareLineupToWhatsApp(){
  const shareBtn=document.getElementById('shareLineupWhatsApp');
  const shareText='CoachBoard – opstelling 1e en 2e helft inclusief wisselspelers.';
  try{
    const response=await fetch('CoachBoard_opstelling_delen.jpg');
    const blob=await response.blob();
    const file=new File([blob],'CoachBoard_opstelling.jpg',{type:'image/jpeg'});
    if(navigator.canShare && navigator.canShare({files:[file]}) && navigator.share){
      await navigator.share({title:'CoachBoard opstelling',text:shareText,files:[file]});
      return;
    }
  }catch(e){}
  window.open('https://wa.me/?text='+encodeURIComponent(shareText),'_blank','noopener');
  alert('WhatsApp is geopend. Voeg de afbeelding CoachBoard_opstelling_delen.jpg toe aan het bericht.');
}
document.getElementById('shareLineupWhatsApp')?.addEventListener('click',shareLineupToWhatsApp);


document.getElementById('closeLineupPreview')?.addEventListener('click',closeLineupPreview);
document.getElementById('lineupPreviewModal')?.addEventListener('click',e=>{
  if(e.target.id==='lineupPreviewModal')closeLineupPreview();
});


document.getElementById('cancelFinishResult')?.addEventListener('click',closeFinishResultModal);
document.getElementById('confirmFinishResult')?.addEventListener('click',confirmFinishResult);
document.getElementById('finishResultModal')?.addEventListener('click',e=>{
  if(e.target.id==='finishResultModal')closeFinishResultModal();
});


document.querySelectorAll('[data-finish-special]').forEach(btn=>{
  btn.addEventListener('click',()=>setFinishSpecialStatus(btn.dataset.finishSpecial));
});


document.querySelectorAll('[data-match-filter]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    setMatchesFilter(btn.dataset.matchFilter);
  });
});


async function ensureHtml2Canvas(){
  if(window.html2canvas)return window.html2canvas;
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    s.onload=()=>resolve(window.html2canvas);
    s.onerror=()=>reject(new Error('Afbeeldingsmodule kon niet worden geladen.'));
    document.head.appendChild(s);
  });
}

function findHalfCaptureElement(half){
  const btn=document.querySelector(`[data-copy-half="${half}"]`);
  if(!btn)return null;

  // Capture the visual half section: field + its substitutes, excluding the heading controls.
  let node=btn.parentElement;
  while(node && node!==document.body){
    const text=node.textContent||'';
    const hasField=node.querySelector?.('.pitch,.football-field,.lineup-field,[class*="pitch"],[class*="field"]');
    const hasHalf=text.includes(`${half}e helft`);
    if(hasField && hasHalf)return node;
    node=node.parentElement;
  }

  // Fallback: nearest section/card around the button.
  return btn.closest('section,.card,[class*="half"]') || btn.parentElement?.nextElementSibling;
}


async function writePngBlobToClipboard(blob){
  if(!navigator.clipboard || !window.ClipboardItem){
    throw new Error('IMAGE_CLIPBOARD_UNSUPPORTED');
  }

  // Rebuild as a true PNG blob so ClipboardItem always receives image bytes,
  // never a URL/string representation.
  const pngBlob=blob.type==='image/png'
    ? blob
    : new Blob([await blob.arrayBuffer()],{type:'image/png'});

  const item=new ClipboardItem({'image/png':pngBlob});
  await navigator.clipboard.write([item]);
}

async function copyHalfAsImage(half,button){
  try{
    const target=findHalfCaptureElement(half);
    if(!target)throw new Error('Opstelling niet gevonden.');

    const html2canvas=await ensureHtml2Canvas();

    // Hide action controls only while the screenshot is generated.
    const controls=target.querySelectorAll('button,select');
    const old=[];
    controls.forEach(el=>{
      old.push([el,el.style.visibility]);
      el.style.visibility='hidden';
    });

    const canvas=await html2canvas(target,{
      backgroundColor:'#ffffff',
      scale:2,
      useCORS:true,
      logging:false
    });

    old.forEach(([el,v])=>el.style.visibility=v);

    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('Afbeelding kon niet worden gemaakt.');

    try{
      await writePngBlobToClipboard(blob);
      const original=button.innerHTML;
      button.innerHTML='✓ Afbeelding gekopieerd';
      button.classList.add('copied');
      setTimeout(()=>{
        button.innerHTML=original;
        button.classList.remove('copied');
      },1800);
    }catch(copyErr){
      // No link is ever copied. Fallback is a real PNG download.
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=`opstelling-${half}e-helft.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      const original=button.innerHTML;
      button.innerHTML='↓ PNG gedownload';
      setTimeout(()=>button.innerHTML=original,1800);
    }
  }catch(err){
    alert('Kopiëren van de afbeelding lukt in deze browser niet. Probeer Chrome, Edge of Safari met klembordtoegang.');
  }
}

document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-copy-half]');
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  copyHalfAsImage(Number(btn.dataset.copyHalf),btn);
});


async function copyPreviewHalfAsImage(half,button){
  try{
    const card=document.querySelector(`[data-preview-card="${half}"]`);
    if(!card)throw new Error('Opstelling niet gevonden.');

    const html2canvas=await ensureHtml2Canvas();

    // Hide only preview control buttons during capture.
    const controls=card.querySelectorAll('button');
    const previous=[];
    controls.forEach(el=>{
      previous.push([el,el.style.visibility]);
      el.style.visibility='hidden';
    });

    const canvas=await html2canvas(card,{
      backgroundColor:'#ffffff',
      scale:2,
      useCORS:true,
      logging:false
    });

    previous.forEach(([el,v])=>el.style.visibility=v);

    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('Afbeelding kon niet worden gemaakt.');

    try{
      await writePngBlobToClipboard(blob);
      const original=button.innerHTML;
      button.innerHTML='✓ Afbeelding gekopieerd';
      button.classList.add('copied');
      setTimeout(()=>{
        button.innerHTML=original;
        button.classList.remove('copied');
      },1800);
    }catch(copyErr){
      // Never place a URL on the clipboard; use a real PNG file fallback.
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download=`opstelling-${half}e-helft.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      const original=button.innerHTML;
      button.innerHTML='↓ PNG gedownload';
      setTimeout(()=>button.innerHTML=original,1800);
    }
  }catch(err){
    alert('Kopiëren van de afbeelding lukt in deze browser niet. Probeer Chrome, Edge of Safari met klembordtoegang.');
  }
}

document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-copy-preview-half]');
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  copyPreviewHalfAsImage(Number(btn.dataset.copyPreviewHalf),btn);
});


document.getElementById('closePlayerEdit')?.addEventListener('click',closePlayerEdit);
document.getElementById('cancelPlayerEdit')?.addEventListener('click',closePlayerEdit);
document.getElementById('savePlayerEdit')?.addEventListener('click',()=>{
  const id=document.getElementById('editPlayerId').value;
  const name=document.getElementById('editPlayerName').value.trim();
  if(!name){alert('Vul een naam in.');return}
  if(!editPlayerSelectedPositions.length){alert('Selecteer minimaal één positie.');return}

  const level=+document.getElementById('editPlayerLevel').value;
  const preferredAvailability=document.getElementById('editPlayerPreferredAvailability').value||'fit';

  if(id){
    const p=state.players.find(x=>x.id===id);if(!p)return;
    const oldDates=[...(p.absenceDates||[])];

    p.name=name;
    p.level=level;
    p.positions=[...editPlayerSelectedPositions];
    p.preferredAvailability=preferredAvailability;
    p.absenceDates=[...editPlayerAbsenceDates].sort();

    syncPlayerAbsenceToUnpreparedMatches(p,oldDates);
  }else{
    const p={
      id:uid('p'),
      name,
      level,
      positions:[...editPlayerSelectedPositions],
      preferredAvailability,
      absenceDates:[...editPlayerAbsenceDates].sort(),
      stats:{minutes:0,matches:0,fit:0,limited:0,noPlay:0,absent:0,fullMatches:0,halfMatches:0}
    };
    state.players.push(p);
    syncPlayerAbsenceToUnpreparedMatches(p,[]);
  }

  saveState();
  closePlayerEdit();
  renderAll();
});

document.getElementById('playerEditModal')?.addEventListener('click',e=>{
  if(e.target.id==='playerEditModal')closePlayerEdit();
});

document.querySelectorAll('[data-pref-status]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    setPreferredAvailabilityStatus(btn.dataset.prefStatus);
  });
});


document.querySelectorAll('[data-player-level]').forEach(btn=>{
  btn.addEventListener('click',()=>setPlayerLevel(btn.dataset.playerLevel));
});


document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-edit-pos]');
  if(!btn)return;
  document.querySelectorAll('[data-edit-pos].show-pos-tip').forEach(x=>{
    if(x!==btn)x.classList.remove('show-pos-tip');
  });
  btn.classList.add('show-pos-tip');
  clearTimeout(btn._posTipTimer);
  btn._posTipTimer=setTimeout(()=>btn.classList.remove('show-pos-tip'),1400);
});


document.getElementById('addPlayerAbsenceDate')?.addEventListener('click',()=>{
  const input=document.getElementById('editPlayerAbsenceDate');
  const date=input?.value;
  if(!date)return;
  if(!editPlayerAbsenceDates.includes(date)){
    editPlayerAbsenceDates.push(date);
    editPlayerAbsenceDates.sort();
  }
  input.value='';
  renderPlayerAbsenceDates();
});


document.getElementById('finishHomeScore')?.addEventListener('input',syncFinishScorerFieldsToScore);
document.getElementById('finishAwayScore')?.addEventListener('input',syncFinishScorerFieldsToScore);


const restorePreparedButton=document.getElementById('restorePreparedBtn');
if(restorePreparedButton){
  restorePreparedButton.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();

    const btn=e.currentTarget;
    const originalText=btn.textContent;

    btn.disabled=true;
    btn.textContent='Herstellen...';

    const ok=restorePreparedMatch(btn);

    if(!ok){
      btn.disabled=false;
      btn.textContent=originalText;
    }
  });
}


document.getElementById('downloadSeasonBook')?.addEventListener('click',e=>{
  e.preventDefault();
  downloadSeasonBookPdf();
});
