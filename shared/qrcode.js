/* =====================================================================
 * FTC First Safety — ตัวสร้าง QR Code
 * ---------------------------------------------------------------------
 * เขียนขึ้นเองทั้งหมด ไม่พึ่งไลบรารีภายนอกและไม่ต้องต่ออินเทอร์เน็ต
 * เพื่อแก้ปัญหาเครือข่ายองค์กรบล็อก CDN ทำให้ QR ไม่ขึ้น
 *
 * รองรับ
 *   โหมด Byte (UTF-8) เวอร์ชัน 1 ถึง 10
 *   ระดับแก้ความผิดพลาด L, M, Q, H
 *   ความยาวสูงสุดประมาณ 200 ตัวอักษรที่ระดับ M ซึ่งพอสำหรับลิงก์ของระบบ
 *
 * วิธีใช้
 *   <script src="../shared/qrcode.js"></script>
 *
 *   FTCQR.render(document.getElementById('box'), 'https://...', { size: 220 });
 *   const url = FTCQR.toDataURL('https://...', { size: 512 });
 *
 * ตัวเลือก
 *   size    ความกว้างเป็นพิกเซล (ค่าเริ่มต้น 240)
 *   margin  ขอบขาวรอบนอกนับเป็นจำนวนช่อง (ค่าเริ่มต้น 4 ตามมาตรฐาน)
 *   level   'L' | 'M' | 'Q' | 'H' (ค่าเริ่มต้น 'M')
 *   dark    สีจุด (ค่าเริ่มต้น '#000000')
 *   light   สีพื้น (ค่าเริ่มต้น '#FFFFFF')
 * ===================================================================== */

