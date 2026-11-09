'use strict';
const $ = id => document.getElementById(id);
const KEY = 'az_days_v1', NAME_KEY = 'az_name';
const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
let days = {};
try { days = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { days = {}; }
function setStatus(ok, msg) { const s = $('stor'); s.textContent = msg; s.className = 'stor' + (ok ? '' : ' err'); }
const NOSTORE = '⚠ Speichern nicht möglich! In Safari privaten Modus beenden und „Alle Cookies blockieren“ ausschalten.';
const persist = () => {
  try {
    const v = JSON.stringify(days);
    localStorage.setItem(KEY, v);
    if (localStorage.getItem(KEY) !== v) throw new Error('verify');
    setStatus(true, 'Gespeichert ✓ ' + new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}));
  } catch (e) { setStatus(false, NOSTORE); }
};

const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const monthIdx = d => d.getFullYear() * 12 + d.getMonth();
const WD = ['So','Mo','Di','Mi','Do','Fr','Sa'];
const fmtDate = d => pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
const fmtH = m => (m / 60).toFixed(2).replace('.', ',') + 'h';
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function toMin(t) { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function netMinutes(day) {
  if (!day) return null;
  const s = toMin(day.start), e = toMin(day.end);
  if (s === null || e === null) return null;
  let dur = e - s;
  if (dur <= 0) dur += 1440; // Ende nach Mitternacht
  const pause = dur > 540 ? 45 : dur > 360 ? 30 : 0; // >9h: 45, >6h: 30, sonst 0
  return Math.max(0, dur - pause);
}
const fmt = m => Math.floor(m / 60) + ' Std. ' + pad(m % 60) + ' Min. (' + fmtH(m) + ')';

// Sollstunden: Wochentag 8 h; mit Anmerkung = selbst eingetragener Wert; Sa/So = 0
const parseH = s => { const v = parseFloat(String(s || '').replace(',', '.')); return isFinite(v) && v > 0 ? v : 0; };
function sollFor(date, day) {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return 0;
  return String((day && day.note) || '').trim() ? parseH(day.soll) : 8;
}
function sollSum(y, m) {
  let s = 0;
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) { const dt = new Date(y, m, d); s += sollFor(dt, days[iso(dt)]); }
  return s;
}
function updateSoll(ed) {
  const wd = current.getDay() !== 0 && current.getDay() !== 6;
  $('sollWrap').hidden = !(wd && $('note').value.trim());
  $('soll').disabled = !ed;
}

function isEditable(d) {
  const diff = monthIdx(new Date()) - monthIdx(d);
  return diff >= 0 && diff <= 2;
}

function mkTime(el) {
  const h = document.createElement('select'), m = document.createElement('select'), sep = document.createElement('span');
  h.innerHTML = '<option value="">--</option>' + Array.from({length: 24}, (_, i) => '<option>' + pad(i) + '</option>').join('');
  m.innerHTML = ['00','15','30','45'].map(x => '<option>' + x + '</option>').join('');
  sep.textContent = ':';
  el.append(h, sep, m);
  h.addEventListener('change', save); m.addEventListener('change', save);
  el.get = () => h.value ? h.value + ':' + m.value : '';
  el.set = v => {
    if (!v) { h.value = ''; m.value = '00'; return; }
    const [hh, mm] = v.split(':');
    h.value = hh;
    if (![...m.options].some(o => o.value === mm)) m.add(new Option(mm, mm));
    m.value = mm;
  };
  el.dis = b => { h.disabled = b; m.disabled = b; };
}
mkTime($('start')); mkTime($('end'));

let current = new Date();

// Kette: 2. nur wenn 1. gesetzt, 3. nur wenn 1. und 2. gesetzt; Abwählen räumt die folgenden Felder ab
function syncRk(ed) {
  const p = $('rkPossible').checked;
  if (!p) $('rkRequested').checked = false;
  const r = $('rkRequested').checked;
  if (!r) $('rkReceived').checked = false;
  $('rkRequested').disabled = !ed || !p;
  $('rkReceived').disabled = !ed || !(p && r);
}

