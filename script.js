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
  opening.classList.remove('is-opening');
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
  const title = document.querySelector('h1');
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
  opening.classList.add('is-opening');
  document.body.classList.add('opening-reveal');
  if (reducedMotion.matches) finishOpening();
  else openingTimer = setTimeout(finishOpening, opening.dataset.motion && opening.dataset.motion !== 'cut' ? 2850 : 1700);
});
document.getElementById('reopen-invitation').addEventListener('click', () => {
  showInvitation();
  openButton.focus({preventScroll:true});
});

// 확정된 예식 시각을 입력하면 모든 화면에 함께 반영됩니다. 예: '오후 1시'
const ceremonyTime = '오후 5시 30분';
if (ceremonyTime) document.querySelectorAll('.ceremony-time').forEach(el => { el.textContent = ' ' + ceremonyTime; });
const calendarBody = document.getElementById('calendar-body');
for (let week = 0; week < 5; week++) {
  const row = document.createElement('div'); row.className = 'calendar-row'; row.setAttribute('role', 'row');
  for (let day = 0; day < 7; day++) {
    const date = week * 7 + day;
    const cell = document.createElement('span'); cell.setAttribute('role', 'cell');
    if (date >= 1 && date <= 28) cell.textContent = date;
    if (date === 27) { cell.className = 'wedding-day'; cell.setAttribute('aria-label', '27일, 결혼식'); }
    row.append(cell);
  }
  calendarBody.append(row);
}
function updateCountdown() {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  const remaining = Math.round((Date.UTC(2027,1,27)-Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)))/86400000);
  const count = document.getElementById('countdown');
  if (remaining > 0) count.innerHTML = `영선과 은지의 결혼식까지 <strong>${remaining}일</strong> 남았습니다.`;
  else count.textContent = remaining === 0 ? '오늘, 저희 결혼합니다.' : '함께 축복해 주셔서 감사합니다.';
}
updateCountdown(); setInterval(updateCountdown, 60000);
let noticeTimer;
function notify(text) { const el = document.getElementById('notice'); el.textContent = text; el.classList.add('visible'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => el.classList.remove('visible'), 3000); }
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { window.prompt('아래 내용을 복사해 주세요.', text); return false; }
}
document.getElementById('copy-address').addEventListener('click', async () => { if (await copy('서울특별시 중구 장충단로 72')) notify('주소를 복사했습니다.'); });
document.getElementById('share').addEventListener('click', async () => {
  const url = new URL('./', location.href).href;
  if (navigator.share) {
    try { await navigator.share({ title:'윤영선 · 이은지 결혼합니다', text:'2027년 2월 27일 오후 5시 30분 · 크레스트72 글라스 홀', url }); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  if (await copy(url)) notify('청첩장 링크를 복사했습니다.');
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
const viewer = document.getElementById('photo-viewer');
const viewerImage = document.getElementById('viewer-image');
const photos = Array.isArray(media.photos) ? media.photos.filter(p => p && typeof p.src === 'string' && p.src.trim()) : [];
let photoIndex = 0;
let photoTrigger;
function displayPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const photo = photos[photoIndex];
  viewerImage.src = photo.src;
  viewerImage.alt = photo.alt || `영선과 은지의 사진 ${photoIndex + 1}`;
  document.getElementById('photo-position').textContent = `${photoIndex + 1} / ${photos.length}`;
}
function closePhoto() { viewer.close(); }
viewer.addEventListener('close', () => {
  document.body.classList.remove('viewer-open');
  if (photoTrigger && photoTrigger.isConnected) photoTrigger.focus({preventScroll:true});
});
document.getElementById('photo-close').addEventListener('click', closePhoto);
document.getElementById('photo-prev').addEventListener('click', () => displayPhoto(photoIndex - 1));
document.getElementById('photo-next').addEventListener('click', () => displayPhoto(photoIndex + 1));
viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); displayPhoto(photoIndex - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); displayPhoto(photoIndex + 1); }
});
viewerImage.addEventListener('error', () => {
  closePhoto(); notify('사진을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
});
photos.forEach((photo, index) => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'photo-tile';
  button.setAttribute('aria-label', `${photo.alt || `사진 ${index + 1}`} 크게 보기`);
  const img = document.createElement('img');
  img.src = photo.src; img.alt = photo.alt || `영선과 은지의 사진 ${index + 1}`;
  img.loading = 'lazy'; img.decoding = 'async';
  img.addEventListener('error', () => { button.remove(); if (!grid.children.length) gallery.hidden = true; });
  button.append(img); grid.append(button);
  button.addEventListener('click', () => {
    photoTrigger = button; displayPhoto(index);
    viewer.showModal(); document.body.classList.add('viewer-open');
  });
});
if (photos.length) {
  gallery.hidden = false;
  document.querySelector('.photo-controls').hidden = photos.length < 2;
}
const previewMedia = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('media-preview');
if (previewMedia && !photos.length) {
  gallery.hidden = false;
  for (let i = 1; i <= 3; i++) {
    const slot = document.createElement('div'); slot.className = 'photo-placeholder';
    const number = document.createElement('span'); number.textContent = `0${i}`;
    slot.append(number, document.createTextNode(i === 1 ? '대표 사진' : '함께한 순간'));
    grid.append(slot);
  }
  document.getElementById('gallery-caption').textContent = '사진이 들어갈 자리입니다. 실제 사진은 아직 등록하지 않았습니다.';
}
const audio = document.getElementById('background-music');
const musicButton = document.getElementById('music-toggle');
const music = media.music || {};
let musicPausedByGuest = false;
let musicUnavailable = false;
function updateMusicButton() {
  const playing = !audio.paused;
  musicButton.setAttribute('aria-pressed', String(playing));
  musicButton.setAttribute('aria-label', playing ? '배경음악 일시정지' : '배경음악 재생');
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
  musicButton.title = music.title || '배경음악';
  document.querySelector('.quick-nav').classList.add('has-music');
}
audio.addEventListener('play', updateMusicButton);
audio.addEventListener('pause', updateMusicButton);
audio.addEventListener('error', () => {
  musicUnavailable = true;
  musicButton.hidden = true;
  document.querySelector('.quick-nav').classList.remove('has-music');
  notify('배경음악을 불러오지 못했습니다.');
});
musicButton.addEventListener('click', () => {
  if (audio.paused) { musicPausedByGuest = false; playMusic(); }
  else { musicPausedByGuest = true; audio.pause(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) audio.pause(); });
if (previewMedia && !music.src) {
  const note = document.createElement('p'); note.className = 'media-preview-note';
  note.textContent = '배경음악을 등록하면 초대장을 열 때 재생됩니다. 하단에서 언제든 끌 수 있어요.';
  gallery.append(note);
}
// The gallery starts hidden, so restore its deep link after media setup.
if (location.hash === '#gallery' && !gallery.hidden) {
  requestAnimationFrame(() => gallery.scrollIntoView({block:'start', behavior:'instant'}));
}

// Local comparison tools are only shown on the explicitly requested preview route.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('motion-preview')){
  document.body.classList.add('motion-review');
  const variants=[['heart-in','01 · 하트 속으로','리본이 하트로 모인 뒤, 작아지며 안쪽으로 들어갑니다.'],['heart-out','02 · 하트를 통과','완성된 하트가 커지며, 그 안으로 들어가는 느낌입니다.']];
  const panel=document.createElement('aside');panel.className='motion-picker';panel.setAttribute('aria-label','진입 모션 비교');
  const title=document.createElement('p');title.className='motion-picker-title';title.textContent='OPENING STUDY · 하트 모션 2가지';panel.append(title);
  const tabs=document.createElement('div');tabs.className='motion-options';
  const description=document.createElement('p');description.className='motion-description';description.setAttribute('aria-live','polite');
  function choose(v){const middle=panel.querySelector('.motion-actions button:last-child');if(middle)middle.disabled=v[0]==='cut';opening.dataset.motion=v[0];showInvitation();description.textContent=v[2];for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.motion===v[0]));}
  for(const v of variants){const b=document.createElement('button');b.type='button';b.dataset.motion=v[0];b.textContent=v[1];b.onclick=()=>choose(v);tabs.append(b);}panel.append(tabs,description);
  const actions=document.createElement('div');actions.className='motion-actions';
  for(const [label,action] of [['다시 재생',()=>{showInvitation();requestAnimationFrame(()=>requestAnimationFrame(()=>openButton.click()));}],['중간 모양 보기',()=>{showInvitation();opening.dataset.inspect='true';}]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;actions.append(b);}
  panel.append(actions);document.body.append(panel);choose(variants.find(v=>v[0]===new URLSearchParams(location.search).get('motion'))||variants[0]);
}
