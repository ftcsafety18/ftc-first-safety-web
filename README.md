# ftc-first-safety-web# โครงการ FTC Digital Safety Transformation (Project Paperless)

## 📌 ภาพรวมโครงการ (Project Overview)
ระบบบริหารจัดการความปลอดภัยแบบดิจิทัลผ่าน LINE OA เพื่อลดการใช้กระดาษ โดยมีระบบหลักคือ การขออนุญาตทำงาน (E-Permit), การลงเวลาและ TBT, และการตรวจพื้นที่ (Digital Sitewalk)

## 📂 โครงสร้างระบบและไฟล์ปัจจุบัน (Project Structure)

### 1. ฝั่งความปลอดภัย (Folder: JoPor)
* `E-Permit.html` : หน้าจัดการใบอนุญาตเข้าทำงาน
* `Digital Sitewalk.html` : ระบบตรวจประเมินหน้างาน
* `Digital_Sitewalk_Dashboard.html` : หน้ากระดานสรุปผลการเดินตรวจพื้นที่
* `Digital_Sitewalk_Export.html` : หน้าสำหรับการ Export ข้อมูล

### 2. ฝั่งผู้รับเหมา (Folder: Vender)
* `Vendor_Dashboard.html` : หน้ากระดานหลักของผู้รับเหมา
* `Equipment_Regis.html` : ระบบลงทะเบียนเครื่องมือ/อุปกรณ์
* `Worker_Regis.html` : ระบบลงทะเบียนรายชื่อผู้ปฏิบัติงาน
* `PTW_Request.html` : ฟอร์มหลักสำหรับขออนุญาตเข้าทำงาน (อยู่หน้า Root)

### 3. ฝั่งผู้ดูแลระบบ (Folder: Admin)
* `Admin_Approval.html` : หน้าอนุมัติหลัก
* `Admin_Equipment_Approval.html` : หน้าอนุมัติเครื่องมือ
* `Admin_Vendor_Approval.html` : หน้าจัดการผู้รับเหมา

## 📖 คำศัพท์และมาตรฐานของโครงการ (Terminology)
เพื่อความเข้าใจที่ตรงกันในการพัฒนาระบบ ให้ใช้คำศัพท์วิชาการภาษาไทยดังนี้:
* **Hot Zone** ให้แปลว่า **เขตอันตราย**
* **Warm Zone** ให้แปลว่า **เขตควบคุม**
* **Safe Zone** ให้แปลว่า **เขตปลอดภัย**
* **Decon** ให้แปลว่า **การชำระล้าง**

## 🚀 สถานะการทำงานปัจจุบัน (Current Status)
* [x] ออกแบบฟอร์ม PTW Request เสร็จแล้ว
* [x] โครงสร้างหน้า Dashboard ต่างๆ เสร็จแล้ว
* [ ] กำลังพัฒนา: ระบบ PTW Activation หน้างาน (การเปิดใบงานและเช็คชื่อ TBT)
* [ ] แผนงานต่อไป: ผูกระบบ E-Tagging กับ QR Code


## 🗄️ โครงสร้างฐานข้อมูล (Supabase: FTC-Master-DB)

### 1. ข้อมูลผู้รับเหมา (table_vendors)
* `vendor_id` (varchar) : รหัสผู้รับเหมา (เช่น VEN001)
* `vendor_name` (varchar) : ชื่อบริษัท/ผู้รับเหมา
* `entity_type` (varchar/enum) : ประเภท (Corporate / Individual)
* `accum_billing` (numeric) : ยอดบิลลิ่งสะสม
* `vendor_rating` (int4) : คะแนนประเมินผู้รับเหมา

### 2. ข้อมูลใบขออนุญาตเข้าทำงาน (table_permits / table_e_ptw)
* `permit_id` (...) : รหัสใบขออนุญาต
* `...` (รอเติมคอลัมน์ที่จำเป็น เช่น สถานะ, วันที่, พื้นที่)

### 3. ข้อมูลพนักงานและผู้ปฏิบัติงาน (table_users / table_permit_workers)
* `...` (รอเติมคอลัมน์ที่จำเป็น)

### 4. ข้อมูลการลงเวลาและ TBT (table_toolbox_talks)
* `...` (รอเติมคอลัมน์ที่จำเป็น)

### 5. ข้อมูลพื้นที่ปฏิบัติงาน (table_area_master)
* `...` (รอเติมคอลัมน์ที่จำเป็น)


