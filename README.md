# ỨNG DỤNG ĐẶT LỊCH KHÁM SỨC KHỎE TRỰC TUYẾN
Một hệ thống hỗ trợ bệnh nhân và bác sĩ đặt lịch khám, tư vấn trực tuyến, quản lý hồ sơ sức khỏe và thanh toán dịch vụ một cách tiện lợi.
## Cài đặt dự án
### 1. Clone repository
```bash
git clone https://github.com/TrungHau810/ClinicBooking.git
cd ClinicBooking
```
### 2. Tạo virtualenv và kích hoạt
``` bash
python -m venv .venv
source venv/bin/activate	# Trên MacOS  
venv\Scripts\activate	# Trên Windows
```
### 3. Cài đặt dependencies
```bash
pip install -r requirements.txt`
```
### 4. Khởi tạo database
```bash
python manage.py makemigrations
python manage.py migrate
```
### 5. Tạo superuser
```bash
python manage.py createsuperuser
```
### 6. Tạo project
```bash
python manage.py runserver
``` 