(function (global) {
  'use strict';

  /* ---------------------------------------------------------------
   * ตารางเลขยกกำลังในสนามจำกัด GF(256)
   * ใช้คำนวณรหัสแก้ความผิดพลาดแบบ Reed-Solomon
   * --------------------------------------------------------------- */
  var EXP = new Uint8Array(512);
  var LOG = new Uint8Array(256);
  (function initGF() {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;          // พหุนามลดรูปมาตรฐานของ QR
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /** สร้างพหุนามตัวสร้างสำหรับรหัสแก้ความผิดพลาดจำนวน n ตัว */
  function rsGenerator(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  /** คำนวณรหัสแก้ความผิดพลาดของบล็อกข้อมูลหนึ่งบล็อก */
  function rsEncode(data, ecLen) {
    var gen = rsGenerator(ecLen);
    var res = new Array(ecLen).fill(0);

    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ res[0];
      res.shift();
      res.push(0);
      if (factor !== 0) {
        for (var j = 0; j < gen.length - 1; j++) {
          res[j] ^= gfMul(gen[j + 1], factor);
        }
      }
    }
    return res;
  }

  /* ---------------------------------------------------------------
   * ตารางโครงสร้างบล็อกของแต่ละเวอร์ชันและระดับการแก้ความผิดพลาด
   * รูปแบบ [จำนวนรหัสแก้ต่อบล็อก, กลุ่ม1: จำนวนบล็อก, ข้อมูลต่อบล็อก,
   *         กลุ่ม2: จำนวนบล็อก, ข้อมูลต่อบล็อก]
   * --------------------------------------------------------------- */
  var BLOCKS = {
    L: [null,
      [ 7, 1, 19, 0,  0], [10, 1, 34, 0,  0], [15, 1, 55, 0,  0], [20, 1, 80, 0,  0],
      [26, 1,108, 0,  0], [18, 2, 68, 0,  0], [20, 2, 78, 0,  0], [24, 2, 97, 0,  0],
      [30, 2,116, 0,  0], [18, 2, 68, 2, 69]],
    M: [null,
      [10, 1, 16, 0,  0], [16, 1, 28, 0,  0], [26, 1, 44, 0,  0], [18, 2, 32, 0,  0],
      [24, 2, 43, 0,  0], [16, 4, 27, 0,  0], [18, 4, 31, 0,  0], [22, 2, 38, 2, 39],
      [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]],
    Q: [null,
      [13, 1, 13, 0,  0], [22, 1, 22, 0,  0], [18, 2, 17, 0,  0], [26, 2, 24, 0,  0],
      [18, 2, 15, 2, 16], [24, 4, 19, 0,  0], [18, 2, 14, 4, 15], [22, 4, 18, 2, 19],
      [20, 4, 16, 4, 17], [24, 6, 19, 2, 20]],
    H: [null,
      [17, 1,  9, 0,  0], [28, 1, 16, 0,  0], [22, 2, 13, 0,  0], [16, 4,  9, 0,  0],
      [22, 2, 11, 2, 12], [28, 4, 15, 0,  0], [26, 4, 13, 1, 14], [26, 4, 14, 2, 15],
      [24, 4, 12, 4, 13], [28, 6, 15, 2, 16]]
  };

  /** ตำแหน่งของลายจัดตำแหน่งในแต่ละเวอร์ชัน */
  var ALIGN = [null, [], [6,18], [6,22], [6,26], [6,30], [6,34],
               [6,22,38], [6,24,42], [6,26,46], [6,28,50]];

  var ECC_BITS = { L: 1, M: 0, Q: 3, H: 2 };   // ค่าที่ใช้ในข้อมูลรูปแบบ

  /* ---------------------------------------------------------------
   * ข้อมูลรูปแบบและข้อมูลเวอร์ชัน
   * คำนวณด้วยรหัส BCH แทนการเขียนตารางไว้ตายตัว
   * เพราะตารางที่พิมพ์เองมีโอกาสผิดสูงและตรวจสอบยาก
   * --------------------------------------------------------------- */
  function bch(value, poly, bits) {
    var v = value << bits;
    var polyBits = 0;
    var t = poly;
    while (t) { polyBits++; t >>= 1; }
    while (true) {
      var vBits = 0, s = v;
      while (s) { vBits++; s >>= 1; }
      if (vBits < polyBits) break;
      v ^= poly << (vBits - polyBits);
    }
    return (value << bits) | v;
  }

  function formatBits(level, mask) {
    var data = (ECC_BITS[level] << 3) | mask;
    return bch(data, 0x537, 10) ^ 0x5412;
  }

  function versionBits(version) {
    return bch(version, 0x1F25, 12);
  }

  /* ---------------------------------------------------------------
   * แปลงข้อความเป็นลำดับบิต
   * --------------------------------------------------------------- */
  function toUtf8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) {
        out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      } else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < str.length) {
        // อักขระที่ใช้สองหน่วย เช่นอิโมจิ
        var c2 = str.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F),
                 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      } else {
        out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
      }
    }
    return out;
  }

  function dataCapacity(version, level) {
    var b = BLOCKS[level][version];
    return b[1] * b[2] + b[3] * b[4];
  }

  function pickVersion(byteLen, level) {
    for (var v = 1; v <= 10; v++) {
      var lenBits = v < 10 ? 8 : 16;
      var need = 4 + lenBits + byteLen * 8;
      if (need <= dataCapacity(v, level) * 8) return v;
    }
    return null;
  }

  /* ---------------------------------------------------------------
   * สร้างลำดับรหัสสุดท้ายพร้อมรหัสแก้ความผิดพลาด
   * --------------------------------------------------------------- */
  function buildCodewords(bytes, version, level) {
    var b = BLOCKS[level][version];
    var ecLen = b[0];
    var totalData = dataCapacity(version, level);
    var lenBits = version < 10 ? 8 : 16;

    // ประกอบสายบิต
    var bits = [];
    function push(val, n) {
      for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }

    push(4, 4);                    // โหมด Byte
    push(bytes.length, lenBits);
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

    // ปิดท้ายไม่เกิน 4 บิต
    var capBits = totalData * 8;
    var pad = Math.min(4, capBits - bits.length);
    for (var p = 0; p < pad; p++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    // เติมให้เต็มด้วยค่าสลับตามมาตรฐาน
    var data = [];
    for (var k = 0; k < bits.length; k += 8) {
      var v = 0;
      for (var j = 0; j < 8; j++) v = (v << 1) | bits[k + j];
      data.push(v);
    }
    var padBytes = [0xEC, 0x11], pi = 0;
    while (data.length < totalData) data.push(padBytes[pi++ % 2]);

    // แบ่งเป็นบล็อกแล้วคำนวณรหัสแก้ความผิดพลาดของแต่ละบล็อก
    var blocks = [], ecBlocks = [], offset = 0;
    var groups = [[b[1], b[2]], [b[3], b[4]]];

    for (var g = 0; g < 2; g++) {
      for (var n = 0; n < groups[g][0]; n++) {
        var size = groups[g][1];
        var chunk = data.slice(offset, offset + size);
        offset += size;
        blocks.push(chunk);
        ecBlocks.push(rsEncode(chunk, ecLen));
      }
    }

    // สลับข้อมูลระหว่างบล็อกตามมาตรฐาน เพื่อกระจายความเสียหาย
    var out = [];
    var maxData = Math.max.apply(null, blocks.map(function (x) { return x.length; }));
    for (var c = 0; c < maxData; c++) {
      for (var bi = 0; bi < blocks.length; bi++) {
        if (c < blocks[bi].length) out.push(blocks[bi][c]);
      }
    }
    for (var e = 0; e < ecLen; e++) {
      for (var bj = 0; bj < ecBlocks.length; bj++) out.push(ecBlocks[bj][e]);
    }
    return out;
  }

  /* ---------------------------------------------------------------
   * วางลายลงตาราง
   * --------------------------------------------------------------- */
  function createMatrix(version) {
    var size = version * 4 + 17;
    var m = [], reserved = [];
    for (var i = 0; i < size; i++) {
      m.push(new Array(size).fill(0));
      reserved.push(new Array(size).fill(false));
    }

    function setFinder(r, c) {
      for (var dr = -1; dr <= 7; dr++) {
        for (var dc = -1; dc <= 7; dc++) {
          var rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
          var inner = (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6);
          var on = inner && (dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
                             (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
          m[rr][cc] = on ? 1 : 0;
          reserved[rr][cc] = true;
        }
      }
    }

    setFinder(0, 0);
    setFinder(0, size - 7);
    setFinder(size - 7, 0);

    // ลายเส้นจังหวะ
    for (var i2 = 8; i2 < size - 8; i2++) {
      var v = (i2 % 2 === 0) ? 1 : 0;
      if (!reserved[6][i2]) { m[6][i2] = v; reserved[6][i2] = true; }
      if (!reserved[i2][6]) { m[i2][6] = v; reserved[i2][6] = true; }
    }

    // ลายจัดตำแหน่ง
    var pos = ALIGN[version];
    for (var a = 0; a < pos.length; a++) {
      for (var b2 = 0; b2 < pos.length; b2++) {
        var r2 = pos[a], c2 = pos[b2];

        /* ข้ามเฉพาะตำแหน่งที่ทับลายค้นหาสามมุมเท่านั้น
           ตำแหน่งที่อยู่บนเส้นจังหวะ (แถวหรือคอลัมน์ที่ 6) ต้องวาดตามปกติ
           เดิมเช็กจากช่องที่ถูกจองไว้ ทำให้ลายที่คร่อมเส้นจังหวะหายไป
           ส่งผลกับเวอร์ชัน 7 ขึ้นไปซึ่งเป็นเวอร์ชันที่ลิงก์เชิญใช้ */
        var nearTL = (r2 <= 8 && c2 <= 8);
        var nearTR = (r2 <= 8 && c2 >= size - 9);
        var nearBL = (r2 >= size - 9 && c2 <= 8);
        if (nearTL || nearTR || nearBL) continue;
        for (var dr2 = -2; dr2 <= 2; dr2++) {
          for (var dc2 = -2; dc2 <= 2; dc2++) {
            var on2 = Math.max(Math.abs(dr2), Math.abs(dc2)) !== 1;
            m[r2 + dr2][c2 + dc2] = on2 ? 1 : 0;
            reserved[r2 + dr2][c2 + dc2] = true;
          }
        }
      }
    }

    // จุดดำถาวร
    m[size - 8][8] = 1;
    reserved[size - 8][8] = true;

    // จองพื้นที่ข้อมูลรูปแบบ
    for (var f = 0; f < 9; f++) {
      if (!reserved[8][f]) { reserved[8][f] = true; m[8][f] = 0; }
      if (!reserved[f][8]) { reserved[f][8] = true; m[f][8] = 0; }
    }
    for (var f2 = 0; f2 < 8; f2++) {
      reserved[8][size - 1 - f2] = true;
      reserved[size - 1 - f2][8] = true;
    }

    // จองพื้นที่ข้อมูลเวอร์ชัน (เฉพาะเวอร์ชัน 7 ขึ้นไป)
    if (version >= 7) {
      for (var i3 = 0; i3 < 6; i3++) {
        for (var j3 = 0; j3 < 3; j3++) {
          reserved[i3][size - 11 + j3] = true;
          reserved[size - 11 + j3][i3] = true;
        }
      }
    }

    return { m: m, reserved: reserved, size: size };
  }

  function placeData(grid, codewords) {
    var m = grid.m, reserved = grid.reserved, size = grid.size;
    var bitIdx = 0;
    var total = codewords.length * 8;

    function bitAt(i) {
      if (i >= total) return 0;
      return (codewords[i >> 3] >> (7 - (i & 7))) & 1;
    }

    var up = true;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;                      // ข้ามคอลัมน์เส้นจังหวะ
      for (var n = 0; n < size; n++) {
        var row = up ? size - 1 - n : n;
        for (var c = 0; c < 2; c++) {
          var cc = col - c;
          if (reserved[row][cc]) continue;
          m[row][cc] = bitAt(bitIdx++);
        }
      }
      up = !up;
    }
  }

  function maskFn(id, r, c) {
    switch (id) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
  }

  /** ให้คะแนนความอ่านยาก ยิ่งน้อยยิ่งดี ตามเกณฑ์ในมาตรฐาน */
  function penalty(m, size) {
    var score = 0, i, j, run, prev;

    // แถวและคอลัมน์ที่มีสีเดียวกันติดกันยาว
    for (i = 0; i < size; i++) {
      run = 1; prev = m[i][0];
      for (j = 1; j < size; j++) {
        if (m[i][j] === prev) { run++; }
        else { if (run >= 5) score += 3 + (run - 5); run = 1; prev = m[i][j]; }
      }
      if (run >= 5) score += 3 + (run - 5);

      run = 1; prev = m[0][i];
      for (j = 1; j < size; j++) {
        if (m[j][i] === prev) { run++; }
        else { if (run >= 5) score += 3 + (run - 5); run = 1; prev = m[j][i]; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }

    // สี่เหลี่ยมสีเดียวขนาด 2x2
    for (i = 0; i < size - 1; i++) {
      for (j = 0; j < size - 1; j++) {
        var v = m[i][j];
        if (v === m[i][j+1] && v === m[i+1][j] && v === m[i+1][j+1]) score += 3;
      }
    }

    // ลายที่คล้ายลายค้นหา
    var pat1 = [1,0,1,1,1,0,1,0,0,0,0];
    var pat2 = [0,0,0,0,1,0,1,1,1,0,1];
    function match(arr, pat) {
      for (var k = 0; k < 11; k++) if (arr[k] !== pat[k]) return false;
      return true;
    }
    for (i = 0; i < size; i++) {
      for (j = 0; j <= size - 11; j++) {
        var rowArr = [], colArr = [];
        for (var k2 = 0; k2 < 11; k2++) { rowArr.push(m[i][j+k2]); colArr.push(m[j+k2][i]); }
        if (match(rowArr, pat1) || match(rowArr, pat2)) score += 40;
        if (match(colArr, pat1) || match(colArr, pat2)) score += 40;
      }
    }

    // สัดส่วนสีดำต่อขาว
    var dark = 0;
    for (i = 0; i < size; i++) for (j = 0; j < size; j++) dark += m[i][j];
    var pct = dark * 100 / (size * size);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;

    return score;
  }

  function applyFormat(grid, level, mask) {
    var m = grid.m, size = grid.size;
    var bits = formatBits(level, mask);

    for (var i = 0; i < 15; i++) {
      var bit = (bits >> i) & 1;

      // สำเนาที่หนึ่ง รอบลายค้นหามุมบนซ้าย
      if (i < 6)        m[8][i] = bit;
      else if (i === 6) m[8][7] = bit;
      else if (i === 7) m[8][8] = bit;
      else if (i === 8) m[7][8] = bit;
      else              m[14 - i][8] = bit;

      /* สำเนาที่สอง กระจายไปอีกสองมุม
         บิต 0-6 เรียงขึ้นจากมุมล่างซ้าย  บิต 7-14 เรียงไปทางขวาที่แถว 8
         เดิมใช้เงื่อนไข i < 8 ทำให้บิตที่ 7 ไปทับจุดดำถาวรที่มุมล่างซ้าย
         และช่องแรกของแถวขวาไม่ถูกเขียนเลย */
      if (i < 7) m[size - 1 - i][8] = bit;
      else       m[8][size - 15 + i] = bit;
    }
  }

  function applyVersion(grid, version) {
    if (version < 7) return;
    var m = grid.m, size = grid.size;
    var bits = versionBits(version);
    for (var i = 0; i < 18; i++) {
      var bit = (bits >> i) & 1;
      var r = Math.floor(i / 3), c = i % 3;
      m[r][size - 11 + c] = bit;
      m[size - 11 + c][r] = bit;
    }
  }

  /* ---------------------------------------------------------------
   * สร้างตารางสุดท้าย
   * --------------------------------------------------------------- */
  function build(text, level) {
    level = (level || 'M').toUpperCase();
    if (!BLOCKS[level]) level = 'M';

    var bytes = toUtf8Bytes(String(text));
    var version = pickVersion(bytes.length, level);

    if (!version) {
      // ข้อความยาวเกินเวอร์ชันที่รองรับ ลองลดระดับการแก้ความผิดพลาดลง
      var order = ['M', 'L'];
      for (var i = 0; i < order.length; i++) {
        version = pickVersion(bytes.length, order[i]);
        if (version) { level = order[i]; break; }
      }
      if (!version) throw new Error('ข้อความยาวเกินกว่าที่ QR รองรับ (สูงสุดประมาณ 200 ตัวอักษร)');
    }

    var codewords = buildCodewords(bytes, version, level);

    // ลองทุกหน้ากากแล้วเลือกอันที่อ่านง่ายที่สุด
    var best = null, bestScore = Infinity;
    for (var mask = 0; mask < 8; mask++) {
      var grid = createMatrix(version);
      placeData(grid, codewords);

      for (var r = 0; r < grid.size; r++) {
        for (var c = 0; c < grid.size; c++) {
          if (!grid.reserved[r][c] && maskFn(mask, r, c)) grid.m[r][c] ^= 1;
        }
      }
      applyFormat(grid, level, mask);
      applyVersion(grid, version);

      var score = penalty(grid.m, grid.size);
      if (score < bestScore) { bestScore = score; best = grid; }
    }

    return { modules: best.m, size: best.size, version: version, level: level };
  }

  /* ---------------------------------------------------------------
   * วาดลงหน้าจอ
   * --------------------------------------------------------------- */
  function drawCanvas(qr, opt) {
    opt = opt || {};
    var margin = opt.margin == null ? 4 : opt.margin;
    var px = opt.size || 240;
    var total = qr.size + margin * 2;
    var scale = Math.max(1, Math.floor(px / total));
    var dim = scale * total;

    var canvas = document.createElement('canvas');
    canvas.width = dim;
    canvas.height = dim;

    /* ต้องแสดงผลที่ขนาดเท่ากับที่วาดจริงเสมอ
       เดิมวาดที่ขนาดหนึ่งแล้วบังคับแสดงอีกขนาดหนึ่ง เบราว์เซอร์จึงยืดภาพ
       ทำให้ขอบจุดเบลอจนกล้องมือถืออ่านไม่ออก ยิ่งตารางใหญ่ยิ่งเบลอหนัก */
    canvas.style.width = dim + 'px';
    canvas.style.height = dim + 'px';
    canvas.style.imageRendering = 'pixelated';

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = opt.light || '#FFFFFF';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = opt.dark || '#000000';

    for (var r = 0; r < qr.size; r++) {
      for (var c = 0; c < qr.size; c++) {
        if (qr.modules[r][c]) {
          ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  /* ---------------------------------------------------------------
   * ส่วนที่เรียกใช้จากภายนอก
   * --------------------------------------------------------------- */
  var FTCQR = {
    /** สร้างตารางจุดดิบ ใช้เมื่อต้องการวาดเอง */
    create: function (text, opt) {
      return build(text, (opt || {}).level);
    },

    /** วาดลงในกล่องที่ระบุ ล้างของเดิมทิ้งก่อนเสมอ */
    render: function (el, text, opt) {
      if (!el) throw new Error('ไม่พบกล่องสำหรับวาด QR');
      var qr = build(text, (opt || {}).level);
      var canvas = drawCanvas(qr, opt);
      el.innerHTML = '';
      el.appendChild(canvas);
      return canvas;
    },

    /** คืนค่าเป็นรูปภาพแบบฝังในข้อความ ใช้กับแท็ก img หรือส่งไปพิมพ์ */
    toDataURL: function (text, opt) {
      return drawCanvas(build(text, (opt || {}).level), opt).toDataURL('image/png');
    },

    /** ใส่ลงในแท็ก img ที่มีอยู่แล้ว */
    toImage: function (img, text, opt) {
      img.src = FTCQR.toDataURL(text, opt);
      return img;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FTCQR;
  global.FTCQR = FTCQR;

  // รองรับโค้ดเดิมที่เรียกใช้ชื่อ QRCode จากไลบรารีภายนอก
  // จะได้ไม่ต้องไล่แก้ทุกจุดที่เคยเรียกไว้
  if (!global.QRCode) {
    global.QRCode = {
      toCanvas: function (el, text, opts, cb) {
        try {
          var o = opts || {};
          var canvas = FTCQR.render(el.tagName === 'CANVAS' ? el.parentNode : el, text, {
            size: o.width || 240,
            margin: o.margin,
            level: (o.errorCorrectionLevel || 'M').toUpperCase(),
            dark: (o.color && o.color.dark) || '#000000',
            light: (o.color && o.color.light) || '#FFFFFF'
          });
          if (cb) cb(null, canvas);
        } catch (e) { if (cb) cb(e); else throw e; }
      },
      toDataURL: function (text, opts, cb) {
        try {
          var o = opts || {};
          var url = FTCQR.toDataURL(text, { size: o.width || 240, margin: o.margin,
                                            level: (o.errorCorrectionLevel || 'M').toUpperCase() });
          if (cb) cb(null, url);
          return Promise.resolve(url);
        } catch (e) {
          if (cb) cb(e); else return Promise.reject(e);
        }
      }
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