function render() {
  const key = iso(current), day = days[key] || {};
  $('date').value = key;
  $('dateText').textContent = WD[current.getDay()] + ', ' + fmtDate(current);
  $('start').set(day.start || '');
  $('end').set(day.end || '');
  $('tasks').value = day.tasks || '';
  $('note').value = day.note || '';
  $('soll').value = day.soll || '';
  $('rkPossible').checked = !!day.rkPossible;
  $('rkRequested').checked = !!(day.rkPossible && day.rkRequested);
  $('rkReceived').checked = !!(day.rkPossible && day.rkRequested && day.rkReceived);
  const ed = isEditable(current);
  $('lock').hidden = ed;
  ['tasks','note','rkPossible'].forEach(id => $(id).disabled = !ed);
  $('start').dis(!ed); $('end').dis(!ed);
  syncRk(ed);
  updateSoll(ed);
  const n = netMinutes(day);
  $('net').textContent = n === null ? '' : 'Nettoarbeitszeit: ' + fmt(n);
  renderMonth();
}

function renderMonth() {
  const y = current.getFullYear(), m = current.getMonth();
  let sum = 0;
  for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
    const n = netMinutes(days[iso(new Date(y, m, d))]);
    if (n !== null) sum += n;
  }
  $('monthLabel').textContent = MONTHS[m] + ' ' + y;
  $('monthSum').textContent = 'Summe Nettoarbeitszeit: ' + fmt(sum);
  $('monthSoll').textContent = 'Summe Sollstunden: ' + fmtH(sollSum(y, m) * 60);
}

function save() {
  if (!isEditable(current)) return;
  const day = {
    start: $('start').get(), end: $('end').get(),
    tasks: $('tasks').value, note: $('note').value,
    soll: ($('note').value.trim() && current.getDay() !== 0 && current.getDay() !== 6) ? $('soll').value.trim() : '',
    rkPossible: $('rkPossible').checked,
    rkRequested: $('rkPossible').checked && $('rkRequested').checked,
    rkReceived: $('rkPossible').checked && $('rkRequested').checked && $('rkReceived').checked
  };
  syncRk(true);
  updateSoll(true);
  const empty = !day.start && !day.end && !day.tasks && !day.note && !day.rkPossible;
  const key = iso(current);
  if (empty) delete days[key]; else days[key] = day;
  persist();
  const n = netMinutes(day);
  $('net').textContent = n === null ? '' : 'Nettoarbeitszeit: ' + fmt(n);
  renderMonth();
}

function shift(delta) { current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + delta); render(); }

/* ---------- PDF (eigener Erzeuger, kein Druckdialog) ---------- */
function pdfData() {
  const y = current.getFullYear(), m = current.getMonth();
  const n = new Date(y, m + 1, 0).getDate();
  const rows = []; let sumMin = 0;
  for (let d = 1; d <= n; d++) {
    const date = new Date(y, m, d), dow = date.getDay(), day = days[iso(date)] || {};
    const tasks = String(day.tasks || '').replace(/\s*\n+\s*/g, '; ');
    if (dow === 6 || dow === 0) { rows.push({ d, kind: 'weekend', label: dow === 6 ? 'SAMSTAG' : 'SONNTAG' }); continue; }
    const net = netMinutes(day);
    if (day.start && day.end) { sumMin += net || 0; rows.push({ d, kind: 'times', start: day.start, end: day.end, hours: net === null ? '' : fmtH(net), tasks }); }
    else if (day.note) rows.push({ d, kind: 'note', note: day.note, tasks });
    else rows.push({ d, kind: 'empty', tasks });
  }
  return { monthLabel: MONTHS[m] + ' ' + y, name: localStorage.getItem(NAME_KEY) || '', rows, sum: fmtH(sumMin), soll: fmtH(sollSum(y, m) * 60), fname: 'Arbeitszeiterfassung_' + y + '-' + pad(m + 1) + '.pdf' };
}

