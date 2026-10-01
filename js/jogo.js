const LEVELS = [
  { desc:"Um único fragmento foi encontrado. Use a chave acima para traduzir.",
    legendAdd:{S:'𓋴',O:'𓅱',L:'𓃭'},
    clues:[
      {title:'Fragmento de papiro', glyphs:'𓋴 𓅱 𓃭'},
      {title:'Sussurro do escriba', text:'"Não tenho boca, mas acordo todo mundo pela manhã. Nasço sempre no mesmo lugar, e no mesmo lugar, todos os dias, eu morro."'}
    ],
    answer:'SOL' },
  { desc:"Três fragmentos soltos e um sussurro do escriba. Junte as sílabas e resolva a charada.",
    legendAdd:{A:'𓄿',R:'𓂋',E:'𓇋',I:'𓇋'},
    clues:[
      {title:'Fragmento do meio', glyphs:'𓂋 𓇋 𓇋'},
      {title:'Fragmento apagado', glyphs:'𓄿'},
      {title:'Fragmento solto', glyphs:'𓄿'},
      {title:'Charada da duna', text:'"Sou feita de montanhas que o vento e o tempo moeram. Não tenho pés, mas cubro tudo o que caminha. Se tentares me segurar, escorro entre os dedos; se me deixares cair, conto as horas."'}
    ],
    answer:'AREIA' },
  { desc:"Um novo papiro chegou rasgado ao meio. As duas metades contam a mesma história.",
    legendAdd:{},
    clues:[
      {title:'Fragmento de papiro', glyphs:'𓂋 𓇋 𓅱'},
      {title:'Metade rasgada — início', text:'"Corto o deserto sem nascer da chuva;'},
      {title:'Metade rasgada — fim', text:'sigo sempre o mesmo caminho até o mar."'}
    ],
    answer:'RIO' },
  { desc:"Mais fragmentos soltos surgem sobre a mesa, fora de ordem. Junte as sílabas.",
    legendAdd:{T:'𓏏',M:'𓅓',P:'𓊪'},
    clues:[
      {title:'Fragmento gasto', glyphs:'𓊪 𓅱'},
      {title:'Fragmento antigo', glyphs:'𓏏 𓇋 𓅓'}
    ],
    answer:'TEMPO' },
  { desc:"O último papiro foi encontrado inteiro. Ele guarda a verdade final — e uma palavra que você ainda não conhece.",
    legendAdd:{N:'𓈖',D:'𓆓'},
    clues:[
      {title:'O papiro completo',
       text:'"No princípio, havia apenas um olho de fogo que abria e fechava sobre o mundo, sem nunca dormir duas vezes no mesmo lugar: os antigos o chamavam de ___.<br><br>Depois veio algo que nasceu longe e morreu no sal, sem pernas, sem pressa, sem nunca andar em linha reta: os antigos o chamavam de ___.<br><br>O deserto inteiro se curvava diante do que não tinha forma, mas tinha memória de nada — bilhões de grãos, um só nome: os antigos o chamavam de ___.<br><br>E sobre tudo isso havia algo maior, algo que via o olho de fogo nascer e morrer, via o sem-pernas correr, via os grãos se espalharem, sem nunca envelhecer: o ___.<br><br>Mas mesmo isso, um dia, se cala. E o que resta depois do silêncio não tem nome entre os vivos — os sacerdotes só ousavam sussurrar: ___."'},
      {title:'Palavra selada', glyphs:'𓇋 𓏏 𓇋 𓂋 𓈖 𓇋 𓆓 𓄿 𓆓 𓇋', text:'A palavra que os sacerdotes só ousavam sussurrar foi gravada na pedra. Use o caderno de campo (💡 Dica) para decifrar.'},
      {title:'Instrução final', text:'Escreva as cinco palavras que preenchem as lacunas, na ordem, separadas por espaço.'}
    ],
    answer:'SOL RIO AREIA TEMPO ETERNIDADE' }
];
 
let level = 0;
const legendState = {};
const tablePapers = []; // accumulates across levels, never cleared
const PAPER_TINTS = ['#ead9ae', '#e6c398', '#dba888', '#c98268', '#b8674f'];
const FULL_ALPHABET = {
  A:'𓄿', B:'𓃀', D:'𓆓', E:'𓇋', F:'𓆑', G:'𓎼', H:'𓎛',
  I:'𓇋', L:'𓃭', M:'𓅓', N:'𓈖', O:'𓅱', P:'𓊪', R:'𓂋', S:'𓋴', T:'𓏏', U:'𓅱'
};
let dragTarget = null, dragOffset = {x:0,y:0};
 
const $ = id => document.getElementById(id);
 
