const LEVELS = [
  { desc:"Um único fragmento foi encontrado. Use a chave acima para traduzir.",
    legendAdd:{S:'𓋴',O:'𓅱',L:'𓃭'},
    clues:[
      {title:'Fragmento de papiro', glyphs:'𓋴 𓅱 𓃭'},
      {title:'Sussurro do escriba', text:'"Não tenho boca, mas acordo todo mundo pela manhã. Nasço sempre no mesmo lugar, e no mesmo lugar, todos os dias, eu morro."'}
    ],
    answer:'SOL' },
  { desc:"Três fragmentos soltos, fora de ordem. Junte as sílabas para formar a palavra.",
    legendAdd:{A:'𓄿',R:'𓂋',E:'𓇋',I:'𓇋'},
    clues:[
      {title:'Fragmento do meio', glyphs:'𓂋 𓇋 𓇋'},
      {title:'Fragmento apagado', glyphs:'𓄿'},
      {title:'Fragmento solto', glyphs:'𓄿'}
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

function showFinal(){
  renderProgress();
  $('desk').querySelectorAll('.paper').forEach(p=>p.remove());
  $('answerBox').style.display='none';
  $('levelDesc').textContent='';
  $('desk').insertAdjacentHTML('beforeend', `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;">
    <div class="final-card">
      <div class="final-glyphs">𓅓 𓂀 𓏏 𓊪</div>
      <h2>A pedra se abre em silêncio</h2>
      <p>O sol nasceu e morreu mil vezes sobre esta areia. O rio correu e nunca voltou. E ainda assim, tudo isso não era o tesouro — era só o caminho até ele.</p>
      <p class="final-answer">${LEVELS[LEVELS.length-1].answer}</p>
      <p class="final-closing">Cinco fragmentos, uma verdade: tudo passa, menos o que não teve começo. Você não encontrou ouro nesta tumba — encontrou a única coisa que nenhum faraó conseguiu levar consigo.</p>
    </div>
  </div>`);
}

$('beginBtn').addEventListener('click', ()=>{ $('startScreen').style.display='none'; });

const GLYPH_SET = ['𓅓','𓂀','𓊪','𓆓','𓃭','𓅱','𓄿','𓋴','𓇋','𓈖','𓎼','𓏏','𓂋','𓎛'];
$('hieroBg').textContent = Array.from({length:600}, (_,i)=>GLYPH_SET[i % GLYPH_SET.length]).join(' ');

renderLegend(); renderProgress(); addLevelPapers(); renderTable();