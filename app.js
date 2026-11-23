/* =====================================================================
   CC Learning – KLEE course platform (plain JavaScript, no build step)
   ---------------------------------------------------------------------
   HOW IT IS ORGANISED (read top to bottom):
   1. DATA      – courses, modules, lessons, question bank
   2. STATE     – saved in localStorage (progress, notes, premium demo flag)
   3. ROUTER    – hash-based (#/course/foundation) so it works on GitHub Pages
   4. VIEWS     – functions that return HTML strings for each page
   5. ACTIONS   – one click handler; buttons use data-act="name"
   6. PLAYER / TEST ENGINE / CHECKOUT – the interactive parts

   NOTE: In a real product, premium access is checked on the SERVER.
   Here it is just a flag in localStorage so you can see both views.
   ===================================================================== */
(() => {
'use strict';

/* ---------- 1. DATA ---------- */
/* A lesson is a YouTube video. yt = the video ID from the link (youtube.com/watch?v=ID).
   Videos belong to their creators and are shown through YouTube's official embedded player. */
const L = (title, yt) => ({ title, yt, mins: 0, free: true });

const COURSES = [
  { id: 'klee-3yr', title: 'KLEE 3-Year LLB Complete', color: '#1b2a49', tag: 'Flagship',
    price: 0, mrp: 0, level: 'Graduates',
    desc: 'Orientation, legal aptitude, English and GK classes for the Kerala Law Entrance Exam (3-year LLB), gathered in one place with quizzes and mock tests.',
    learn: ['Understand the KLEE pattern and how to plan your preparation', 'Practise legal aptitude with worked examples', 'Improve English and general-knowledge scores', 'Test yourself with CC Learning quizzes and timed mock tests'],
    modules: [
      { title: 'Start Here', topic: 'gk', lessons: [L('Kerala Law Entrance Exam (KLEE) 2026 – Complete Orientation', 'PqKPMGoXrxk'), L('KLEE Free Online Coaching', 'ZiF0ZpseQHQ'), L('KLEE 2024 – 3 Month LLB Entrance Coaching', 'TCTvFuo9KF8')] },
      { title: 'Legal Aptitude', topic: 'legal', lessons: [L('KLEE Legal Aptitude – Video 1', 'KU8zncNzyAA'), L('KLEE 2019 · 3-Year LLB · Legal Aptitude, Part 1', 'FOBGJBgYrUI'), L('Legal for KLEE / CUSAT LLB 2024', 'mXRwdHA6UBo')] },
      { title: 'English', topic: 'english', lessons: [L('English for KLEE 2024', 'b8b0ZfY79Pc')] },
      { title: 'General Knowledge', topic: 'gk', lessons: [L('A Question from GK for KLEE 2024', '_noaF5NyCPc')] }
    ],
    faq: [['Who is this course for?', 'Students preparing for the Kerala Law Entrance Exam, especially the 3-year LLB.'], ['Where do the videos come from?', 'They are public YouTube videos by their original creators, shown through YouTube’s own player. Use the “Watch on YouTube” link under any video to open it there.'], ['Are the quizzes official?', 'No. The quizzes and mock tests are written by CC Learning for practice and are not official KLEE questions.']] },
  { id: 'klee-5yr', title: 'KLEE 5-Year Integrated LLB', color: '#5b3a1e', tag: 'Integrated',
    price: 0, mrp: 0, level: 'After 12th',
    desc: 'Videos for students aiming at integrated LLB through KLEE, including Malayalam-language guidance on the Kerala law entrance.',
    learn: ['Know the integrated LLB route and exam stages', 'Follow Malayalam explanations of the Kerala law entrance', 'Pick up preparation tips from earlier years'],
    modules: [
      { title: 'Integrated LLB Guidance', topic: 'gk', lessons: [L('Integrated LLB', 'm3nissHoCMw'), L('കേരള ലോ എൻട്രൻസ് 2025', '0r6zPVuxPHY'), L('കേരള ലോ എൻട്രൻസ് 2024', 'TksncTtLiIE')] },
      { title: 'Free Coaching Series', topic: 'reasoning', lessons: [L('LLB Free Online Entrance Coaching – Video 3', 'pnzx4FE1uD8')] }
    ],
    faq: [['Is this only for 5-year LLB?', 'The videos focus on integrated LLB, but most KLEE topics overlap with the 3-year course.'], ['Why are some titles in Malayalam?', 'They are the original YouTube titles.']] },
  { id: 'klee-papers', title: 'KLEE Previous Papers and Revision', color: '#2f4b3c', tag: 'Revision',
    price: 0, mrp: 0, level: 'All levels',
    desc: 'Walk through question papers from earlier years, then revise English and GK with focused videos and timed mock tests.',
    learn: ['See how past papers are structured', 'Learn from worked solutions', 'Revise quickly before the exam'],
    modules: [
      { title: 'Past Papers', topic: 'legal', lessons: [L('KLEE 2024', 'yVOkoi7Y3f4'), L('KLEE 2023', 'Ql0GC7--J1Y'), L('KLEE 2022', 'ggZEipEI0gw')] },
      { title: 'Quick Revision', topic: 'english', lessons: [L('English for KLEE 2024 (revision)', 'b8b0ZfY79Pc'), L('A Question from GK for KLEE 2024 (revision)', '_noaF5NyCPc')] }
    ],
    faq: [['Are these official solutions?', 'No. They are third-party YouTube videos; always check the official notification for the latest pattern.']] }
];
COURSES.forEach(c => {
  c.lessons = [];
  c.modules.forEach((m, mi) => m.lessons.forEach((l, li) => { l.key = `${c.id}-${mi}-${li}`; l.topic = m.topic; l.module = m.title; c.lessons.push(l); }));
  c.totalMins = 0;
});

/* Question bank (original questions). a = index of the correct option */
const BANK = [
  { t: 'legal', q: 'Principle: A person who causes harm through negligence is liable. Facts: Ravi drives carefully but a tree falls on his car and it hits Meena. Is Ravi liable?', o: ['Yes, he caused the harm', 'No, there was no negligence on his part', 'Only if he is insured', 'Only if Meena sues'], a: 1, e: 'Liability needs negligence; Ravi took reasonable care and the cause was outside his control.' },
  { t: 'legal', q: 'Which set of elements is required for a valid contract?', o: ['Offer, acceptance and consideration', 'Offer and a witness', 'Consideration only', 'A written document only'], a: 0, e: 'A contract needs an offer, acceptance and lawful consideration (plus capacity and free consent).' },
  { t: 'legal', q: 'Principle: A promise without consideration is void. Facts: Asha promises to gift Bilal ₹1000 and receives nothing in return. Bilal sues. Likely result?', o: ['Bilal wins', 'Bilal loses; no consideration', 'Asha must pay double', 'The court decides by lottery'], a: 1, e: 'Without consideration the promise is unenforceable under the stated principle.' },
  { t: 'reasoning', q: 'Find the next number: 3, 6, 11, 18, 27, ?', o: ['36', '38', '40', '42'], a: 1, e: 'Differences are 3, 5, 7, 9, so the next difference is 11 and 27 + 11 = 38.' },
  { t: 'reasoning', q: 'All lawyers are readers. Which statement definitely follows?', o: ['All readers are lawyers', 'Some readers are lawyers', 'No reader is a lawyer', 'Some lawyers are not readers'], a: 1, e: 'If all lawyers are readers, at least some readers are lawyers.' },
  { t: 'reasoning', q: 'A is the brother of B. B is the sister of C. C is the father of D. How is A related to D?', o: ['Father', 'Cousin', 'Uncle', 'Brother'], a: 2, e: 'A and C are siblings, and C is D’s father, so A is D’s uncle.' },
  { t: 'english', q: 'Choose the closest meaning of “prudent”.', o: ['Careless', 'Wise and careful', 'Angry', 'Hasty'], a: 1, e: 'Prudent means acting with care and good judgement.' },
  { t: 'english', q: 'Fill in the blank: Neither of the two candidates ___ qualified.', o: ['were', 'are', 'was', 'have been'], a: 2, e: '“Neither” takes a singular verb.' },
  { t: 'english', q: 'What does the idiom “to burn the midnight oil” mean?', o: ['To waste fuel', 'To work or study late into the night', 'To start a fire', 'To wake up early'], a: 1, e: 'It means working late at night.' },
  { t: 'gk', q: 'The Constitution of India came into effect on:', o: ['15 August 1947', '26 November 1949', '26 January 1950', '2 October 1950'], a: 2, e: 'It was adopted in 1949 and came into force on 26 January 1950.' },
  { t: 'gk', q: 'Article 21 of the Constitution of India deals with:', o: ['Right to equality', 'Protection of life and personal liberty', 'Freedom of religion', 'Right to property'], a: 1, e: 'Article 21 protects life and personal liberty.' },
  { t: 'gk', q: 'Who is the head of the Indian judiciary?', o: ['President', 'Prime Minister', 'Chief Justice of India', 'Attorney General'], a: 2, e: 'The Chief Justice of India heads the Supreme Court and the judiciary.' }
];
const TOPIC_NAME = { legal: 'Legal Aptitude', reasoning: 'Logical Reasoning', english: 'English', gk: 'GK' };
const MOCKS = [
  { id: 1, title: 'Full Mock Test 1', free: true, mins: 20 },
  { id: 2, title: 'Full Mock Test 2', free: false, mins: 20 },
  { id: 3, title: 'Full Mock Test 3', free: false, mins: 20 }
];

/* ---------- 2. STATE ---------- */
const KEY = 'gavelwise.v1';
const DEFAULTS = { user: null, premium: {}, done: {}, notes: {}, comments: {}, tests: [], dark: false, quiz: {} };
let S = load();
function load() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { ...DEFAULTS }; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }

const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupees = n => '₹' + n.toLocaleString('en-IN');
const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const course = id => COURSES.find(c => c.id === id);
const isPro = () => true; /* every course is unlocked */
const anyPro = () => COURSES.some(isPro);
const pct = c => Math.round(100 * c.lessons.filter(l => S.done[l.key]).length / c.lessons.length);
const canView = (c, l) => l.free || isPro(c);
const ui = { ctab: 'overview', ltab: 'notes', q: '' };

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 2600); }
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="card">${html}</div>`; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; }

/* ---------- 3. ROUTER ---------- */
function router() {
  stopPlayer();
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const [p, a, b] = parts;
  if (p !== 'test' && T && T.timer) { clearInterval(T.timer); T = null; }
  let html;
  if (!p) html = home();
  else if (p === 'course') html = courseView(course(a));
  else if (p === 'learn') html = learnView(course(a), b);
  else if (p === 'checkout') html = checkoutView(course(a));
  else if (p === 'tests') html = testsView();
  else if (p === 'test') html = testView(a);
  else if (p === 'dashboard') html = dashboardView();
  else html = `<div class="card pad"><h2>Page not found</h2><a class="btn" href="#/">Back to courses</a></div>`;
  app.innerHTML = html;
  document.querySelectorAll('[data-nav]').forEach(x => x.classList.toggle('on', x.dataset.nav === (p || '')));
  $('#nav').classList.remove('open');
  if (p === 'learn') afterLearn(course(a), b);
  if (p === 'test' && T && !T.done) startTestTimer();
  window.scrollTo(0, 0);
  authSlot();
}
window.addEventListener('hashchange', router);

function authSlot() {
  $('#authslot').innerHTML = S.user
    ? `<button class="ghost" data-act="logout">👤 ${esc(S.user.name.split(' ')[0])} · Log out</button>`
    : `<button class="btn sm" data-act="login">Log in</button>`;
  document.documentElement.dataset.theme = S.dark ? 'dark' : 'light';
}

/* ---------- 4. VIEWS ---------- */
function stars(n) { return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)); }

function courseCard(c) {
  const p = pct(c);
  return `<article class="card cc">
    <div class="thumb" style="background:linear-gradient(135deg,${c.color},#0b1220)"><span class="ribbon">★ Premium</span>${esc(c.title)}</div>
    <div class="body">
      <div><span class="pill">${c.tag}</span> <span class="pill pro">Unlocked</span></div>
      <div class="muted small">${c.level} · ${c.lessons.length} video lessons</div>
      <p class="small muted" style="margin:0">${esc(c.desc)}</p>
      ${p ? `<div class="bar2"><i style="width:${p}%"></i></div><div class="small muted">${p}% complete</div>` : ''}
      <a class="btn" href="#/course/${c.id}">${p ? 'Continue' : 'Open course'}</a>
    </div></article>`;
}
function gridHtml() {
  const q = ui.q.trim().toLowerCase();
  const list = COURSES.filter(c => !q || (c.title + c.desc + c.level).toLowerCase().includes(q));
  return list.length ? list.map(courseCard).join('') : '<p class="muted">No courses match your search.</p>';
}
function home() {
  return `<section class="hero">
    <div><span class="pill pro">★ Premium · All courses unlocked</span>
      <h1>Crack KLEE with curated video classes, quizzes and mock tests.</h1>
      <p class="muted">CC Learning brings Kerala Law Entrance Exam videos together with notes, practice quizzes, timed mock tests and progress tracking.</p>
      <div class="search"><input id="q" placeholder="Search courses…" value="${esc(ui.q)}" aria-label="Search courses"></div>
      <div class="stats"><div><b>${COURSES.length}</b>courses</div><div><b>${COURSES.reduce((a, c) => a + c.lessons.length, 0)}</b>video lessons</div><div><b>${MOCKS.length}</b>mock tests</div></div>
    </div>
    <div class="heroart"><h2>Watch. Practise. Review.</h2><p>Every lesson has a notes pad, quick quiz and discussion board. Mock tests give you negative marking and detailed explanations.</p></div>
  </section>
  <h2>Courses</h2><div class="grid" id="grid">${gridHtml()}</div>
  <div class="feat">
    <div class="card"><div class="ic">🎬</div><h3>Video lessons</h3><p class="muted small">KLEE classes played through YouTube’s official player.</p></div>
    <div class="card"><div class="ic">📝</div><h3>Notes and quizzes</h3><p class="muted small">Notes save in your browser. Quick checks after each lesson.</p></div>
    <div class="card"><div class="ic">⏱</div><h3>Mock tests</h3><p class="muted small">Timed, negative marking, full review.</p></div>
    <div class="card"><div class="ic">📊</div><h3>Progress tracking</h3><p class="muted small">Rings, history and per-topic accuracy.</p></div>
  </div>`;
}

function courseView(c) {
  if (!c) return notFound();
  return `<div class="crumbs"><a href="#/">Courses</a> › ${esc(c.title)}</div>
  <div class="chead"><div>
    <span class="pill">${c.tag}</span> <span class="pill pro">★ Premium unlocked</span>
    <h1>${esc(c.title)}</h1><p class="muted">${esc(c.desc)}</p>
    <p class="small muted">${c.level} · ${c.lessons.length} video lessons · ${c.modules.length} modules</p>
    <div class="tabs" id="ctabs">${[['overview', 'Overview'], ['syllabus', 'Syllabus'], ['sources', 'Video sources'], ['faq', 'FAQ']].map(t => `<button data-act="ctab" data-tab="${t[0]}" class="${ui.ctab === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div>
    <div id="cpanel">${coursePanel(c)}</div>
  </div>
  <aside class="card pad sticky">
    <div class="gold">★ Premium access</div>
    <h3 style="margin-top:6px">Everything is unlocked</h3>
    <a class="btn alt full" href="#/learn/${c.id}/${nextLesson(c).key}">${pct(c) ? 'Continue learning' : 'Start learning'}</a>
    <p class="small muted">Progress: <b>${pct(c)}%</b></p><div class="bar2"><i style="width:${pct(c)}%"></i></div>
    <ul class="small muted"><li>${c.lessons.length} video lessons</li><li>Notes, quizzes and downloadable practice sheets</li><li>All mock tests included</li></ul>
  </aside></div>`;
}
function coursePanel(c) {
  if (ui.ctab === 'overview') return `<div class="card pad"><h3>What you will learn</h3><ul>${c.learn.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  if (ui.ctab === 'syllabus') return c.modules.map((m, i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(m.title)} <span class="muted small">· ${m.lessons.length} lessons</span></summary>
    ${m.lessons.map(l => `<div class="lrow"><a href="#/learn/${c.id}/${l.key}">${S.done[l.key] ? '✅' : '▶'} ${esc(l.title)}</a><span class="muted small">Video</span></div>`).join('')}</details>`).join('');
  if (ui.ctab === 'sources') return `<div class="card pad"><p class="small muted">These lessons are public YouTube videos. They belong to their original creators and are shown through YouTube’s own player. Open any of them on YouTube:</p>
    <ul>${c.lessons.map(l => `<li><a href="https://www.youtube.com/watch?v=${l.yt}" target="_blank" rel="noopener">${esc(l.title)} ↗</a></li>`).join('')}</ul></div>`;
  return c.faq.map(f => `<details><summary>${esc(f[0])}</summary><div class="pad muted">${esc(f[1])}</div></details>`).join('');
}
function nextLesson(c) { return c.lessons.find(l => !S.done[l.key]) || c.lessons[0]; }
function notFound() { return `<div class="card pad"><h2>Not found</h2><a class="btn" href="#/">Back to courses</a></div>`; }

