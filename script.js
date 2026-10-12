 'use strict';

const opening = document.getElementById('invitation-opening');
const openButton = document.getElementById('open-invitation');
const invitationMain = document.querySelector('main');
let openingStarted = false;
let openingTimer;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function showInvitation() {
  clearTimeout(openingTimer);
  openingStarted = false;
  opening.classList.remove('is-opening', 'departing');
  opening.style.opacity='1';
  delete opening.dataset.inspect;
  openButton.removeAttribute('aria-disabled');
  opening.hidden = false;
  document.body.classList.remove('opening-reveal');
  document.body.classList.add('opening-active');
  invitationMain.inert = true;
  window.scrollTo({top:0, behavior:'instant'});
}
function finishOpening() {
  opening.hidden = true;
  document.body.classList.remove('opening-active', 'opening-reveal');
  invitationMain.inert = false;
  document.getElementById('invitation').scrollIntoView({behavior:'instant'});
  const title = document.querySelector('#invitation h2');
  title.setAttribute('tabindex','-1');
  title.focus({preventScroll:true});
}
if (!location.hash) showInvitation();
openButton.addEventListener('click', () => {
  if (openingStarted) return;
  delete opening.dataset.inspect;
  openingStarted = true;
  if (!musicPausedByGuest) playMusic();
  openButton.setAttribute('aria-disabled', 'true');
  opening.classList.add('is-opening', 'departing');
  document.body.classList.add('opening-reveal');
  if (reducedMotion.matches) finishOpening();
  else openingTimer = setTimeout(finishOpening, 2300);
});
document.getElementById('reopen-invitation').addEventListener('click', () => {
  audio.pause();
  showInvitation();
  openButton.focus({preventScroll:true});
});

// �뺤젙�� �덉떇 �쒓컖�� �낅젰�섎㈃ 紐⑤뱺 �붾㈃�� �④퍡 諛섏쁺�⑸땲��. ��: '�ㅽ썑 1��'
const ceremonyTime = '�ㅽ썑 5�� 30遺�';
if (ceremonyTime) document.querySelectorAll('.ceremony-time').forEach(el => { el.textContent = ' ' + ceremonyTime; });
const calendarBody = document.getElementById('calendar-body');
for (let week = 0; week < 5; week++) {
  const row = document.createElement('div'); row.className = 'calendar-row'; row.setAttribute('role', 'row');
  for (let day = 0; day < 7; day++) {
    const date = week * 7 + day;
    const cell = document.createElement('span'); cell.setAttribute('role', 'cell');
    if (date >= 1 && date <= 28) cell.textContent = date;
    if (date === 27) { cell.className = 'wedding-day'; cell.setAttribute('aria-label', '27��, 寃고샎��'); }
    row.append(cell);
  }
  calendarBody.append(row);
}
function updateCountdown() {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  const remaining = Math.round((Date.UTC(2027,1,27)-Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)))/86400000);
  const count = document.getElementById('countdown');
  if (remaining > 0) count.innerHTML = `�곸꽑怨� ��吏��� 寃고샎�앷퉴吏� <strong>${remaining}��</strong> �⑥븯�듬땲��.`;
  else count.textContent = remaining === 0 ? '�ㅻ뒛, ���� 寃고샎�⑸땲��.' : '�④퍡 異뺣났�� 二쇱뀛�� 媛먯궗�⑸땲��.';
}
updateCountdown(); setInterval(updateCountdown, 60000);
let noticeTimer;
function notify(text) { const el = document.getElementById('notice'); el.textContent = text; el.classList.add('visible'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => el.classList.remove('visible'), 3000); }
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { window.prompt('�꾨옒 �댁슜�� 蹂듭궗�� 二쇱꽭��.', text); return false; }
}
document.getElementById('copy-address').addEventListener('click', async () => { if (await copy('�쒖슱�밸퀎�� 以묎뎄 �μ땐�⑤줈 72')) notify('二쇱냼瑜� 蹂듭궗�덉뒿�덈떎.'); });
document.getElementById('share').addEventListener('click', async () => {
  const url = new URL('./', location.href).href;
  if (navigator.share) {
    try { await navigator.share({ title:'�ㅼ쁺�� 쨌 �댁�吏� 寃고샎�⑸땲��', text:'2027�� 2�� 27�� �ㅽ썑 5�� 30遺� 쨌 �щ젅�ㅽ듃72 湲��쇱뒪 ��', url }); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  if (await copy(url)) notify('泥�꺽�� 留곹겕瑜� 蹂듭궗�덉뒿�덈떎.');
});

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if(entry.isIntersecting) {entry.target.classList.add('revealed');observer.unobserve(entry.target);} });
  }, {threshold:0.12});
  document.querySelectorAll('.section > h2, .invitation-copy, .families, .date-display, .calendar, .directions, .closing').forEach(el => {el.classList.add('reveal-ready');observer.observe(el);});
}

