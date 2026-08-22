/* =====================================================================
 * FTC First Safety — ตัวเชื่อมหน้า Vendor Portal กับ Edge Function
 * ---------------------------------------------------------------------
 * วิธีเรียกใช้ในหน้าเว็บ (โหลดหลัง LIFF SDK)
 *   <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
 *   <script src="../shared/vendor-api.js"></script>
 *
 *   await VendorAPI.ready();                       // เข้าสู่ระบบ LINE
 *   const me = await VendorAPI.call('me');
 *   const list = await VendorAPI.call('workers.list');
 *
 * หน้าเว็บไม่เคยรู้จักรหัสผู้รับเหมาของตัวเองจนกว่าเซิร์ฟเวอร์จะบอก
 * และส่งรหัสไปเองไม่ได้ เพราะฝั่งเซิร์ฟเวอร์กำหนดจาก LINE UID เสมอ
 * ===================================================================== */

(function () {
  'use strict';

  var CONFIG = {
    liffId:      '2010907761-KrJ8PgNN',
    supabaseUrl: 'https://ancwqgaaqliandzdzphg.supabase.co',
    anonKey:     'sb_publishable_IVdSBILj_etRSNF48ig1PA_sBAt23NG',
    functionName:'vendor-api'
  };

  var _ready = null;
  var _vendor = null;

  function endpoint() {
    return CONFIG.supabaseUrl.replace('.supabase.co', '.functions.supabase.co') +
           '/' + CONFIG.functionName;
  }

  /** เตรียม LIFF และให้แน่ใจว่าผู้ใช้ล็อกอิน LINE แล้ว */
  function ready() {
    if (_ready) return _ready;

    _ready = (async function () {
      if (typeof liff === 'undefined') {
        throw new Error('ยังไม่ได้โหลด LINE SDK');
      }
      await liff.init({ liffId: CONFIG.liffId });

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        // หน้าจะถูกเปลี่ยนไปหน้าล็อกอิน จึงหยุดรอตรงนี้
        await new Promise(function () {});
      }
      return true;
    })();

    return _ready;
  }

  /**
   * เรียกคำสั่งไปที่ Edge Function
   * แนบ LINE ID Token ไปทุกครั้ง เซิร์ฟเวอร์จะตรวจกับ LINE ก่อนตอบกลับ
   */
  async function call(action, payload) {
    await ready();

    var idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error('อ่านข้อมูลบัญชี LINE ไม่ได้ กรุณาปิดแล้วเปิดหน้านี้ใหม่');
    }

    var body = Object.assign({ action: action }, payload || {});

    var res = await fetch(endpoint(), {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + idToken,
        'apikey': CONFIG.anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    var data = await res.json().catch(function () { return {}; });

    if (!res.ok || !data.ok) {
      var e = new Error(data.error || 'เชื่อมต่อระบบไม่สำเร็จ');
      e.code = data.code;
      e.status = res.status;
      throw e;
    }
    return data;
  }

  /** ข้อมูลบริษัทของผู้ใช้ เก็บไว้ใช้ซ้ำไม่ต้องถามใหม่ทุกครั้ง */
  async function me() {
    if (_vendor) return _vendor;
    var r = await call('me');
    _vendor = r.vendor;
    return _vendor;
  }

  /**
   * อัปโหลดไฟล์ผ่านลิงก์ที่เซิร์ฟเวอร์ออกให้
   * หน้าเว็บไม่มีสิทธิ์เขียน Storage โดยตรง จึงต้องขอลิงก์ใช้ครั้งเดียวก่อน
   */
  async function uploadFile(file, kind) {
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var signed = await call('storage.sign', { kind: kind, ext: ext });

    var up = await fetch(signed.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file
    });

    if (!up.ok) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่');
    return signed.path;
  }

  window.VendorAPI = {
    config: CONFIG,
    ready: ready,
    call: call,
    me: me,
    uploadFile: uploadFile
  };
})();