/* ----- Lesson page ----- */
function learnView(c, key) {
  if (!c) return notFound();
  const l = c.lessons.find(x => x.key === key) || c.lessons[0];
  const idx = c.lessons.indexOf(l);
  const side = c.modules.map(m => `<h4>${esc(m.title)}</h4>` + m.lessons.map(x => `<div class="lrow ${x === l ? 'act' : ''}">
      <a href="#/learn/${c.id}/${x.key}">${S.done[x.key] ? '✅' : '▶'} ${esc(x.title)}</a></div>`).join('')).join('');
  const warn = location.protocol === 'file:' ? `<div class="err" style="margin-bottom:12px">YouTube blocks embedded videos on pages opened straight from a file. Publish the site on GitHub Pages, or run <code>python3 -m http.server</code> in this folder and open http://localhost:8000.</div>` : '';
  const main = `${warn}<div class="player" id="player"><div class="vwrap"><iframe src="https://www.youtube-nocookie.com/embed/${l.yt}?rel=0" title="${esc(l.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>
      <p class="small muted">Video not playing? <a href="https://www.youtube.com/watch?v=${l.yt}" target="_blank" rel="noopener">Watch on YouTube ↗</a> · Videos belong to their creators.</p>
      <div style="display:flex;gap:10px;margin:14px 0;flex-wrap:wrap;align-items:center">
        <button class="btn sm ${S.done[l.key] ? 'line' : ''}" data-act="done" data-k="${l.key}" id="donebtn">${S.done[l.key] ? '✓ Completed' : 'Mark as complete'}</button>
        ${idx > 0 ? `<a class="btn line sm" href="#/learn/${c.id}/${c.lessons[idx - 1].key}">← Previous</a>` : ''}
        ${idx < c.lessons.length - 1 ? `<a class="btn sm" href="#/learn/${c.id}/${c.lessons[idx + 1].key}">Next →</a>` : ''}
      </div>
      <h2>${esc(l.title)}</h2>
      <div class="tabs">${['notes', 'resources', 'quiz', 'discussion'].map(t => `<button data-act="ltab" data-tab="${t}" class="${ui.ltab === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
      <div id="lpanel">${lessonPanel(c, l)}</div>`;
  return `<div class="crumbs"><a href="#/">Courses</a> › <a href="#/course/${c.id}">${esc(c.title)}</a> › ${esc(l.title)}</div>
    <div class="learn"><div>${main}</div><aside class="card side"><div class="pad" style="padding:12px 16px"><b>Progress: ${pct(c)}%</b><div class="bar2"><i style="width:${pct(c)}%"></i></div></div>${side}</aside></div>`;
}
function lessonQs(l) { const pool = BANK.filter(q => q.t === l.topic); const i = parseInt(l.key.split('-').pop(), 10) % pool.length; return [pool[i], pool[(i + 1) % pool.length]].filter((q, n, a) => a.indexOf(q) === n); }
function lessonPanel(c, l) {
  const tab = ui.ltab;
  if (tab === 'notes') return `<p class="muted small">Your notes save automatically in this browser.</p><textarea id="notes" rows="7" placeholder="Type your notes for this lesson…">${esc(S.notes[l.key] || '')}</textarea>
    <div class="note" style="margin-top:12px"><b>Tip:</b> Pause the video to jot down key rules, cases and dates. Then try the Quiz tab to check what you remember.</div>`;
  if (tab === 'resources') return isPro(c)
    ? `<div class="card pad"><p><b>Premium resources</b></p><button class="btn sm" data-act="dl" data-what="notes" data-k="${l.key}">⬇ Lesson notes (.txt)</button> <button class="btn sm line" data-act="dl" data-what="sheet" data-k="${l.key}">⬇ Practice sheet (.txt)</button></div>`
    : `<div class="locked card"><div style="font-size:2rem">🔒</div><p>Downloadable resources are for premium learners.</p><a class="btn alt" href="#/checkout/${c.id}">Unlock</a></div>`;
  if (tab === 'quiz') return lessonQs(l).map((q, n) => { const k = l.key + ':' + n, sel = S.quiz[k];
    return `<div class="card pad" style="margin-bottom:12px"><b>${esc(q.q)}</b>${q.o.map((o, i) => `<button class="opt ${sel === undefined ? '' : i === q.a ? 'good' : i === sel ? 'bad' : ''}" data-act="qopt" data-k="${k}" data-i="${i}" ${sel !== undefined ? 'disabled' : ''}>${esc(o)}</button>`).join('')}
      ${sel !== undefined ? `<div class="note">${sel === q.a ? '✅ Correct. ' : '❌ Not quite. '}${esc(q.e)}</div>` : ''}</div>`; }).join('');
  const cm = S.comments[l.key] || [];
  return `<form data-form="comment" data-k="${l.key}"><div class="field"><textarea name="t" rows="3" placeholder="Ask a question or share a tip…" required></textarea></div><button class="btn sm">Post</button></form>
    <div id="cms">${cm.map(x => `<div class="cm ${x.mentor ? 'mentor' : ''}"><b>${esc(x.by)}</b> <span class="muted small">${esc(x.at)}</span><div>${esc(x.t)}</div></div>`).join('') || '<p class="muted">No comments yet.</p>'}</div>
    ${isPro(c) ? '<p class="small muted">Premium: a mentor replies to your questions (simulated).</p>' : '<p class="small muted">Premium learners get mentor replies.</p>'}`;
}
function afterLearn(c, key) {
  if (!c) return;
  const l = c.lessons.find(x => x.key === key) || c.lessons[0];
  const n = $('#notes'); if (n) n.addEventListener('input', () => { S.notes[l.key] = n.value; save(); });
}

/* ----- Dashboard ----- */
function dashboardView() {
  const done = Object.keys(S.done).length;
  const totalL = COURSES.reduce((a, c) => a + c.lessons.length, 0);
  const avg = S.tests.length ? Math.round(S.tests.reduce((a, t) => a + t.acc, 0) / S.tests.length) : 0;
  return `<h1>${S.user ? 'Welcome back, ' + esc(S.user.name.split(' ')[0]) : 'Your dashboard'}</h1>
  ${S.user ? '' : '<p class="note">You are browsing as a guest. <a href="#" data-act="login">Log in</a> to personalise this page. Progress is saved in this browser only.</p>'}
  <div class="three" style="margin:18px 0">
    <div class="card pad"><div class="ring" style="--p:${Math.round(100 * done / totalL)}"><span>${Math.round(100 * done / totalL)}%</span></div><p><b>${done}/${totalL}</b> lessons done</p></div>
    <div class="card pad"><div class="ring" style="--p:${avg}"><span>${avg}%</span></div><p><b>${S.tests.length}</b> tests taken · avg accuracy</p></div>
    <div class="card pad"><div class="gold">★ Premium</div><p style="font-size:2rem;margin:0"><b>${COURSES.length}</b></p><p class="muted small">courses unlocked</p></div>
  </div>
  <div class="two">
    <div class="card pad"><h3>My courses</h3>${COURSES.map(c => `<div style="margin-bottom:14px"><a href="#/course/${c.id}"><b>${esc(c.title)}</b></a><div class="bar2"><i style="width:${pct(c)}%"></i></div><span class="small muted">${pct(c)}% complete</span></div>`).join('')}</div>
    <div class="card pad"><h3>Test history</h3>${S.tests.length ? `<table><tr><th>Test</th><th>Score</th><th>Accuracy</th></tr>${S.tests.slice(-6).reverse().map(t => `<tr><td>${esc(t.title)}</td><td>${t.score}/${t.max}</td><td>${t.acc}%</td></tr>`).join('')}</table>` : '<p class="muted">No tests yet. <a href="#/tests">Take a mock test</a>.</p>'}</div>
  </div>
  <p style="margin-top:18px"><button class="btn line sm" data-act="reset">Reset my saved progress</button></p>`;
}

/* ----- Checkout (always fails) ----- */
const CK = { method: 'card', coupon: null, busy: false, failed: false };
function checkoutView(c) {
  if (!c) return notFound();
  if (isPro(c)) return `<div class="card pad"><h2>You already have premium access</h2><a class="btn" href="#/course/${c.id}">Go to course</a></div>`;
  const disc = CK.coupon ? Math.round(c.price * 0.1) : 0, total = c.price - disc, gst = Math.round(total * 0.18 / 1.18);
  const forms = {
    card: `<div class="field"><label>Card number</label><input id="f1" inputmode="numeric" maxlength="19" placeholder="1234 5678 9012 3456" autocomplete="off"></div>
           <div class="row2"><div class="field"><label>Expiry</label><input id="f2" placeholder="MM/YY" maxlength="5" autocomplete="off"></div><div class="field"><label>CVV</label><input id="f3" type="password" maxlength="4" autocomplete="off"></div></div>
           <div class="field"><label>Name on card</label><input id="f4" autocomplete="off"></div>`,
    upi: `<div class="field"><label>UPI ID</label><input id="f1" placeholder="name@bank" autocomplete="off"></div>`,
    net: `<div class="field"><label>Choose your bank</label><select id="f1"><option value="">Select bank</option><option>Sample Bank A</option><option>Sample Bank B</option><option>Sample Bank C</option></select></div>`,
    wallet: `<div class="field"><label>Wallet</label><select id="f1"><option value="">Select wallet</option><option>Demo Wallet 1</option><option>Demo Wallet 2</option></select></div>`
  };
  return `<div class="crumbs"><a href="#/">Courses</a> › <a href="#/course/${c.id}">${esc(c.title)}</a> › Checkout</div>
  <h1>Checkout</h1><div class="chead"><div class="card pad">
    <p class="note">Demo checkout: nothing is charged and nothing you type is stored or sent anywhere.</p>
    <div class="tabs">${[['card', 'Card'], ['upi', 'UPI'], ['net', 'Net banking'], ['wallet', 'Wallet']].map(m => `<button data-act="pm" data-m="${m[0]}" class="${CK.method === m[0] ? 'on' : ''}">${m[1]}</button>`).join('')}</div>
    <form data-form="pay" data-id="${c.id}">${forms[CK.method]}
      <div id="payerr">${CK.failed ? failBox() : ''}</div>
      <button class="btn alt full" id="paybtn" ${CK.busy ? 'disabled' : ''}>Pay ${rupees(total)}</button></form>
  </div>
  <aside class="card pad sticky"><h3>Order summary</h3><p><b>${esc(c.title)}</b><br><span class="muted small">${c.lessons.length} lessons · lifetime access</span></p>
    <table><tr><td>Course price</td><td>${rupees(c.price)}</td></tr>${disc ? `<tr><td>Coupon LAW10</td><td>−${rupees(disc)}</td></tr>` : ''}<tr><td class="muted">Includes GST (18%)</td><td class="muted">${rupees(gst)}</td></tr><tr><td><b>Total</b></td><td><b>${rupees(total)}</b></td></tr></table>
    <form data-form="coupon" style="margin-top:14px;display:flex;gap:8px"><input name="c" placeholder="Coupon code" style="flex:1"><button class="btn line sm">Apply</button></form>
    <p class="small muted">Hint: try LAW10.</p></aside></div>`;
}
const failBox = () => `<div class="err">The payment cannot be done.<div class="small" style="font-weight:400;margin-top:4px">Please try again or choose another payment method.</div></div><br>`;

/* ----- Mock tests ----- */
let T = null;
function testsView() {
  return `<h1>Mock tests</h1><p class="muted">Each test has ${BANK.length} questions, 20 minutes, +4 for correct and −1 for wrong answers. All three tests are unlocked. These are practice questions written for CC Learning, not official KLEE papers.</p>
  <div class="grid">${MOCKS.map(m => { const ok = m.free || anyPro(); const hist = S.tests.filter(t => t.id === m.id); return `<div class="card pad"><h3>${m.title}</h3><p class="muted small">${BANK.length} questions · ${m.mins} min ${m.free ? '' : '· <span class="pill pro">Premium</span>'}</p>
    ${hist.length ? `<p class="small">Best: ${Math.max(...hist.map(h => h.score))}/${hist[0].max}</p>` : ''}
    ${ok ? `<a class="btn" href="#/test/${m.id}">${hist.length ? 'Retake' : 'Start test'}</a>` : `<button class="btn line" data-act="locked">🔒 Unlock with premium</button>`}</div>`; }).join('')}</div>`;
}
function buildTest(id) {
  let qs = BANK.map((q, i) => ({ ...q, i }));
  if (id === 2) qs.reverse(); if (id === 3) qs = qs.slice(5).concat(qs.slice(0, 5));
  const m = MOCKS.find(x => x.id === id);
  return { id, title: m.title, qs, ans: {}, flag: {}, cur: 0, left: m.mins * 60, done: false, timer: null };
}
function testView(id) {
  const m = MOCKS.find(x => x.id === +id);
  if (!m) return notFound();
  if (!m.free && !anyPro()) return `<div class="card locked"><h2>Premium mock test</h2><p class="muted">Unlock any course to access this test.</p><a class="btn" href="#/">See courses</a></div>`;
  if (T && T.id !== m.id) clearInterval(T.timer);
  if (!T || T.id !== m.id) T = buildTest(m.id);
  return T.done ? resultView() : runView();
}
function runView() {
  const q = T.qs[T.cur];
  return `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h2>${esc(T.title)}</h2><div class="timer" id="ttimer">${fmt(T.left)}</div></div>
  <div class="learn"><div class="card pad"><p class="muted small">Question ${T.cur + 1} of ${T.qs.length} · ${TOPIC_NAME[q.t]}</p><h3 style="font-family:inherit;font-size:1.1rem">${esc(q.q)}</h3>
    ${q.o.map((o, i) => `<button class="opt ${T.ans[T.cur] === i ? 'sel' : ''}" data-act="topt" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join('')}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
      <button class="btn line sm" data-act="tgo" data-d="-1" ${T.cur === 0 ? 'disabled' : ''}>← Prev</button>
      <button class="btn line sm" data-act="tclear">Clear</button>
      <button class="btn line sm" data-act="tflag">${T.flag[T.cur] ? '⚑ Unflag' : '⚐ Flag for review'}</button>
      <button class="btn sm" data-act="tgo" data-d="1" ${T.cur === T.qs.length - 1 ? 'disabled' : ''}>Next →</button></div></div>
    <aside class="card pad"><b>Question palette</b><div class="qgrid">${T.qs.map((_, i) => `<button data-act="tjump" data-i="${i}" class="${T.flag[i] ? 'flag' : T.ans[i] !== undefined ? 'ans' : ''} ${i === T.cur ? 'cur' : ''}">${i + 1}</button>`).join('')}</div>
    <p class="small muted">Green = answered · Orange = flagged</p><button class="btn alt full" data-act="tsubmit">Submit test</button></aside></div>`;
}
function startTestTimer() {
  clearInterval(T.timer);
  const mine = T; /* this timer belongs to this test only */
  T.timer = setInterval(() => {
    if (T !== mine || mine.done) { clearInterval(mine.timer); return; }
    mine.left--; const el = $('#ttimer'); if (el) el.textContent = fmt(mine.left); if (mine.left <= 0) finishTest();
  }, 1000);
}
function finishTest() {
  clearInterval(T.timer); T.done = true;
  let right = 0, wrong = 0; const by = {};
  T.qs.forEach((q, i) => { by[q.t] = by[q.t] || { r: 0, n: 0 }; by[q.t].n++; if (T.ans[i] === undefined) return; if (T.ans[i] === q.a) { right++; by[q.t].r++; } else wrong++; });
  T.res = { right, wrong, skipped: T.qs.length - right - wrong, score: right * 4 - wrong, max: T.qs.length * 4, by };
  const acc = Math.round(100 * right / T.qs.length);
  S.tests.push({ id: T.id, title: T.title, score: T.res.score, max: T.res.max, acc }); save();
  app.innerHTML = resultView(); window.scrollTo(0, 0);
}
function resultView() {
  const r = T.res, acc = Math.round(100 * r.right / T.qs.length);
  return `<h1>${esc(T.title)} – Result</h1>
  <div class="three" style="margin:16px 0"><div class="card pad"><div class="ring" style="--p:${acc}"><span>${acc}%</span></div><p>Accuracy</p></div>
    <div class="card pad"><h3>Score</h3><p style="font-size:2rem;margin:0"><b>${r.score}</b> / ${r.max}</p><p class="muted small">${r.right} correct · ${r.wrong} wrong · ${r.skipped} skipped</p></div>
    <div class="card pad"><h3>By topic</h3>${Object.entries(r.by).map(([k, v]) => `<div class="small">${TOPIC_NAME[k]}: ${v.r}/${v.n}</div>`).join('')}</div></div>
  <h2>Review</h2>${T.qs.map((q, i) => `<div class="card pad" style="margin-bottom:12px"><b>${i + 1}. ${esc(q.q)}</b>
    ${q.o.map((o, n) => `<div class="opt ${n === q.a ? 'good' : n === T.ans[i] ? 'bad' : ''}">${String.fromCharCode(65 + n)}. ${esc(o)} ${n === q.a ? '✔' : n === T.ans[i] ? '✘ (your answer)' : ''}</div>`).join('')}
    <div class="note">${T.ans[i] === undefined ? 'Skipped. ' : ''}${esc(q.e)}</div></div>`).join('')}
  <a class="btn" href="#/tests" data-act="tdone">Back to tests</a> <a class="btn line" href="#/dashboard" data-act="tdone">Dashboard</a>`;
}

/* ---------- 6. VIDEO PLAYER (simulated) ---------- */
let P = null;
function stopPlayer() { if (P && P.timer) clearInterval(P.timer); P = null; }
function setPlaying(on) {
  if (!P) return; P.playing = on; clearInterval(P.timer);
  $('#pp').textContent = on ? '⏸ Pause' : '▶ Play'; $('#bp').textContent = on ? '⏸' : '▶';
  if (on) P.timer = setInterval(() => { P.t += 5 * P.speed; /* demo clock runs ~20x real time */ if (P.t >= P.dur) { P.t = P.dur; setPlaying(false); markDone(P.l.key, true); } paint(); }, 250);
}
function paint() { if (!P) return; $('#fill').style.width = (100 * P.t / P.dur) + '%'; $('#tm').textContent = fmt(P.t) + ' / ' + fmt(P.dur); }
function markDone(k, auto) {
  if (!S.done[k]) { S.done[k] = true; save(); toast(auto ? 'Lesson completed 🎉' : 'Marked as complete'); }
  const b = $('#donebtn'); if (b) { b.textContent = '✓ Completed'; b.classList.add('line'); }
}

/* ---------- 5. ACTIONS ---------- */
function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); }
function findLesson(k) { for (const c of COURSES) { const l = c.lessons.find(x => x.key === k); if (l) return [c, l]; } return []; }