## 🗄️ โครงสร้างฐานข้อมูล (Database & Backend)
*(ระบุแพลตฟอร์มที่ใช้ เช่น Google Sheets, Firebase, หรือ SQL)*

### การเชื่อมต่อ LINE OA (LIFF)
* เมนูที่ 1: ลิงก์ไปที่หน้า `PTW_Request.html` (สำหรับผู้รับเหมาขออนุญาต)
* เมนูที่ 2: ลิงก์ไปที่หน้า...
* เมนูที่ 3: ลิงก์ไปที่หน้า...

### โครงสร้างตารางข้อมูล (Data Tables)
* **Table_PTW :** เก็บข้อมูลใบขออนุญาตทำงาน (รหัสใบงาน, วันที่, เขตพื้นที่, สถานะการอนุมัติ)
* **Table_Users :** เก็บข้อมูลพนักงาน/ผู้รับเหมา (ชื่อ, รหัส, สังกัด)
* **Table_Equipment :** เก็บทะเบียนอุปกรณ์ที่ผ่านการตรวจสอบ
* **Table_Attendance :** เก็บข้อมูลการลงเวลาและการทำ TBT ประจำวัน

* ## 📱 การเชื่อมต่อระบบ LINE (LINE Developers)

**Provider:** First Technology

### 1. ข้อมูล LIFF App (หน้าต่างแอปใน LINE)
อ้างอิงจากการตั้งค่าใน Channel "FTC Safety Login":
* **LIFF app name:** FTC Safety
* **LIFF ID:** 2010907761-KrJ8PgNN
* **LIFF URL:** https://liff.line.me/2010907761-KrJ8PgNN
* **Display Size:** Full

### 2. รายการ Channel ทั้งหมดในระบบ (Channels List)
แชนเนลที่สร้างไว้ภายใต้ Provider นี้ประกอบด้วย:

**ประเภท LINE Login:**
* FTC Digital Safety (สถานะ: Published)
* FTC Safety V2 (สถานะ: Published)
* FTC Safety Login (สถานะ: Developing)
* FTC-Menu-LineOA (สถานะ: Developing)
* FTC Scanner App (สถานะ: Developing)
* FTC Safety Form (สถานะ: Developing)

**ประเภท Messaging API (แชทบอท):**
* FTC First Safety
* FTC Cloud Storage

* # 🛡️ FTC First Safety - Worker Registration System
**Project:** Digital Safety Transformation (Project Paperless)
**Form Document ID:** FM-SAF-01
**Version:** 1.0 (Front-end Registration Completed)

## 📌 สรุปภาพรวมของระบบ (Project Overview)
ระบบลงทะเบียนเข้าปฏิบัติงานสำหรับลูกจ้าง/ผู้รับเหมา (Vendor) ก่อนเข้าพื้นที่ทำงานของบริษัท First Technology ถูกออกแบบมาเพื่อทดแทนระบบกระดาษ (Paperless) โดยเน้นความง่ายในการใช้งานบนมือถือ (Mobile-First) ความแม่นยำของข้อมูล (Data Validation) และเชื่อมต่อกับระบบการอบรมความปลอดภัย (E-Learning)

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)
*   **โครงสร้างหลัก:** HTML5 (Single-file Architecture) เพื่อความคล่องตัวในการนำไปติดตั้งใช้งาน
*   **ดีไซน์และ CSS:** Tailwind CSS (ผ่าน CDN)
*   **การทำงาน (Logic):** Vanilla JavaScript (ไม่พึ่งพา Framework หนักๆ)
*   **ไอคอน:** Lucide Icons
*   **กราฟิก:** โลโก้ "1First Technology" สร้างด้วย CSS และ SVG 100% (ไม่ต้องใช้ไฟล์รูปภาพภายนอก เพื่อป้องกันภาพสูญหาย/ภาพแตก)

## ✅ ฟีเจอร์ที่พัฒนาเสร็จสิ้นแล้ว (Completed Features - Phase 1)
ระบบฟอร์มลงทะเบียนแบบ 3 ขั้นตอน (Multi-step Form) พร้อมระบบป้องกันข้อผิดพลาดอย่างเข้มงวด:

1.  **Step 1: ข้อมูลส่วนตัวและการจ้างงาน (Personal Info)**
    *   **ระบบสัญชาติ (Nationality):** รองรับ ไทย/ต่างชาติ โดยแบบฟอร์มจะปรับเปลี่ยนช่องกรอกเอกสารอัตโนมัติ (บัตรประชาชน 13 หลัก / Passport / Pink Card / Work Permit)
    *   **Smart Vendor Search:** ระบบค้นหาชื่อบริษัทต้นสังกัดแบบ Auto-complete พิมพ์คำค้นหาเพื่อกรองรายชื่อจาก Master Data (แก้ปัญหา Dropdown ที่ยาวเกินไป)
    *   **Data Validation:** บล็อกการกดข้ามสเต็ปหากข้อมูลไม่ครบ บังคับกรอกเบอร์โทร 10 หลัก และเลขบัตรประชาชน 13 หลัก (รับเฉพาะตัวเลข)
    *   **PDPA Consent:** บังคับกดยอมรับเงื่อนไขการเก็บข้อมูล ชีวมิติ/ใบหน้า, สุขภาพ, และพิกัด GPS
2.  **Step 2: อัปโหลดเอกสาร (Document Upload)**
    *   มี UI กล่องสำหรับอัปโหลดไฟล์ที่สวยงาม รองรับไฟล์รูปภาพและ PDF
    *   เงื่อนไขปรับตามสัญชาติ (ต่างชาติต้องอัปโหลด Work Permit เพิ่ม)
3.  **Step 3: ยืนยันตัวตน (Identity Verification)**
    *   Checkbox คำรับรองขั้นสุดท้าย
    *   การยืนยันอายุ (ต้องไม่ต่ำกว่า 18 ปีบริบูรณ์)
4.  **Step 4: Success Page & Workflow (หน้าลงทะเบียนสำเร็จ)**

5.  
    *   ปรับ Flow ใหม่ตามมาตรฐานความปลอดภัย: 
        `รอ Vendor ตรวจสอบ` -> `เข้าอบรมออนไลน์ (ดูวิดีโอ + ทำแบบทดสอบ 10 ข้อ)` -> `รับบัตรเข้าพื้นที่ (Badge)`

## 🚀 แผนการพัฒนาในระยะต่อไป (Next Steps - Phase 2)
สร้างระบบหลังบ้าน **"Vendor Dashboard"** สำหรับหัวหน้างาน/ผู้รับเหมา
*   **เป้าหมาย:** เพื่อให้ Vendor ล็อกอินเข้ามาตรวจสอบรายชื่อลูกจ้างของตนเองที่เพิ่งลงทะเบียนเข้ามา
*   **ฟังก์ชันหลัก:** แสดงรายชื่อ (Table/Card View) และมีปุ่ม อนุมัติ (Approve) หรือ ปฏิเสธ (Reject) ก่อนส่งรายชื่อเข้าสู่ระบบ E-Learning และ จป. ต่อไป

## 💡 Prompt สำหรับ AI (คำสั่งอ้างอิง)
"ฉันคือ พี่ณัฐธัญ และให้คุณสวมบทบาทเป็น 'นายณัฐธัญ' (โปรแกรมเมอร์ผู้เชี่ยวชาญ) โปรดอ่านเอกสาร README นี้เพื่อทำความเข้าใจบริบทของโปรเจกต์ FTC First Safety ที่เราทำค้างไว้ และพร้อมสำหรับการพัฒนา Phase 2 (Vendor Dashboard) ต่อไป"



# 🛡️ FTC Digital Safety Transformation (Project Paperless)
**Project Name:** FTC Safety Super App (ระบบความปลอดภัย บริษัท เฟิร์ส เทคโนโลยี คอนสตรัคชั่น)
**Admin / PM:** ณัฐธัญ ละอองทอง
**Contact:** ftcsafety18@gmail.com

## 📌 ภาพรวมโครงการ (Project Overview)
ระบบบริหารจัดการความปลอดภัยแบบดิจิทัลผ่าน LINE OA เพื่อลดการใช้กระดาษ (Paperless) โดยเน้นการใช้งานผ่านสมาร์ทโฟนเป็นหลัก (Mobile-First) ระบบหลักประกอบด้วย การลงทะเบียนผู้ปฏิบัติงาน, การขออนุญาตทำงาน (E-Permit), การลงเวลาและ TBT, และการตรวจพื้นที่ (Digital Sitewalk)

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack & Deployment)
* **Frontend:** HTML5, Vanilla JavaScript, Tailwind CSS (via CDN), ฟอนต์ Sarabun
* **Icons & Graphics:** Lucide Icons, 100% CSS/SVG Logos
* **Database & Backend:** Supabase (FTC-Master-DB)
* **Version Control & Hosting:** GitHub (`ftc-first-safety-web`) -> Deployed via GitHub Pages / Netlify
* **Integration:** LINE OA (LIFF App)

