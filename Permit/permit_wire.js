
/* =====================================================================
 * FTC First Safety — เชื่อมหน้าขอใบอนุญาตทำงานเข้ากับข้อมูลจริง
 * ---------------------------------------------------------------------
 * วิธีติดตั้ง : เพิ่มบรรทัดนี้ก่อน </body> ของ Permit_Request.html
 *              (ต้องอยู่หลัง <script> เดิมทั้งหมด)
 *
 *   <script src="permit_wire.js"></script>
 *
 * ไฟล์นี้ทำอะไรบ้าง
 *   1. ดึงรายการโครงการที่เปิดใช้งานจริงมาแทนรายการที่ hardcode ไว้
 *   2. ดึงงานย่อย WBS ของโครงการนั้นมาให้เลือก พร้อมพก vendor_id
 *      เขตพื้นที่ และช่วงเวลาของงานมาด้วย
 *   3. เติมผู้รับเหมาให้อัตโนมัติจากงานย่อยที่เลือก
 *      (เดิม hardcode 'C001' ไว้ ซึ่งทำให้ใบงานทุกใบขึ้นชื่อผู้รับเหมาผิด)
 *   4. ใช้เขตพื้นที่จาก WBS แทนการเดาจากประเภทงาน
 *   5. เติม risk_code จากตารางตั้งค่างานเสี่ยงสูง เพื่อให้ Trigger
 *      ฝั่งฐานข้อมูลบล็อกบุคคลธรรมดาได้ถูกต้อง
 *   6. บันทึก JSA แบบกระดาษลงตาราง tb_jsa ให้ด้วย
 *      ไม่งั้นจะติด Trigger ตอนทำ TBT เพราะระบบมองว่ายังไม่มี JSA
 *
 * ไฟล์นี้เขียนทับฟังก์ชัน submitPermit ของเดิม โดยไม่แก้โค้ดเดิมเลย
 * ถ้าอยากย้อนกลับ แค่ลบแท็ก script ออก
 * ===================================================================== */