// Optional photographs and music. Empty settings never produce broken media.
const media = window.INVITATION_MEDIA || {};
const gallery = document.getElementById('gallery');
const grid = document.getElementById('photo-grid');
const photos = Array.isArray(media.photos) ? media.photos.filter(p => p && typeof p.src === 'string' && p.src.trim()) : [];
const featured = document.createElement('div'); featured.className = 'gallery-featured';
const featuredImage = document.createElement('img'); featuredImage.decoding = 'async';
const strip = document.createElement('div'); strip.className = 'gallery-thumbnails'; strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', '�ъ쭊 �좏깮');

const thumbnails = [];
function selectPhoto(index) {
  const photo = photos[index];
  featuredImage.src = photo.src;
  featuredImage.alt = photo.alt || `�곸꽑怨� ��吏��� �ъ쭊 ${index + 1}`;
  featuredImage.hidden = false;
  featured.querySelector('.photo-error')?.remove();
  thumbnails.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
}
featuredImage.addEventListener('error', () => {
  featuredImage.hidden = true;
  if (!featured.querySelector('.photo-error')) {
    const message = document.createElement('p'); message.className = 'photo-error';
    message.textContent = '�ъ쭊�� 遺덈윭�ㅼ� 紐삵뻽�댁슂. �ㅻⅨ �ъ쭊�� �좏깮�� 二쇱꽭��.';
    featured.append(message);
  }
});
featured.append(featuredImage); grid.append(featured, strip);
photos.forEach((photo, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'gallery-thumbnail';
  button.setAttribute('aria-label', `�ъ쭊 ${index + 1} �좏깮`);
  const img = document.createElement('img'); img.src = photo.src; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
  button.append(img); strip.append(button); thumbnails.push(button);
  button.addEventListener('click', () => selectPhoto(index));
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % photos.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + photos.length) % photos.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = photos.length - 1;
    if (next !== undefined) { event.preventDefault(); selectPhoto(next); thumbnails[next].focus({preventScroll:true}); thumbnails[next].scrollIntoView({block:'nearest', inline:'nearest'}); }
  });
});
for (let index = photos.length; index < 3; index++) {
  const slot = document.createElement('div'); slot.className = 'gallery-thumbnail-placeholder'; slot.textContent = '�ъ쭊 以�鍮� 以�'; strip.append(slot);
}
if (photos.length) selectPhoto(0);
else { featuredImage.hidden = true; featured.textContent = '�곕━�� �ъ쭊�� 怨� �닿납�� �댁쓣寃뚯슂.'; }
gallery.hidden = false;
const previewMedia = ['localhost', '127.0.0.1'].includes(location.hostname);
const audio = document.getElementById('background-music');
const musicButton = document.getElementById('music-toggle');
const music = media.music || {};
let musicPausedByGuest = false;
let musicUnavailable = false;
function updateMusicButton() {
  const playing = !audio.paused;
  musicButton.setAttribute('aria-pressed', String(playing));
  for (const button of [musicButton]) {
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? '諛곌꼍�뚯븙 �쇱떆�뺤�' : '諛곌꼍�뚯븙 �ъ깮');
  }
  musicButton.querySelector('.nav-music-label').textContent = playing ? '�뚯븙 �꾧린' : '�뚯븙 耳쒓린';
}
async function playMusic() {
  if (!music.src || musicUnavailable) return;
  try { await audio.play(); }
  catch { updateMusicButton(); }
}
if (typeof music.src === 'string' && music.src.trim()) {
  audio.src = music.src;
  audio.volume = Number.isFinite(music.volume) ? Math.min(1, Math.max(0, music.volume)) : 0.25;
  musicButton.hidden = false;
  musicButton.title = music.title || '諛곌꼍�뚯븙';
  document.querySelector('.quick-nav').classList.add('has-music');
}
audio.addEventListener('play', updateMusicButton);
audio.addEventListener('pause', updateMusicButton);
audio.addEventListener('error', () => {
  musicUnavailable = true;
  musicButton.hidden = true;
  document.querySelector('.quick-nav').classList.remove('has-music');
  notify('諛곌꼍�뚯븙�� 遺덈윭�ㅼ� 紐삵뻽�듬땲��.');
});
function toggleMusic() {
  if (!music.src) { notify('諛곌꼍�뚯븙 �뚯씪�� �꾩쭅 �깅줉�섏� �딆븯�듬땲��.'); return; }
  if (audio.paused) { musicPausedByGuest = false; playMusic(); }
  else { musicPausedByGuest = true; audio.pause(); }
}
[musicButton].forEach(button => button.addEventListener('click', toggleMusic));
// Playback begins only when the guest opens the invitation.
document.addEventListener('visibilitychange', () => { if (document.hidden) audio.pause(); });
if (previewMedia && !music.src) {
  musicButton.hidden = false;
  musicButton.setAttribute('aria-label', '諛곌꼍�뚯븙 以�鍮� 以�');
  musicButton.setAttribute('aria-disabled', 'true');
  document.querySelector('.quick-nav').classList.add('has-music');
  const note = document.createElement('p'); note.className = 'media-preview-note';
  note.textContent = '諛곌꼍�뚯븙�� �깅줉�섎㈃ 珥덈��μ쓣 �� �� �ъ깮�⑸땲��. �섎떒�먯꽌 �몄젣�� �� �� �덉뼱��.';
  gallery.append(note);
}
// The gallery starts hidden, so restore its deep link after media setup.
if (location.hash === '#gallery' && !gallery.hidden) {
  requestAnimationFrame(() => gallery.scrollIntoView({block:'start', behavior:'instant'}));
}