## 📂 โครงสร้างระบบและไฟล์ (Project Structure)
### 1. ฝั่งความปลอดภัย (Folder: JoPor)
* `E-Permit.html` : หน้าจัดการใบอนุญาตเข้าทำงาน
* `Digital Sitewalk.html` : ระบบตรวจประเมินหน้างาน
* `Digital_Sitewalk_Dashboard.html` : หน้ากระดานสรุปผลการเดินตรวจพื้นที่
* `Digital_Sitewalk_Export.html` : หน้าสำหรับการ Export ข้อมูล

### 2. ฝั่งผู้รับเหมา (Folder: Vender)
* `Vendor_Dashboard.html` : หน้ากระดานหลักของผู้รับเหมา
* `Equipment_Regis.html` : ระบบลงทะเบียนเครื่องมือ/อุปกรณ์
* `Worker_Registration_ToSystem.html` : ระบบลงทะเบียนรายชื่อผู้ปฏิบัติงาน
* `PTW_Request.html` : ฟอร์มหลักสำหรับขออนุญาตเข้าทำงาน

### 3. ฝั่งผู้ดูแลระบบ (Folder: Admin)
* `Admin_Approval.html` : หน้าอนุมัติหลัก
* `Admin_Equipment_Approval.html` : หน้าอนุมัติเครื่องมือ
* `Admin_Vendor_Approval.html` : หน้าจัดการผู้รับเหมา

## 📖 คำศัพท์และมาตรฐานของโครงการ (Terminology)
เพื่อความเข้าใจที่ตรงกันในการพัฒนาระบบ ให้ใช้คำศัพท์วิชาการภาษาไทยดังนี้:
* **Hot Zone** แปลว่า **เขตอันตราย**
* **Warm Zone** แปลว่า **เขตควบคุม**
* **Safe Zone** แปลว่า **เขตปลอดภัย**
* **Decon** แปลว่า **การชำระล้าง**

## 🗄️ โครงสร้างฐานข้อมูล (Supabase: FTC-Master-DB)
* `table_vendors` : ข้อมูลผู้รับเหมา (vendor_id, vendor_name, entity_type, accum_billing, vendor_rating)
* `table_users` / `table_permit_workers` : ข้อมูลพนักงานและผู้ปฏิบัติงาน
* `table_permits` / `table_e_ptw` : ข้อมูลใบขออนุญาตเข้าทำงาน (PTW)
* `table_equipment` : เก็บทะเบียนอุปกรณ์ที่ผ่านการตรวจสอบ
* `table_toolbox_talks` : ข้อมูลการลงเวลาและ TBT
* `table_area_master` : ข้อมูลพื้นที่ปฏิบัติงาน

## 📱 การเชื่อมต่อระบบ LINE (LINE Developers)
**Provider:** First Technology
* **LIFF app name:** FTC Safety
* **LIFF ID:** 2010907761-KrJ8PgNN
* **LIFF URL:** https://liff.line.me/2010907761-KrJ8PgNN (เชื่อมต่อกับหน้า Main Menu `index.html`)

## 🚀 สถานะการทำงานปัจจุบัน (Current Status)
* [x] หน้า Main Menu (`index.html`) พร้อมระบบ Navigation Grid & SOS Button
* [x] ออกแบบฟอร์ม PTW Request เสร็จสมบูรณ์
* [x] **Phase 1:** ระบบลงทะเบียนพนักงานใหม่ (`Worker_Registration_ToSystem.html`) แบบ Multi-step Form (Personal Info, Upload, Identity Verification) พร้อม Data Validation และ PDPA Consent
* [ ] **Phase 2 (In Progress):** Vendor Dashboard สำหรับให้ผู้รับเหมา อนุมัติ/ปฏิเสธ รายชื่อลูกจ้างก่อนส่งเข้าระบบ E-Learning และให้ จป. ตรวจสอบ
* [ ] กำลังพัฒนา: การเชื่อมต่อฟอร์มลงทะเบียนเข้ากับฐานข้อมูล Supabase
* [ ] แผนงานต่อไป: ระบบ PTW Activation หน้างาน (เปิดใบงานและเช็คชื่อ TBT) และผูกระบบ E-Tagging กับ QR Code

* [ ] 