(function () {
  'use strict';

  var SB_URL = 'https://ancwqgaaqliandzdzphg.supabase.co';
  var SB_KEY = 'sb_publishable_IVdSBILj_etRSNF48ig1PA_sBAt23NG';
  var BUCKET = 'worker-documents';   // ใช้ bucket ที่มีอยู่จริง ไม่ต้องสร้างใหม่

  var sb = null;
  var TASKS = [];        // งานย่อยของโครงการที่เลือกอยู่
  var RISK_CATS = [];    // ตารางตั้งค่างานเสี่ยงสูง
  var MY_WORKER = null;  // ข้อมูลคนงานที่ผูกกับบัญชี LINE นี้

  /* ---------- ตัวช่วย ---------- */
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function money(n) { return Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 }); }

  function waitFor(check, cb, tries) {
    tries = tries || 0;
    if (check()) { cb(); return; }
    if (tries > 80) { console.warn('[FTC] รอหน้าเดิมโหลดนานเกินไป'); return; }
    setTimeout(function () { waitFor(check, cb, tries + 1); }, 100);
  }

  /* ---------- 1. โครงการ ---------- */
  async function loadProjects() {
    var sel = $('project-input');
    sel.innerHTML = '<option value="" disabled selected>-- กำลังโหลดโครงการ --</option>';

    var r = await sb.from('tb_projects')
      .select('project_id, project_name, status, start_date, end_date')
      .order('project_name');

    if (r.error) {
      console.error('[FTC] โหลดโครงการไม่สำเร็จ', r.error);
      sel.innerHTML = '<option value="">โหลดรายการโครงการไม่สำเร็จ</option>';
      return;
    }

    var active = (r.data || []).filter(function (p) { return p.status === 'Active'; });

    if (!active.length) {
      sel.innerHTML = '<option value="" disabled selected>-- ยังไม่มีโครงการที่เปิดใช้งาน --</option>';
      Swal.fire({
        icon: 'info',
        title: 'ยังไม่มีโครงการที่เปิดใช้งาน',
        html: 'โครงการต้องตั้งค่าข้อมูลให้ครบและกดเปิดใช้งานก่อน<br>จึงจะขอใบอนุญาตทำงานได้',
        confirmButtonColor: '#2A4365'
      });
      return;
    }

    sel.innerHTML = '<option value="" disabled selected>-- เลือกโครงการ --</option>' +
      active.map(function (p) {
        return '<option value="' + esc(p.project_id) + '">' + esc(p.project_name) + '</option>';
      }).join('');

    sel.addEventListener('change', function () { loadTasks(sel.value); });
  }

  /* ---------- 2. งานย่อย WBS ---------- */
  async function loadTasks(projectId) {
    var sel = $('wbs-input');
    TASKS = [];
    sel.innerHTML = '<option value="" disabled selected>-- กำลังโหลดแผนงาน --</option>';
    if (typeof refresh === 'function') refresh();

    // งานย่อยผูกกับโครงการผ่านรายการ BOQ จึงต้องดึง BOQ ของโครงการก่อน
    var b = await sb.from('tb_boq_master').select('boq_id, category, description').eq('project_id', projectId);
    if (b.error || !b.data || !b.data.length) {
      sel.innerHTML = '<option value="" disabled selected>-- โครงการนี้ยังไม่มีรายการ BOQ --</option>';
      return;
    }

    var t = await sb.from('tb_wbs_tasks')
      .select('task_id, boq_id, vendor_id, task_name, start_date, end_date, location_detail, risk_area_class')
      .in('boq_id', b.data.map(function (x) { return x.boq_id; }))
      .order('start_date');

    if (t.error) {
      console.error('[FTC] โหลดงานย่อยไม่สำเร็จ', t.error);
      sel.innerHTML = '<option value="">โหลดแผนงานไม่สำเร็จ</option>';
      return;
    }
    if (!t.data || !t.data.length) {
      sel.innerHTML = '<option value="" disabled selected>-- โครงการนี้ยังไม่มีงานย่อยที่มอบหมาย --</option>';
      Swal.fire({
        icon: 'info',
        title: 'ยังไม่มีงานย่อยในโครงการนี้',
        text: 'ต้องมอบหมายงานย่อยในระบบ WBS ก่อน จึงจะขอใบอนุญาตได้',
        confirmButtonColor: '#2A4365'
      });
      return;
    }

    // ดึงชื่อผู้รับเหมามาแสดงคู่กับงาน
    var vIds = [...new Set(t.data.map(function (x) { return x.vendor_id; }))];
    var v = await sb.from('tb_vendors').select('vendor_id, vendor_name, entity_type, is_blacklisted').in('vendor_id', vIds);
    var vMap = {};
    (v.data || []).forEach(function (x) { vMap[x.vendor_id] = x; });

    TASKS = t.data.map(function (x) {
      x._vendor = vMap[x.vendor_id] || { vendor_name: x.vendor_id };
      x._boq = b.data.find(function (y) { return y.boq_id === x.boq_id; }) || {};
      return x;
    });

    sel.innerHTML = '<option value="" disabled selected>-- เลือกแผนงาน --</option>' +
      TASKS.map(function (x) {
        return '<option value="' + esc(x.task_id) + '">' +
               esc(x.task_name) + ' — ' + esc(x._vendor.vendor_name) + '</option>';
      }).join('');
  }

  /* ---------- 3. เมื่อเลือกงานย่อย ---------- */
  function onTaskChange() {
    var task = TASKS.find(function (x) { return x.task_id === $('wbs-input').value; });
    var box  = $('ftc-task-info');
    if (!task) { if (box) box.classList.add('hidden'); return; }

    // เติมข้อมูลที่ระบบรู้อยู่แล้ว ไม่ต้องให้โฟร์แมนพิมพ์เอง
    if (!$('location-input').value && task.location_detail) {
      $('location-input').value = task.location_detail;
    }
    if (!$('req-company-input').value) {
      $('req-company-input').value = task._vendor.vendor_name || '';
    }

    // จำกัดเวลาทำงานให้อยู่ในช่วงของงานย่อย
    if (task.start_date) $('start-time').min = task.start_date + 'T00:00';
    if (task.end_date)   $('end-time').max   = task.end_date + 'T23:59';

    var ZONE = {
      'เขตอันตราย': ['bg-red-50 border-red-200 text-red-700', 'พื้นที่นี้ถูกจัดเป็นเขตอันตราย ต้องตรวจสอบเข้มเป็นพิเศษ'],
      'เขตควบคุม':  ['bg-amber-50 border-amber-200 text-amber-800', 'พื้นที่นี้เป็นเขตควบคุม'],
      'เขตปลอดภัย': ['bg-emerald-50 border-emerald-200 text-emerald-800', 'พื้นที่นี้เป็นเขตปลอดภัย']
    };
    var z = ZONE[task.risk_area_class] || ZONE['เขตควบคุม'];

    if (box) {
      box.className = 'rounded-xl border p-3 text-[12px] leading-relaxed ' + z[0];
      box.innerHTML =
        '<p class="font-bold mb-1">ข้อมูลจากแผนงานที่เลือก</p>' +
        '<p>ผู้รับเหมา: <b>' + esc(task._vendor.vendor_name) + '</b> (' + esc(task.vendor_id) + ')' +
        (task._vendor.is_blacklisted ? ' <span class="font-bold">— ถูกขึ้นบัญชีดำ</span>' : '') + '</p>' +
        '<p>เขตพื้นที่: <b>' + esc(task.risk_area_class) + '</b> — ' + z[1] + '</p>' +
        '<p>ช่วงเวลาตามแผน: ' + esc(task.start_date) + ' ถึง ' + esc(task.end_date) + '</p>';
      box.classList.remove('hidden');
    }

    if (task._vendor.is_blacklisted) {
      Swal.fire({
        icon: 'error',
        title: 'ผู้รับเหมาถูกขึ้นบัญชีดำ',
        html: 'งานย่อยนี้มอบหมายให้ <b>' + esc(task._vendor.vendor_name) + '</b><br>' +
              'ซึ่งถูกระงับสิทธิ์ ไม่สามารถขอใบอนุญาตทำงานได้',
        confirmButtonColor: '#2A4365'
      });
    }

    if (typeof refresh === 'function') refresh();
  }

  /* ---------- 4. จับคู่ประเภทงานกับรหัสความเสี่ยง ---------- */
  async function loadRiskCategories() {
    var r = await sb.from('tb_risk_categories')
      .select('risk_code, risk_name_th, risk_name_en, is_high_risk, require_jsa, block_individual')
      .eq('is_active', true);
    RISK_CATS = r.error ? [] : (r.data || []);
  }

  /**
   * แปลงชื่อประเภทงานที่ผู้ใช้เลือกบนหน้าจอ ให้เป็น risk_code ในฐานข้อมูล
   * ต้องแปลงให้ได้ เพราะ Trigger ฝั่งฐานข้อมูลใช้ risk_code ตัดสินว่า
   * จะบล็อกผู้รับเหมาบุคคลธรรมดาหรือไม่
   */
  function mapRiskCode(workTypes) {
    var MAP = {
      'งานที่อับอากาศ': 'CONFINED_SPACE',
      'งานเชื่อม/ก่อประกายไฟ': 'HOT_WORK',
      'งานบนที่สูง': 'WORK_AT_HEIGHT',
      'งานขุดเจาะดิน': 'EXCAVATION',
      'งานเกี่ยวกับไฟฟ้า': 'ELECTRICAL',
      'งานยกของหนัก/เครน': 'LIFTING',
      'งานเกี่ยวกับสารเคมี': 'CHEMICAL',
      'งานรื้อถอน/โครงสร้าง': 'DEMOLITION'
    };
    // ถ้าเลือกหลายประเภท ให้ยึดประเภทที่เข้มงวดที่สุดเป็นตัวแทน
    var ORDER = ['CONFINED_SPACE','WORK_AT_HEIGHT','HOT_WORK','ELECTRICAL',
                 'EXCAVATION','LIFTING','CHEMICAL','DEMOLITION'];
    var found = [];
    workTypes.forEach(function (w) { if (MAP[w]) found.push(MAP[w]); });
    if (!found.length) return 'GENERAL';
    for (var i = 0; i < ORDER.length; i++) {
      if (found.indexOf(ORDER[i]) !== -1) return ORDER[i];
    }
    return found[0];
  }

  /* ---------- 5. หาตัวตนผู้ขอจากบัญชี LINE ---------- */
  async function loadMyWorker(uid) {
    if (!uid) return;
    var r = await sb.from('tb_workers')
      .select('worker_id, full_name, vendor_id, badge_status, training_passed')
      .eq('line_user_id', uid).maybeSingle();
    if (!r.error && r.data) {
      MY_WORKER = r.data;
      if (!$('req-name-input').value) $('req-name-input').value = r.data.full_name || '';
      if (typeof refresh === 'function') refresh();
    }
  }

  /* ---------- 6. เขียนทับฟังก์ชันส่งคำขอ ---------- */
  window.submitPermit = async function () {
    var step = 'ตรวจข้อมูล';
    try {
      var task = TASKS.find(function (x) { return x.task_id === $('wbs-input').value; });
      if (!task) {
        Swal.fire('ยังไม่ได้เลือกแผนงาน', 'เลือกงานย่อยที่จะขอใบอนุญาตก่อน', 'warning');
        return;
      }
      if (task._vendor.is_blacklisted) {
        Swal.fire('ผู้รับเหมาถูกขึ้นบัญชีดำ', 'ไม่สามารถขอใบอนุญาตให้ผู้รับเหมารายนี้ได้', 'error');
        return;
      }

      var st = $('start-time').value, en = $('end-time').value;
      if (new Date(en) <= new Date(st)) {
        Swal.fire('เวลาไม่ถูกต้อง', 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มงาน', 'warning');
        return;
      }
      if (task.start_date && st.slice(0,10) < task.start_date) {
        Swal.fire('อยู่นอกช่วงแผนงาน',
          'งานย่อยนี้เริ่มได้ตั้งแต่ ' + task.start_date + ' เป็นต้นไป', 'warning');
        return;
      }
      if (task.end_date && en.slice(0,10) > task.end_date) {
        Swal.fire('อยู่นอกช่วงแผนงาน',
          'งานย่อยนี้ต้องแล้วเสร็จภายใน ' + task.end_date, 'warning');
        return;
      }

      Swal.fire({ title: 'กำลังบันทึกข้อมูล...', allowOutsideClick: false, didOpen: function () { Swal.showLoading(); } });

      /* ---- รวมประเภทงานและ PPE ---- */
      var workTypes = [];
      if (generalWork) {
        workTypes = ['งานทั่วไป (General Work)'];
      } else {
        selectedRisk.forEach(function (risk) {
          if (risk === 'งานอื่นๆ (ระบุ)') {
            var el = document.getElementById('otherRiskSelect');
            workTypes.push(el.value === 'custom'
              ? document.getElementById('otherRiskText').value.trim() : el.value);
          } else { workTypes.push(risk); }
        });
      }

      var ppe = [];
      selectedPPE.forEach(function (p) {
        if (p === 'อื่นๆ (โปรดระบุ)') {
          var el = document.getElementById('otherPPESelect');
          ppe.push(el.value === 'custom'
            ? document.getElementById('otherPPEText').value.trim() : el.value);
        } else { ppe.push(p); }
      });

      /* ---- อัปโหลด JSA แบบกระดาษ ---- */
      var jsaPath = null;
      if (jsaMode === 'photo' && compressedJsaFile) {
        step = 'อัปโหลดรูป JSA';
        Swal.update({ title: 'กำลังอัปโหลดรูป JSA...' });
        jsaPath = 'jsa-docs/' + Date.now() + '_' + Math.random().toString(36).slice(2,7) + '.jpg';
        var up = await sb.storage.from(BUCKET).upload(jsaPath, compressedJsaFile);
        if (up.error) throw up.error;
      }

      /* ---- ประกอบข้อมูลที่จะบันทึก ---- */
      step = 'บันทึกใบอนุญาต';
      var ptwId = 'PTW-' + new Date().getFullYear() + '-' + Date.now().toString().slice(-8);
      var riskCode = mapRiskCode(workTypes);

      var payload = {
        ptw_id: ptwId,
        task_id: task.task_id,
        vendor_id: task.vendor_id,                    // มาจากแผนงานจริง ไม่ใช่ค่าตายตัว
        requester_id: (MY_WORKER && MY_WORKER.worker_id) || lineUserId || 'UNKNOWN',
        ptw_type: workTypes.join(', ').substring(0, 255),
        work_description: $('location-input').value.trim(),
        risk_area_class: task.risk_area_class,        // มาจาก WBS ไม่ใช่การเดา
        risk_code: riskCode,
        start_time: $('start-time').value,
        end_time: $('end-time').value,
        assets_list: scannedAssets,
        status: 'Pending',
        specific_data: {
          project_id: $('project-input').value,
          boq_id: task.boq_id,
          req_name: $('req-name-input').value.trim(),
          req_company: $('req-company-input').value.trim(),
          req_line_uid: lineUserId || null,
          ppe_required: ppe,
          jsa_mode: jsaMode,
          jsa_file_path: jsaPath,
          declaration_checked: true,
          submitted_at: new Date().toISOString()
        }
      };

      var ins = await sb.from('tb_work_permits').insert(payload);
      if (ins.error) throw ins.error;

      /* ---- สร้างระเบียน JSA ให้ด้วยเมื่อแนบเป็นรูปถ่าย ----
         ไม่งั้นตอนทำ TBT จะติด Trigger เพราะระบบมองว่ายังไม่มี JSA */
      if (jsaMode === 'photo' && jsaPath) {
        step = 'บันทึกเอกสาร JSA';
        var jsa = await sb.from('tb_jsa').insert({
          ptw_id: ptwId,
          submitter_id: payload.requester_id,
          job_steps: [{ step: 'แนบเอกสาร JSA แบบกระดาษ', hazard: 'ดูรายละเอียดในไฟล์แนบ',
                        control: 'ดูรายละเอียดในไฟล์แนบ' }],
          attachment_url: jsaPath,
          status: 'Submitted'
        });
        if (jsa.error) console.error('[FTC] บันทึก JSA ไม่สำเร็จ', jsa.error);
      }

      /* ---- แจ้งเตือน จป. ประจำโครงการ ---- */
      step = 'เข้าคิวแจ้งเตือน';
      await queueNotify(payload, task);

      Swal.close();
      await new Promise(function (r) { setTimeout(r, 250); });

      var isHigh = !generalWork;
      Swal.fire({
        icon: 'success',
        title: 'ส่งคำขอเรียบร้อย',
        html: 'เลขที่ใบงาน <b>' + esc(ptwId) + '</b><br>' +
              (jsaMode === 'ejsa' && isHigh
                ? 'ระบบกำลังพาท่านไปจัดทำ E-JSA ต่อ'
                : 'ส่งให้เจ้าหน้าที่ความปลอดภัยพิจารณาแล้ว'),
        confirmButtonColor: '#2A4365',
        confirmButtonText: (jsaMode === 'ejsa' && isHigh) ? 'ไปจัดทำ E-JSA' : 'เสร็จสิ้น'
      }).then(function () {
        if (jsaMode === 'ejsa' && isHigh) {
          window.location.href = 'SWI_EJSA_Form.html?ptw_id=' + encodeURIComponent(ptwId);
        } else if (typeof liff !== 'undefined' && liff.isInClient && liff.isInClient()) {
          liff.closeWindow();
        } else {
          window.location.reload();
        }
      });

    } catch (err) {
      Swal.close();
      await new Promise(function (r) { setTimeout(r, 250); });
      showError(err, step);
    }
  };

  /* ---------- 7. เข้าคิวแจ้งเตือน จป. ---------- */
  async function queueNotify(payload, task) {
    try {
      var proj = $('project-input').value;
      var ps = await sb.from('tb_project_staff')
        .select('staff_id, duty_role').eq('project_id', proj)
        .eq('is_active', true).in('duty_role', ['Safety_Officer', 'PM']);
      if (ps.error || !ps.data || !ps.data.length) return;

      var st = await sb.from('tb_internal_staff')
        .select('staff_id, full_name, line_uid, email')
        .in('staff_id', ps.data.map(function (x) { return x.staff_id; }));
      if (st.error || !st.data) return;

      var rows = [];
      st.data.forEach(function (s) {
        var body = {
          ptw_id: payload.ptw_id, task_name: task.task_name,
          vendor_name: task._vendor.vendor_name,
          risk_area: payload.risk_area_class, ptw_type: payload.ptw_type,
          requester: payload.specific_data.req_name,
          start_time: payload.start_time, end_time: payload.end_time
        };
        // LINE เป็นช่องทางหลัก ส่วนอีเมลใช้เฉพาะเรื่องที่ต้องมีหลักฐานเป็นทางการ
        if (s.line_uid) {
          rows.push({ event_code:'PERMIT_REQUESTED', channel:'LINE',
            recipient_type:'Staff', recipient_id:s.staff_id, to_line_uid:s.line_uid,
            payload: body, priority: payload.risk_area_class === 'เขตอันตราย' ? 2 : 5 });
        }
        if (s.email) {
          rows.push({ event_code:'PERMIT_REQUESTED', channel:'EMAIL',
            recipient_type:'Staff', recipient_id:s.staff_id, to_email:s.email,
            subject:'คำขอใบอนุญาตทำงานรอพิจารณา ' + payload.ptw_id,
            payload: body, priority: 5 });
        }
      });

      if (rows.length) {
        var n = await sb.from('tb_notifications').insert(rows);
        if (n.error) console.error('[FTC] เข้าคิวแจ้งเตือนไม่สำเร็จ', n.error);
      }
    } catch (e) {
      // แจ้งเตือนล้มเหลวต้องไม่ทำให้ใบงานที่บันทึกไปแล้วเสียหาย
      console.error('[FTC] queueNotify error', e);
    }
  }

  /* ---------- 8. รายงานข้อผิดพลาดแบบอ่านรู้เรื่อง ---------- */
  function showError(err, step) {
    console.error('[FTC] submitPermit error', { step: step, error: err });
    var e = err || {};
    var code = String(e.code || '');
    var msg  = String(e.message || err);
    var hint = '';

    // ข้อความจาก Trigger ฝั่งฐานข้อมูล มาในรูป P0001 พร้อมข้อความไทยอยู่แล้ว
    if (code === 'P0001') { hint = ''; }
    else if (code === '23503') hint = 'ข้อมูลอ้างอิงไม่ถูกต้อง — แผนงานหรือผู้รับเหมาอาจถูกลบไปแล้ว';
    else if (code === '23514') hint = 'ค่าไม่ผ่านเงื่อนไขฐานข้อมูล — เขตพื้นที่ต้องเป็น 1 ใน 3 ค่าที่กำหนด';
    else if (code === '23505') hint = 'เลขที่ใบงานซ้ำ กรุณากดส่งใหม่อีกครั้ง';
    else if (code === '42501' || /permission denied|row-level security/i.test(msg))
      hint = 'ฐานข้อมูลปฏิเสธสิทธิ์ กรุณาแจ้งผู้ดูแลระบบ';
    else if (/Bucket not found/i.test(msg)) hint = 'ไม่พบที่เก็บไฟล์ กรุณาแจ้งผู้ดูแลระบบ';

    Swal.fire({
      icon: 'error',
      title: 'ส่งคำขอไม่สำเร็จ',
      html: (hint ? '<p style="font-size:.9rem;margin-bottom:.6rem">' + esc(hint) + '</p>' : '') +
            '<p style="font-size:.85rem;color:#334155">' + esc(msg) + '</p>' +
            '<p style="font-size:.7rem;color:#94a3b8;margin-top:.6rem">ขั้นตอน: ' + esc(step) +
            (code ? ' · รหัส: ' + esc(code) : '') + '</p>',
      confirmButtonColor: '#2A4365'
    });
  }

  /* ---------- เริ่มทำงาน ---------- */
  function boot() {
    if (!window.supabase || !window.supabase.createClient) {
      console.error('[FTC] ยังไม่ได้โหลด Supabase SDK');
      return;
    }
    sb = window.supabase.createClient(SB_URL, SB_KEY);

    // กล่องแสดงข้อมูลจากแผนงานที่เลือก แทรกใต้ช่องเลือกแผนงาน
    var wbsSel = $('wbs-input');
    if (wbsSel && !$('ftc-task-info')) {
      var box = document.createElement('div');
      box.id = 'ftc-task-info';
      box.className = 'hidden';
      wbsSel.parentElement.parentElement.appendChild(box);
    }
    wbsSel.addEventListener('change', onTaskChange);

    loadRiskCategories();
    loadProjects();

    // รอ LIFF ให้ค่า lineUserId ก่อนค่อยหาตัวตนผู้ขอ
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (typeof lineUserId !== 'undefined' && lineUserId) {
        clearInterval(timer);
        loadMyWorker(lineUserId);
      } else if (tries > 40) { clearInterval(timer); }
    }, 250);
  }

  waitFor(function () {
    return document.getElementById('wbs-input') && typeof window.supabase !== 'undefined';
  }, boot);
})();
