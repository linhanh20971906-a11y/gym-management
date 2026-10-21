# HỆ THỐNG QUẢN LÝ PHÒNG GYM / FITNESS

## 1. Giới thiệu

Gym Management là hệ thống quản lý phòng Gym, hỗ trợ quản lý hội viên, huấn luyện viên, gói tập và lịch tập.

Dự án được triển khai bằng Docker Compose, tích hợp hệ quản trị cơ sở dữ liệu MySQL, Nginx Reverse Proxy, Prometheus, Grafana, Loki và Promtail.

## 2. Công nghệ sử dụng

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MySQL
- Quản trị Database: phpMyAdmin
- Container: Docker, Docker Compose
- Reverse Proxy: Nginx
- Monitoring: Prometheus, Grafana, Node Exporter, cAdvisor, MySQL Exporter
- Logging: Loki, Promtail
- Authentication: JWT, bcrypt

## 3. Chức năng chính

- Đăng nhập quản trị viên.
- Quản lý hội viên.
- Quản lý huấn luyện viên.
- Quản lý gói tập.
- Quản lý lịch tập.
- Giám sát tài nguyên hệ thống.
- Theo dõi log tập trung.
- Áp dụng các biện pháp bảo mật cơ bản.

## 4. Yêu cầu môi trường

Máy tính cần cài đặt:

- Docker Desktop
- Git
- Visual Studio Code (khuyến nghị)
- Trình duyệt Chrome hoặc Edge

Đảm bảo Docker Desktop đã khởi động trước khi chạy dự án.

## 5. Hướng dẫn cài đặt và chạy

### Bước 1: Tải mã nguồn

```bash
git clone https://github.com/linhanh20971906-a11y/gym-management.git
cd gym-management
```

### Bước 2: Cấu hình môi trường

Tạo file `.env` dựa trên `.env.example` và điền các biến môi trường phù hợp với cấu hình Docker Compose.

Không đưa mật khẩu thật, JWT Secret hoặc thông tin nhạy cảm lên GitHub.

### Bước 3: Khởi động hệ thống

```bash
docker compose up -d --build
```

### Bước 4: Kiểm tra container

```bash
docker compose ps
```

Các container cần thiết phải ở trạng thái `Up` hoặc `Healthy`.

### Bước 5: Kiểm tra Backend

Truy cập:

http://127.0.0.1:5001/api/health

Kết quả mong đợi:

```json
{
  "status": "OK",
  "message": "Gym Management Backend is running",
  "database": "connected"
}
```

## 6. Địa chỉ truy cập

| Thành phần | Địa chỉ |
|---|---|
| Website Gym Management | http://127.0.0.1:8080 |
| Đăng nhập Admin | http://127.0.0.1:8080/login.html |
| Backend Health Check | http://127.0.0.1:5001/api/health |
| phpMyAdmin | http://127.0.0.1:8081 |
| Prometheus | http://127.0.0.1:9091 |
| Grafana | http://127.0.0.1:3000 |

Loki và Promtail hoạt động trong hệ thống Docker để phục vụ việc thu thập và truy vấn log.

## 7. Hướng dẫn đăng nhập

1. Mở trang đăng nhập Admin.
2. Nhập email và mật khẩu quản trị đã cấu hình.
3. Nhấn **Đăng nhập**.
4. Sau khi đăng nhập thành công, hệ thống chuyển đến Dashboard.

Tài khoản quản trị được cấu hình thông qua các biến môi trường:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `JWT_SECRET`

Mật khẩu được kiểm tra bằng bcrypt. Sau khi đăng nhập thành công, Backend cấp JWT để xác thực các API được bảo vệ.

## 8. Giám sát hệ thống

### Prometheus

Truy cập http://127.0.0.1:9091

Vào mục Query và nhập:

```promql
up
```

Kết quả dùng để kiểm tra trạng thái các mục tiêu giám sát.

### Grafana

Truy cập http://127.0.0.1:3000

Mở dashboard **Gym Management Monitoring**.

Các biểu đồ đã triển khai:

- CPU Usage (%)
- RAM Usage (%)
- MySQL Connections
- Container Memory Usage (MB)

## 9. Logging tập trung

Hệ thống sử dụng Loki và Promtail để thu thập và truy vấn log container.

Trong Grafana:

1. Mở **Explore**.
2. Chọn nguồn dữ liệu Loki.
3. Nhập truy vấn LogQL.

Ví dụ:

```logql
{container="gym-nginx"}
```

Lọc các dòng có từ khóa GET:

```logql
{container="gym-nginx"} |= "GET"
```

Lọc các dòng có từ khóa error:

```logql
{container="gym-nginx"} |~ "(?i)error"
```

Kết quả phụ thuộc vào log thực tế phát sinh trong hệ thống.

## 10. Bảo mật hệ thống

Các biện pháp đã triển khai hoặc cấu hình trong dự án:

- Xác thực Admin bằng JWT.
- Sử dụng bcrypt để kiểm tra mật khẩu.
- Bảo vệ các API yêu cầu đăng nhập.
- Nginx Reverse Proxy.
- Cấu hình HTTP Security Headers.
- Chạy Backend bằng user `node` thay vì root.
- Sử dụng Docker Compose để quản lý các dịch vụ.
- Quản lý thông tin nhạy cảm thông qua biến môi trường.

Cần kiểm tra cấu hình Docker Compose thực tế để xác nhận đầy đủ mức độ phân tách mạng và giới hạn quyền truy cập.

## 11. Các lệnh quản trị

Kiểm tra container:

```bash
docker compose ps
```

Xem log:

```bash
docker compose logs
```

Khởi động lại dịch vụ:

```bash
docker compose restart
```

Dừng hệ thống:

```bash
docker compose down
```

Khởi động lại sau khi bật máy:

```bash
docker compose up -d
```

**Lưu ý:** Không sử dụng `docker compose down -v` nếu muốn giữ dữ liệu trong các Docker volume.

## 12. Quy trình demo

1. Khởi động Docker Desktop.
2. Chạy `docker compose up -d`.
3. Kiểm tra trạng thái các container.
4. Truy cập website Gym Management.
5. Đăng nhập Admin.
6. Demo quản lý hội viên, huấn luyện viên, gói tập và lịch tập.
7. Mở phpMyAdmin để kiểm tra Database.
8. Kiểm tra Backend Health Check.
9. Mở Prometheus và chạy truy vấn `up`.
10. Mở Grafana để xem các biểu đồ giám sát.
11. Mở Grafana Explore để truy vấn log Loki.
12. Trình bày các biện pháp hardening đã áp dụng.

## 13. Kết luận

Dự án Gym Management minh họa quá trình triển khai và quản trị một ứng dụng web bằng Docker Compose, kết hợp Database, Reverse Proxy, Monitoring, Logging và các biện pháp bảo mật cơ bản.

Hệ thống phục vụ mục tiêu thực hành môn Triển khai và Quản trị Hệ thống Phần mềm.