
/* =====================================================================
 * FTC First Safety Paperless — ค่าตั้งต้นกลางของทั้งระบบ
 * ---------------------------------------------------------------------
 * ทุกหน้าเว็บต้องอ้างค่าจากไฟล์นี้ที่เดียว ห้ามคัดลอก LIFF ID หรือ
 * Supabase Key ไปเขียนซ้ำในไฟล์อื่น เพราะเมื่อระบบโตถึง 20+ หน้า
 * การแก้ค่าจะตกหล่นแน่นอน
 *
 * วิธีเรียกใช้ในหน้าเว็บ:
 *   <script src="../shared/config.js"></script>
 *   const sb = FTC.supabase();
 * ===================================================================== */

window.FTC = (function () {
  'use strict';

  const CONFIG = {
    // ---- Supabase -----------------------------------------------------
    SUPABASE_URL: 'https://ancwqgaaqliandzdzphg.supabase.co',
    SUPABASE_KEY: 'sb_publishable_IVdSBILj_etRSNF48ig1PA_sBAt23NG',

    // ---- LINE LIFF ----------------------------------------------------
    // ⚠️ Endpoint URL ของ LIFF นี้ต้องตั้งเป็น "รากของเว็บไซต์"
    //    เช่น https://ftc-safety.netlify.app/  (ไม่ใช่ /index.html)
    //    เพื่อให้ลิงก์แบบ https://liff.line.me/<ID>/Bind/Line_Bind.html
    //    วิ่งไปหน้าที่ถูกต้องได้
    LIFF_ID: '2010907761-KrJ8PgNN',

    // ---- Storage ------------------------------------------------------
    BUCKET_WORKER_DOCS: 'worker-documents',

    // ---- ค่าคงที่ที่ใช้ร่วมกัน ------------------------------------------
    ROLE_LEVELS: [
      { value: 'Admin',          label: 'ผู้ดูแลระบบ' },
      { value: 'PM',             label: 'ผู้จัดการโครงการ' },
      { value: 'Safety_Officer', label: 'เจ้าหน้าที่ความปลอดภัย (จป.)' },
      { value: 'Engineer',       label: 'วิศวกรโครงการ' },
      { value: 'Foreman',        label: 'ผู้ควบคุมงาน' },
      { value: 'Purchasing',     label: 'ฝ่ายจัดซื้อ' },
      { value: 'Security',       label: 'เจ้าหน้าที่รักษาความปลอดภัย' },
      { value: 'Staff',          label: 'พนักงานทั่วไป' }
    ]
  };

  let _client = null;

  /** คืนค่า Supabase client ตัวเดียวใช้ร่วมกันทั้งหน้า */
  function supabase() {
    if (!_client) {
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error('ยังไม่ได้โหลด Supabase JS SDK ก่อนไฟล์ config.js');
      }
      _client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }
    return _client;
  }

  /** ที่อยู่รากของเว็บไซต์ เช่น https://ftc-safety.netlify.app */
  function siteRoot() {
    const path = window.location.pathname;
    // ตัดโฟลเดอร์ท้ายสุดออก 1 ชั้น (admin/ หรือ Bind/)
    const base = path.replace(/\/[^/]*$/, '').replace(/\/(admin|Bind|Worker|Permit|Training|Site|Emergency)$/i, '');
    return window.location.origin + (base === '/' ? '' : base);
  }

  /** สร้างลิงก์ผูกบัญชี LINE ที่เปิดผ่านแอป LINE ได้โดยตรง */
  function bindUrl(token) {
    return 'https://liff.line.me/' + CONFIG.LIFF_ID + '/Bind/Line_Bind.html?t=' + encodeURIComponent(token);
  }

  /** แปลง Date เป็นข้อความไทยอ่านง่าย */
  function thaiDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) +
           ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  /** กันข้อความจากฐานข้อมูลไม่ให้กลายเป็น HTML */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return Object.assign({}, CONFIG, { supabase, siteRoot, bindUrl, thaiDateTime, esc });
})();