function renderLegend(){
  $('legend').innerHTML = Object.entries(legendState).map(([l,g])=>
    `<div class="legend-item"><span class="g">${g}</span><span class="l">${l}</span></div>`).join('');
}
function renderProgress(){
  $('progress').innerHTML = LEVELS.map((_,i)=>
    `<div class="dot ${i<level?'done':''} ${i===level?'active':''}"></div>`).join('');
}
 
function scatterPos(i){
  const cols = 3, w = 128, h = 96, pad = 16;
  const col = i % cols, row = Math.floor(i/cols);
  return { x: pad + col*w + (row%2?14:0), y: 165 + row*h };
}
 
function addLevelPapers(){
  const lv = LEVELS[level];
  lv.clues.forEach((c,i)=>{
    const id = `L${level}C${i}`;
    if(!tablePapers.find(p=>p.id===id)){
      const pos = scatterPos(tablePapers.length);
      tablePapers.push({ id, clue:c, opened:false, lvl:level, x:pos.x, y:pos.y, rot:(i%2?1:-1)*(4+i*3) });
    }
  });
}
 
function renderTable(){
  $('levelDesc').textContent = LEVELS[level].desc;
  $('desk').querySelectorAll('.paper').forEach(p=>p.remove());
  tablePapers.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'paper' + (p.opened ? ' done':'');
    el.style.left = p.x+'px'; el.style.top = p.y+'px';
    el.style.transform = `rotate(${p.opened?0:p.rot}deg)`;
    el.dataset.id = p.id;
    el.innerHTML = `<div class="crumple" style="background-color:${PAPER_TINTS[p.lvl] || PAPER_TINTS[0]}">${p.opened?'✓':'?'}</div><div class="tag">${p.clue.title}</div>`;
    el.addEventListener('pointerdown', e=>startDrag(e, el, p));
    el.addEventListener('click', e=>{ if(!el._dragged) openClue(p); });
    $('desk').appendChild(el);
  });
  $('answerInput').value=''; $('feedback').textContent=''; $('feedback').className='feedback';
}
 
function startDrag(e, el, p){ startDragGeneric(e, el, p); }
function startDragGeneric(e, el, p){
  el._dragged = false;
  el.setPointerCapture(e.pointerId);
  dragTarget = { el, p };
  const rect = $('desk').getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left - p.x;
  dragOffset.y = e.clientY - rect.top - p.y;
  el.classList.add('dragging');
  el.addEventListener('pointermove', onDrag);
  el.addEventListener('pointerup', endDrag);
}
function onDrag(e){
  if(!dragTarget) return;
  dragTarget.el._dragged = true;
  const rect = $('desk').getBoundingClientRect();
  const w = dragTarget.el.offsetWidth, h = dragTarget.el.offsetHeight;
  let x = e.clientX - rect.left - dragOffset.x;
  let y = e.clientY - rect.top - dragOffset.y;
  x = Math.max(4, Math.min(rect.width-w-4, x));
  y = Math.max(4, Math.min(rect.height-h-4, y));
  dragTarget.p.x = x; dragTarget.p.y = y;
  dragTarget.el.style.left = x+'px'; dragTarget.el.style.top = y+'px';
}
function endDrag(e){
  if(!dragTarget) return;
  dragTarget.el.classList.remove('dragging');
  dragTarget.el.removeEventListener('pointermove', onDrag);
  dragTarget.el.removeEventListener('pointerup', endDrag);
  setTimeout(()=>{ dragTarget.el._dragged=false; }, 50);
  dragTarget = null;
}
 
function openOverlay(html){
  const content = $('unfoldedContent');
  content.classList.remove('unfolded');
  void content.offsetWidth; // reinicia a animação
  content.classList.add('unfolded');
  content.innerHTML = html;
  $('overlay').classList.add('open');
  document.getElementById('closeOverlay').addEventListener('click',()=> $('overlay').classList.remove('open'));
}
 
function openClue(p){
  const clue = p.clue;
  p.opened = true;
  const el = $('desk').querySelector(`.paper[data-id="${p.id}"]`);
  if(el){ el.classList.add('done'); el.style.transform='rotate(0deg)'; el.querySelector('.crumple').textContent='✓'; }
  let body = '';
  if(clue.glyphs) body += `<div class="glyphs">${clue.glyphs}</div>`;
  if(clue.glyphsVertical) body += `<div class="glyphs vertical">${clue.glyphsVertical.map(g=>`<span>${g}</span>`).join('')}</div>`;
  if(clue.text) body += `<p>${clue.text}</p>`;
  openOverlay(`<h3>${clue.title}</h3>${body}<button class="close-btn" id="closeOverlay">Fechar</button>`);
}
$('overlay').addEventListener('click', e=>{ if(e.target.id==='overlay') $('overlay').classList.remove('open'); });
 
