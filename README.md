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