const ACT = {
  menu: () => $('#nav').classList.toggle('open'),
  theme: () => { S.dark = !S.dark; save(); authSlot(); },
  login: () => openModal(`<h2>Log in</h2><p class="muted small">Demo only: no password, nothing is sent to a server.</p>
    <form data-form="login"><div class="field"><label>Name</label><input name="n" required></div><div class="field"><label>Email</label><input name="e" type="email" required></div>
    <button class="btn full">Continue</button> <p style="text-align:center"><a href="#" data-act="closem">Cancel</a></p></form>`),
  closem: closeModal,
  logout: () => { S.user = null; save(); authSlot(); toast('Logged out'); router(); },
  ctab: el => { ui.ctab = el.dataset.tab; const c = course(location.hash.split('/')[2]); document.querySelectorAll('#ctabs button').forEach(b => b.classList.toggle('on', b === el)); $('#cpanel').innerHTML = coursePanel(c); },
  ltab: el => { ui.ltab = el.dataset.tab; const [, a, b] = location.hash.replace(/^#\/?/, '').split('/'); const c = course(a), l = c.lessons.find(x => x.key === b) || c.lessons[0];
    el.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === el)); $('#lpanel').innerHTML = lessonPanel(c, l);
    const n = $('#notes'); if (n) n.addEventListener('input', () => { S.notes[l.key] = n.value; save(); }); },
  toggle: () => P && setPlaying(!P.playing),
  back10: () => { if (P) { P.t = Math.max(0, P.t - 10); paint(); } },
  fwd10: () => { if (P) { P.t = Math.min(P.dur, P.t + 10); paint(); } },
  speed: el => { if (!P) return; const s = [1, 1.5, 2, 0.75]; P.speed = s[(s.indexOf(P.speed) + 1) % s.length]; el.textContent = P.speed + '×'; },
  seek: (el, e) => { if (!P) return; const r = el.getBoundingClientRect(); P.t = P.dur * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); paint(); },
  full: () => { const p = $('#player'); if (p && p.requestFullscreen) p.requestFullscreen(); else toast('Fullscreen is not supported here'); },
  done: el => { markDone(el.dataset.k, false); },
  qopt: el => { S.quiz[el.dataset.k] = +el.dataset.i; save(); const [c, l] = findLesson(el.dataset.k.split(':')[0]); $('#lpanel').innerHTML = lessonPanel(c, l); },
  dl: el => { const [c, l] = findLesson(el.dataset.k); download(el.dataset.what === 'notes' ? `${l.key}-notes.txt` : `${l.key}-practice.txt`,
    el.dataset.what === 'notes' ? `${l.title}\n${c.title}\n\nWrite your own summary of this lesson here.\n\nYour notes:\n${S.notes[l.key] || '(none)'}\n` : `Practice sheet: ${l.title}\n\n${lessonQs(l).map((q, i) => `${i + 1}. ${q.q}\n${q.o.map((o, n) => '   ' + String.fromCharCode(65 + n) + '. ' + o).join('\n')}\n`).join('\n')}`); toast('Download started'); },
  pro: el => { S.premium[el.dataset.id] = el.checked; save(); toast(el.checked ? 'Premium preview on' : 'Premium preview off'); },
  reset: () => { if (confirm('Clear all saved demo data?')) { localStorage.removeItem(KEY); S = load(); router(); toast('Reset done'); } },
  pm: el => { CK.method = el.dataset.m; CK.failed = false; router(); },
  locked: () => toast('Unlock any course (see Dashboard → Demo controls) to take this test'),
  topt: el => { T.ans[T.cur] = +el.dataset.i; app.innerHTML = runView(); },
  tclear: () => { delete T.ans[T.cur]; app.innerHTML = runView(); },
  tflag: () => { T.flag[T.cur] = !T.flag[T.cur]; app.innerHTML = runView(); },
  tgo: el => { T.cur = Math.min(T.qs.length - 1, Math.max(0, T.cur + +el.dataset.d)); app.innerHTML = runView(); },
  tjump: el => { T.cur = +el.dataset.i; app.innerHTML = runView(); },
  tsubmit: () => { const un = T.qs.length - Object.keys(T.ans).length; openModal(`<h2>Submit test?</h2><p class="muted">${un ? un + ' question(s) are unanswered.' : 'All questions answered.'}</p><button class="btn" data-act="tfinal">Submit</button> <button class="btn line" data-act="closem">Keep working</button>`); },
  tfinal: () => { closeModal(); finishTest(); },
  tdone: () => { T = null; }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || !ACT[el.dataset.act]) return;
  if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
  if (el.type !== 'checkbox') { /* checkboxes use change */ }
  if (el.dataset.act === 'pro') return;
  ACT[el.dataset.act](el, e);
});
document.addEventListener('change', e => { const el = e.target; if (el.dataset && el.dataset.act === 'pro') ACT.pro(el); });
document.addEventListener('input', e => { if (e.target.id === 'q') { ui.q = e.target.value; $('#grid').innerHTML = gridHtml(); } });