function normalize(s){ return s.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' '); }
 
function toggleHint(){
  const grid = Object.entries(FULL_ALPHABET).map(([l,g])=>
    `<div class="legend-item"><span class="g">${g}</span><span class="l">${l}</span></div>`
  ).join('');
  openOverlay(`
    <h3>Caderno de campo</h3>
    <div class="hint-card">
      <h4>Alfabeto completo do arqueólogo</h4>
      <div class="grid">${grid}</div>
    </div>
    <p class="hint">Consulte os símbolos acima para ajudar a decifrar os papiros.</p>
    <button class="close-btn" id="closeOverlay">Fechar</button>
  `);
}
$('hintBtn').addEventListener('click', toggleHint);
 
function submit(){
  const lv = LEVELS[level];
  const val = normalize($('answerInput').value);
  if(val === normalize(lv.answer)){
    Object.assign(legendState, lv.legendAdd);
    renderLegend();
    level++;
    if(level >= LEVELS.length){ showFinal(); return; }
    $('feedback').textContent = '✦ Decifrado! Novo símbolo revelado na chave.';
    $('feedback').className='feedback ok show';
    renderProgress();
    addLevelPapers();
    setTimeout(renderTable, 500);
  } else {
    $('feedback').textContent = '✕ Ainda não é isso, reveja as pistas na mesa.';
    $('feedback').className='feedback err show';
  }
}
$('submitBtn').addEventListener('click', submit);
$('answerInput').addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
 
const wait = ms => new Promise(r => setTimeout(r, ms));
const toGlyphs = word => word.split('').map(ch => FULL_ALPHABET[ch] || ch).join('');
const glyphSpans = str => str.split(' ').map(g => `<span>${g}</span>`).join('');
 
