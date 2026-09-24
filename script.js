 'use strict';

const opening = document.getElementById('invitation-opening');
const openButton = document.getElementById('open-invitation');
const invitationMain = document.querySelector('main');
let openingStarted = false;
let openingTimer;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function showGarden() {
  clearTimeout(openingTimer);
  openingStarted = false;
  opening.classList.remove('is-opening');
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
if (!location.hash) showGarden();
openButton.addEventListener('click', () => {
  if (openingStarted) return;
  openingStarted = true;
  openButton.setAttribute('aria-disabled', 'true');
  opening.classList.add('is-opening');
  document.body.classList.add('opening-reveal');
  if (reducedMotion.matches) finishOpening();
  else openingTimer = setTimeout(finishOpening, 3400);
});
document.getElementById('reopen-garden').addEventListener('click', () => {
  showGarden();
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
