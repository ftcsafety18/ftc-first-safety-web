/* =====================================================================
 * FTC First Safety — จดจำโครงการที่กำลังทำงานอยู่ข้ามหน้า
 * ---------------------------------------------------------------------
 * ปัญหาที่แก้ : เดิมทุกหน้าจะเด้งกลับไปเลือกโครงการแรกในรายการเสมอ
 *              พอสลับหน้าไปมาระหว่าง Project Setup → Zone → BOQ
 *              ผู้ใช้ต้องเลือกโครงการใหม่ทุกครั้ง
 *
 * วิธีเรียกใช้ในหน้าเว็บ (ต้องโหลดหลัง config.js)
 *   <script src="../shared/session.js"></script>
 *
 *   const saved = FTC.getProject();              // อ่านค่าที่จำไว้
 *   FTC.setProject(id, name);                    // บันทึกเมื่อผู้ใช้เลือก
 *   FTC.pickProject(list, 'project_id');         // เลือกตัวที่ควรแสดงจากรายการ
 *
 * ใช้ sessionStorage ไม่ใช่ localStorage เพราะ
 *   ค่าควรหายไปเมื่อปิดเบราว์เซอร์ เพื่อไม่ให้คนที่มาใช้เครื่องต่อ
 *   เห็นว่าคนก่อนหน้าทำงานโครงการไหนอยู่
 * ===================================================================== */

(function () {
  'use strict';

  if (!window.FTC) {
    console.error('[FTC] ต้องโหลด config.js ก่อน session.js');
    return;
  }

  var KEY = 'ftc.current_project';

  /** คืนค่าโครงการที่จำไว้ หรือ null ถ้ายังไม่เคยเลือก */
  function getProject() {
    try {
      var raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /** บันทึกโครงการที่ผู้ใช้กำลังทำงานอยู่ */
  function setProject(id, name) {
    if (!id) { clearProject(); return; }
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        id: id, name: name || '', at: new Date().toISOString()
      }));
    } catch (e) { /* โหมดส่วนตัวของบางเบราว์เซอร์เขียนไม่ได้ ไม่ถือเป็นข้อผิดพลาด */ }
  }

  function clearProject() {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
  }

  /**
   * เลือกโครงการที่ควรแสดงจากรายการที่โหลดมา
   * ถ้าโครงการที่จำไว้ยังอยู่ในรายการก็ใช้ตัวนั้น
   * ถ้าไม่อยู่แล้ว (ถูกลบหรือเปลี่ยนสิทธิ์) จึงค่อยใช้ตัวแรก
   */
  function pickProject(list, idField) {
    idField = idField || 'project_id';
    if (!list || !list.length) return null;
    var saved = getProject();
    if (saved && saved.id) {
      var hit = list.filter(function (p) { return p[idField] === saved.id; })[0];
      if (hit) return hit[idField];
    }
    return list[0][idField];
  }

  window.FTC.getProject   = getProject;
  window.FTC.setProject   = setProject;
  window.FTC.clearProject = clearProject;
  window.FTC.pickProject  = pickProject;
})();
