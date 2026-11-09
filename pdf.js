/* Eigener PDF-Erzeuger (A4 hochformat, nur Helvetica) – funktioniert offline und ohne Druckdialog */
(function (root) {
  'use strict';
  const MM = 72 / 25.4, PW = 595.276, PH = 841.89;
  // Helvetica-Zeichenbreiten (ASCII 32..126)
  const WID = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,
    1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,
    333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  function cw(ch) {
    const c = ch.charCodeAt(0);
    if (c >= 32 && c <= 126) return WID[c - 32];
    if (ch === 'ß') return 611;
    const b = ch.normalize('NFD').charAt(0), bc = b.charCodeAt(0);
    return (bc >= 32 && bc <= 126) ? WID[bc - 32] : 556;
  }
  const tw = (s, size, bold) => { let w = 0; for (const ch of s) w += cw(ch); return w * size / 1000 * (bold ? 1.06 : 1); };
  const CP = { '–': 0x96, '—': 0x97, '“': 0x93, '”': 0x94, '‘': 0x91, '’': 0x92, '€': 0x80, '…': 0x85, '•': 0x95 };
  function enc(s) {
    let o = '';
    for (const ch of String(s)) {
      let c = ch.charCodeAt(0);
      if (c > 255) c = CP[ch] || 63;
      if (c === 40 || c === 41 || c === 92) o += '\\';
      o += String.fromCharCode(c);
    }
    return o;
  }
  const f2 = n => (Math.round(n * 100) / 100).toString();

  function wrap(text, size, maxW, bold) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = [];
    let cur = '';
    for (let w of words) {
      while (tw(w, size, bold) > maxW && w.length > 1) { // überlanges Wort zeichenweise trennen
        let k = w.length - 1; while (k > 1 && tw(w.slice(0, k), size, bold) > maxW) k--;
        if (cur) { lines.push(cur); cur = ''; }
        lines.push(w.slice(0, k)); w = w.slice(k);
      }
      const t = cur ? cur + ' ' + w : w;
      if (tw(t, size, bold) <= maxW) cur = t; else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  /* opts: { monthLabel, name, rows:[{d, kind:'weekend'|'times'|'note'|'empty', label, start, end, hours, note, tasks}], sum } */
  function build(opts) {
    const rows = opts.rows, n = rows.length;
    const ops = [];
    const rect = (x, y, w, h, g) => ops.push(f2(g) + ' g ' + f2(x) + ' ' + f2(y) + ' ' + f2(w) + ' ' + f2(h) + ' re f');
    const vline = (x, y1, y2) => ops.push('0 G ' + f2(0.3 * MM) + ' w ' + f2(x) + ' ' + f2(y1) + ' m ' + f2(x) + ' ' + f2(y2) + ' l S');
    const text = (s, x, y, size, bold) => ops.push('0 g BT /' + (bold ? 'F2' : 'F1') + ' ' + f2(size) + ' Tf ' + f2(x) + ' ' + f2(y) + ' Td (' + enc(s) + ') Tj ET');

    const M = 10 * MM, tableW = PW - 2 * M;
    const colMM = [12, 20, 20, 20];
    const colW = colMM.map(v => v * MM); colW.push(tableW - colW.reduce((a, b) => a + b, 0));
    const colX = [M]; for (let i = 0; i < 5; i++) colX.push(colX[i] + colW[i]);
    const headTop = PH - M, tableTop = PH - M - 18 * MM, hdrH = 7 * MM;
    const rowH = (297 - 20 - 18 - 7 - 1.5) / (n + 1) * MM;
    const PAD = 1.5 * MM;

    // Kopf
    text('Arbeitszeiterfassung', M, headTop - 13, 15, true);
    text('Monat: ' + opts.monthLabel, M, headTop - 30, 10, false);
    text('Name: ' + (opts.name || ''), M, headTop - 43, 10, false);

    // Text in Zelle, automatisch so verkleinert, dass er passt
    function cell(str, x, w, top, h, o) {
      if (!str) return;
      const avail = w - 2 * PAD; let size = 9, lines;
      for (;; size -= 0.25) {
        lines = o.wrap ? wrap(str, size, avail, o.bold) : [str];
        const fits = o.wrap ? lines.length * size * 1.15 <= h - 0.5 : tw(str, size, o.bold) <= avail;
        if (fits || size <= 4) break;
      }
      const lh = size * 1.15, total = lines.length * lh, t0 = top - (h - total) / 2;
      lines.forEach((ln, i) => {
        const cy = t0 - (i + 0.5) * lh, base = cy - size * 0.35;
        const x0 = o.left ? x + PAD : x + (w - tw(ln, size, o.bold)) / 2;
        text(ln, x0, base, size, o.bold);
      });
    }

    // Kopfzeile
    rect(M, tableTop - hdrH, tableW, hdrH, 0.74);
    ['Tag', 'Beginn', 'Ende', 'Stunden', 'Ausgeführte Tätigkeiten'].forEach((t, i) => cell(t, colX[i], colW[i], tableTop, hdrH, { bold: true }));

    let top = tableTop - hdrH;
    const gaps = []; // Zeilen mit zusammengefasster Beginn/Ende-Zelle: dort keine Linie zwischen Spalte 2 und 3
    const all = rows.concat([{ kind: 'sum' }]);
    all.forEach((r, i) => {
      const g = r.kind === 'sum' ? 0.74 : (i % 2 === 0 ? 1 : 0.902);
      rect(M, top - rowH, tableW, rowH, g);
      const bold = r.kind === 'sum';
      cell(bold ? '' : r.d + '.', colX[0], colW[0], top, rowH, {});
      if (r.kind === 'sum') {
        cell('SUMME', colX[1], colW[1] + colW[2], top, rowH, { bold: true });
        cell(opts.sum, colX[3], colW[3], top, rowH, { bold: true });
      } else if (r.kind === 'weekend') {
        cell(r.label, colX[1], colW[1] + colW[2], top, rowH, {});
      } else if (r.kind === 'times') {
        cell(r.start, colX[1], colW[1], top, rowH, {});
        cell(r.end, colX[2], colW[2], top, rowH, {});
        cell(r.hours, colX[3], colW[3], top, rowH, {});
      } else if (r.kind === 'note') {
        cell(r.note, colX[1], colW[1] + colW[2], top, rowH, {});
      }
      if (r.kind === 'sum') cell('Sollstunden gesamt: ' + opts.soll, colX[4], colW[4], top, rowH, { bold: true, left: true });
      if (r.kind !== 'sum' && r.kind !== 'weekend') cell(r.tasks, colX[4], colW[4], top, rowH, { wrap: true, left: true });
      if (r.kind === 'sum' || r.kind === 'weekend' || r.kind === 'note') gaps.push([top, top - rowH]);
      top -= rowH;
    });
    // senkrechte Linien (Linie zwischen Beginn und Ende nur in nicht zusammengefassten Zeilen)
    colX.forEach((x, i) => {
      if (i !== 2) { vline(x, tableTop, top); return; }
      let y = tableTop;
      gaps.forEach(g => { if (g[0] < y) vline(x, y, g[0]); y = g[1]; });
      if (top < y) vline(x, y, top);
    });

    // PDF zusammensetzen
    const stream = ops.join('\n');
    const objs = [
      '<</Type/Catalog/Pages 2 0 R>>',
      '<</Type/Pages/Kids[3 0 R]/Count 1>>',
      '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + f2(PW) + ' ' + f2(PH) + ']/Resources<</Font<</F1 5 0 R/F2 6 0 R>>>>/Contents 4 0 R>>',
      '<</Length ' + stream.length + '>>\nstream\n' + stream + '\nendstream',
      '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>',
      '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>'
    ];
    let out = '%PDF-1.4\n'; const offs = [];
    objs.forEach((o, i) => { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    const xref = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    out += 'trailer\n<</Size ' + (objs.length + 1) + '/Root 1 0 R>>\nstartxref\n' + xref + '\n%%EOF';
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return bytes;
  }
  const api = { build, _tw: tw, _widLen: WID.length };
  if (typeof module !== 'undefined') module.exports = api; else root.AZPDF = api;
})(typeof window !== 'undefined' ? window : this);