async function exportPdf() {
  try {
    const o = pdfData();
    const bytes = AZPDF.build(o);
    const file = new File([bytes], o.fname, { type: 'application/pdf' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: o.fname }); setStatus(true, 'PDF erstellt ✓'); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = o.fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 20000);
    setStatus(true, 'PDF erstellt ✓');
  } catch (e) { setStatus(false, '⚠ PDF konnte nicht erstellt werden: ' + (e && e.message ? e.message : e)); }
}

/* ---------- Events ---------- */
['tasks','note','soll'].forEach(id => $(id).addEventListener('input', save));
$('date').addEventListener('click', () => { try { $('date').showPicker(); } catch (e) {} });
['rkPossible','rkRequested','rkReceived'].forEach(id => $(id).addEventListener('change', save));
$('prev').onclick = () => shift(-1);
$('next').onclick = () => shift(1);
$('date').onchange = e => { if (e.target.value) { current = fromIso(e.target.value); render(); } };
$('btnSettings').onclick = () => { $('settings').hidden = !$('settings').hidden; };
$('name').value = localStorage.getItem(NAME_KEY) || '';
$('name').addEventListener('input', e => { try { localStorage.setItem(NAME_KEY, e.target.value); } catch (x) {} });
$('pdf').onclick = () => {
  if (!localStorage.getItem(NAME_KEY)) { $('settings').hidden = false; }
  exportPdf();
};

/* ---------- Datensicherung ---------- */
const BK_KEY = 'az_backup';
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/, TIME_RE = /^\d{2}:\d{2}$/;
function sanitizeDay(x) {
  if (!x || typeof x !== 'object') return null;
  const s = v => typeof v === 'string' ? v : '';
  return { start: TIME_RE.test(x.start) ? x.start : '', end: TIME_RE.test(x.end) ? x.end : '', tasks: s(x.tasks), note: s(x.note), soll: s(x.soll).slice(0, 10),
           rkPossible: !!x.rkPossible, rkRequested: !!(x.rkPossible && x.rkRequested), rkReceived: !!(x.rkPossible && x.rkRequested && x.rkReceived) };
}
function showLastBackup() {
  const t = localStorage.getItem(BK_KEY);
  $('lastBk').textContent = t ? 'Letzte Sicherung: ' + fmtDate(new Date(t)) : 'Noch keine Sicherung erstellt.';
}
function markBackup() { try { localStorage.setItem(BK_KEY, new Date().toISOString()); } catch (e) {} showLastBackup(); }

$('btnExport').onclick = async () => {
  const data = JSON.stringify({ app: 'arbeitszeit', version: 1, exported: new Date().toISOString(), name: localStorage.getItem(NAME_KEY) || '', days }, null, 1);
  const fname = 'arbeitszeit_backup_' + iso(new Date()) + '.json';
  const file = new File([data], fname, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fname });
      markBackup(); setStatus(true, 'Sicherung weitergegeben ✓'); return;
    }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = fname;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  markBackup(); setStatus(true, 'Sicherung erstellt ✓');
};
$('btnImport').onclick = () => $('fileImport').click();
$('fileImport').onchange = e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result);
      if (!o || o.app !== 'arbeitszeit' || !o.days || typeof o.days !== 'object') throw new Error('format');
      const inc = {};
      for (const k in o.days) { if (ISO_RE.test(k)) { const d = sanitizeDay(o.days[k]); if (d) inc[k] = d; } }
      const n = Object.keys(inc).length;
      if (!confirm(n + ' Tage aus der Sicherung einlesen?\nEinträge mit gleichem Datum werden überschrieben, alle anderen bleiben erhalten.')) return;
      days = Object.assign({}, days, inc);
      persist();
      if (typeof o.name === 'string' && o.name && !localStorage.getItem(NAME_KEY)) { try { localStorage.setItem(NAME_KEY, o.name); } catch (x) {} $('name').value = o.name; }
      render();
      setStatus(true, n + ' Tage eingelesen ✓');
    } catch (x) { setStatus(false, '⚠ Datei nicht lesbar: keine gültige Sicherung.'); }
  };
  r.readAsText(f);
};
showLastBackup();

try { localStorage.setItem('az_test', '1'); localStorage.removeItem('az_test'); } catch (e) { setStatus(false, NOSTORE); }
if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) {} }
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