async function showFinal(){
  renderProgress();
  $('answerBox').style.display = 'none';
  $('levelDesc').textContent = '';
  const desk = $('desk');
  const hint = desk.querySelector('.desk-hint');
  if(hint) hint.style.opacity = '0';
 
  // 1) Os papiros voam até o centro da mesa
  const rect = desk.getBoundingClientRect();
  const cx = (rect.width - 112) / 2, cy = (rect.height - 86) / 2;
  const papers = Array.from(desk.querySelectorAll('.paper'));
  papers.forEach((el, i) => {
    const d = i * 55;
    el.style.pointerEvents = 'none';
    el.style.zIndex = 10 + i;
    el.style.transition = `left .9s ease-in-out ${d}ms, top .9s ease-in-out ${d}ms, transform .9s ease-in-out ${d}ms, opacity .5s ease ${d + 500}ms`;
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    el.style.transform = 'rotate(0deg) scale(.6)';
    el.style.opacity = '0';
  });
  await wait(papers.length * 55 + 1000);
  papers.forEach(el => el.remove());
 
  // 2) Nasce o papiro completo e as palavras são reveladas uma a uma
  const words = LEVELS[LEVELS.length - 1].answer.split(' ');
  const scroll = document.createElement('div');
  scroll.className = 'final-scroll';
  scroll.innerHTML = `<div class="scroll-title">Tábua da Verdade</div>` +
    words.map(w => `<div class="scroll-line"><span class="sg">${toGlyphs(w)}</span></div>`).join('');
  desk.appendChild(scroll);
  void scroll.offsetWidth;
  scroll.classList.add('show');
  await wait(900);
 
  const lines = scroll.querySelectorAll('.scroll-line');
  for(let i = 0; i < lines.length; i++){
    const line = lines[i], sg = line.querySelector('.sg');
    line.classList.add('on');
    await wait(600);
    sg.classList.add('swap');
    await wait(250);
    sg.textContent = words[i];
    sg.classList.add('word');
    sg.classList.remove('swap');
    await wait(450);
  }
  await wait(900);
  scroll.classList.add('hide');
  await wait(750);
  scroll.remove();
 
  // 3) O portal de pedra
  const finale = document.createElement('div');
  finale.className = 'finale';
  finale.innerHTML = `
    <div class="door-glow"></div>
    <div class="final-stage">
      <div class="treasure">
        <div class="rays"></div>
        <svg class="chest" viewBox="0 -30 200 180" aria-hidden="true">
          <defs>
            <linearGradient id="tGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeaa3"/><stop offset="1" stop-color="#d49a2a"/></linearGradient>
            <linearGradient id="tWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5230"/><stop offset="1" stop-color="#4e2a16"/></linearGradient>
          </defs>
          <ellipse cx="100" cy="140" rx="82" ry="7" fill="rgba(0,0,0,.35)"/>
          <path d="M38 76 Q60 44 100 38 Q140 44 162 76 Z" fill="url(#tGold)"/>
          <circle cx="62" cy="64" r="7" fill="#f6c84a" stroke="#b98420"/>
          <circle cx="80" cy="52" r="7" fill="#f6c84a" stroke="#b98420"/>
          <circle cx="118" cy="50" r="7" fill="#f6c84a" stroke="#b98420"/>
          <circle cx="140" cy="64" r="7" fill="#f6c84a" stroke="#b98420"/>
          <circle cx="100" cy="62" r="7" fill="#f6c84a" stroke="#b98420"/>
          <polygon points="92,48 100,38 108,48 100,58" fill="#d9304a" stroke="#7a1022"/>
          <polygon points="70,66 76,58 82,66 76,74" fill="#2f7fe0" stroke="#173f7a"/>
          <polygon points="122,68 128,60 134,68 128,76" fill="#2fb36a" stroke="#14603a"/>
          <rect x="30" y="74" width="140" height="62" rx="6" fill="url(#tWood)" stroke="#2c1608" stroke-width="2"/>
          <rect x="30" y="88" width="140" height="8" fill="url(#tGold)"/>
          <rect x="88" y="82" width="24" height="24" rx="3" fill="url(#tGold)" stroke="#8a5f12" stroke-width="1.5"/>
          <circle cx="100" cy="93" r="3.5" fill="#4e2a16"/>
          <g class="lid">
            <path d="M30 74 V60 Q30 34 100 34 Q170 34 170 60 V74 Z" fill="url(#tWood)" stroke="#2c1608" stroke-width="2"/>
            <rect x="30" y="64" width="140" height="8" fill="url(#tGold)"/>
            <rect x="94" y="62" width="12" height="14" rx="2" fill="url(#tGold)" stroke="#8a5f12" stroke-width="1.2"/>
          </g>
        </svg>
        <span class="spark" style="left:2%;top:12%;animation-delay:2.6s">✦</span>
        <span class="spark" style="left:88%;top:6%;animation-delay:2.9s">✦</span>
        <span class="spark" style="left:20%;top:-6%;animation-delay:3.2s">✦</span>
        <span class="spark" style="left:72%;top:22%;animation-delay:3.5s">✦</span>
        <span class="spark" style="left:48%;top:-12%;animation-delay:3.8s">✦</span>
      </div>
      <div class="final-card">
        <div class="final-glyphs">𓅓 𓂀 𓏏 𓊪</div>
        <h2>O Tesouro do Faraó</h2>
        <p>O sol, o rio, a areia e o tempo mostraram o caminho, e a eternidade abriu a porta. Diante de você está o ouro que nenhum ladrão de tumbas jamais encontrou.</p>
        <p class="final-words">${LEVELS[LEVELS.length - 1].answer.split(' ').join(' · ')}</p>
        <p class="final-closing">Mas guarde isto: o maior tesouro é ter decifrado o que o silêncio escondeu por milhares de anos. Parabéns, o seu nome agora está gravado entre os grandes arqueólogos!</p>
      </div>
    </div>
    <div class="door left"><div class="door-glyphs">${glyphSpans('𓂀 𓋹 𓅓 𓏏 𓊪')}</div></div>
    <div class="door right"><div class="door-glyphs">${glyphSpans('𓊪 𓏏 𓅓 𓋹 𓂀')}</div></div>
    <div class="door-seam"></div>`;
  desk.appendChild(finale);
  void finale.offsetWidth;
  finale.classList.add('show');
  await wait(1100);
 
  // a pedra treme, cai poeira e uma fresta de luz aparece
  finale.classList.add('rumble');
  for(let i = 0; i < 18; i++){
    const d = document.createElement('i');
    d.className = 'dust';
    d.style.left = (44 + Math.random() * 12) + '%';
    d.style.animationDelay = (Math.random() * 1.4) + 's';
    finale.appendChild(d);
  }
  await wait(2100);
 
  // o portal se abre
  finale.classList.remove('rumble');
  finale.classList.add('open');
  await wait(1500);
  finale.querySelectorAll('.dust').forEach(d => d.remove());
}
 
$('beginBtn').addEventListener('click', ()=>{ $('startScreen').style.display='none'; });
 
const GLYPH_SET = ['𓅓','𓂀','𓊪','𓆓','𓃭','𓅱','𓄿','𓋴','𓇋','𓈖','𓎼','𓏏','𓂋','𓎛'];
$('hieroBg').textContent = Array.from({length:600}, (_,i)=>GLYPH_SET[i % GLYPH_SET.length]).join(' ');
 
renderLegend(); renderProgress(); addLevelPapers(); renderTable();
 