document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  const kind = f.dataset.form, d = new FormData(f);
  if (kind === 'login') { S.user = { name: d.get('n').trim(), email: d.get('e').trim() }; save(); closeModal(); toast('Welcome, ' + S.user.name.split(' ')[0] + '!'); router(); }
  if (kind === 'comment') {
    const k = f.dataset.k, [c] = findLesson(k); (S.comments[k] = S.comments[k] || []).push({ by: S.user ? S.user.name : 'Guest', at: new Date().toLocaleString(), t: d.get('t') }); save();
    const redraw = () => { const l = c.lessons.find(x => x.key === k); $('#lpanel').innerHTML = lessonPanel(c, l); };
    redraw();
    if (isPro(c)) setTimeout(() => { S.comments[k].push({ by: 'Mentor (simulated)', at: new Date().toLocaleString(), t: 'Good question! Re-read the principle first, then identify which fact decides the outcome.', mentor: true }); save(); if (location.hash.includes(k)) redraw(); }, 1200);
  }
  if (kind === 'coupon') { const v = (d.get('c') || '').trim().toUpperCase(); if (v === 'LAW10') { CK.coupon = v; toast('Coupon applied'); } else toast('Invalid coupon'); router(); }
  if (kind === 'pay') {
    if (CK.busy) return;
    const first = $('#f1'); if (!first || !first.value.trim()) { toast('Please fill in the payment details'); return; }
    CK.busy = true; CK.failed = false; const b = $('#paybtn'); b.disabled = true; b.innerHTML = '<span class="spin"></span>Processing…'; $('#payerr').innerHTML = '';
    /* The fake gateway ALWAYS fails after a short delay. Nothing is sent or stored. */
    setTimeout(() => { CK.busy = false; CK.failed = true; if (location.hash.startsWith('#/checkout')) router(); }, 2200);
  }
});

authSlot();
router();
})();
