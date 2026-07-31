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