// Local comparison tools are only shown on the explicitly requested preview route.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('motion-preview')){
  document.body.classList.add('motion-review');
  const variants=[['heart-in','01 쨌 �섑듃 �띿쑝濡�','由щ낯�� �섑듃濡� 紐⑥씤 ��, �묒븘吏�硫� �덉そ�쇰줈 �ㅼ뼱媛묐땲��.'],['heart-out','02 쨌 �섑듃瑜� �듦낵','�꾩꽦�� �섑듃媛� 而ㅼ�硫�, 洹� �덉쑝濡� �ㅼ뼱媛��� �먮굦�낅땲��.']];
  const panel=document.createElement('aside');panel.className='motion-picker';panel.setAttribute('aria-label','吏꾩엯 紐⑥뀡 鍮꾧탳');
  const title=document.createElement('p');title.className='motion-picker-title';title.textContent='OPENING STUDY 쨌 �섑듃 紐⑥뀡 2媛�吏�';panel.append(title);
  const tabs=document.createElement('div');tabs.className='motion-options';
  const description=document.createElement('p');description.className='motion-description';description.setAttribute('aria-live','polite');
  function choose(v){const middle=panel.querySelector('.motion-actions button:last-child');if(middle)middle.disabled=v[0]==='cut';opening.dataset.motion=v[0];showInvitation();description.textContent=v[2];for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.motion===v[0]));}
  for(const v of variants){const b=document.createElement('button');b.type='button';b.dataset.motion=v[0];b.textContent=v[1];b.onclick=()=>choose(v);tabs.append(b);}panel.append(tabs,description);
  const actions=document.createElement('div');actions.className='motion-actions';
  for(const [label,action] of [['�ㅼ떆 �ъ깮',()=>{showInvitation();requestAnimationFrame(()=>requestAnimationFrame(()=>openButton.click()));}],['以묎컙 紐⑥뼇 蹂닿린',()=>{showInvitation();opening.dataset.inspect='true';}]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;actions.append(b);}
  panel.append(actions);document.body.append(panel);choose(variants.find(v=>v[0]===new URLSearchParams(location.search).get('motion'))||variants[0]);
}

// Local typography study: same content, three independent type pairings.
if (['localhost','127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('type-preview')) {
  finishOpening();
  document.body.classList.add('type-review');
  const panel = document.createElement('aside'); panel.className='type-picker'; panel.setAttribute('aria-label','湲�瑗� �쒖븞 鍮꾧탳');
  const label=document.createElement('p'); label.textContent='TYPE STUDY'; panel.append(label);
  const options=[['editorial','01 �뉗� 紐낆“','媛�踰쇱슫 紐낆“ �쒕ぉ 쨌 �⑥젙�� 怨좊뵓 蹂몃Ц'],['literary','02 李⑤텇�� 紐낆“','�묎퀬 �ъ쑀 �덈뒗 紐낆“ �쒕ぉ 쨌 紐낆“ 珥덈�湲�'],['modern','03 �덉젣�� 怨좊뵓','�묒� 怨좊뵓 �쒕ぉ 쨌 �볦� �щ갚怨� �뉗� �곷Ц �レ옄']];
  const note=document.createElement('p'); note.className='type-note'; note.setAttribute('aria-live','polite');
  for(const [key,title,description] of options){const b=document.createElement('button'); b.type='button';b.textContent=title;b.dataset.type=key;b.onclick=()=>{document.body.dataset.typography=key;note.textContent=description;for(const el of panel.querySelectorAll('button'))el.setAttribute('aria-pressed',String(el===b));};panel.append(b);}
  panel.append(note);document.body.append(panel);panel.querySelector('[data-type="literary"]').click();
}

// Mobile pinch protection; one-finger scrolling and gallery swiping stay enabled.
function preventPinch(event) {
  if (event.touches && event.touches.length > 1) event.preventDefault();
}
document.addEventListener('touchstart', preventPinch, { passive: false });
document.addEventListener('touchmove', preventPinch, { passive: false });
for (const eventName of ['gesturestart', 'gesturechange']) {
  document.addEventListener(eventName, event => event.preventDefault(), { passive: false });
}
