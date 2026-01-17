# Hướng dẫn Setup RestyJob

## Yêu cầu hệ thống

- Node.js 18+
- PostgreSQL 12+
- npm hoặc yarn

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Thiết lập Database

Tạo file `.env` trong thư mục gốc:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/restyjob?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Chạy migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Cấu trúc dự án

```
restyjob/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (business)/        # Business dashboard & pages
│   ├── (worker)/          # Worker dashboard & pages
│   └── api/               # API routes
│       ├── auth/          # Authentication endpoints
│       ├── jobs/          # Job management
│       ├── matches/       # Matching system
│       ├── checkin/       # Check-in/out
│       ├── ratings/       # Rating system
│       ├── payments/      # Payment tracking
│       └── branches/      # Branch management
├── components/            # React components
├── lib/                   # Utilities & helpers
│   ├── auth.ts           # Authentication utilities
│   ├── matching.ts        # Matching engine
│   ├── prisma.ts         # Prisma client
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
├── prisma/                # Database schema
│   └── schema.prisma
└── types/                 # TypeScript types
```

## Tính năng chính

### 1. Authentication

- Đăng ký/Đăng nhập với JWT
- Phân quyền theo role (BUSINESS, WORKER)

### 2. Matching Engine

- Tự động khớp worker với job dựa trên:
  - Kỹ năng (40%)
  - Vị trí địa lý (30%)
  - Đánh giá (20%)
  - Lịch sử làm việc (10%)

### 3. Workflow tự động

- **Post**: Doanh nghiệp đăng ca làm việc
- **Match**: Hệ thống tự động khớp worker phù hợp
- **Accept/Reject**: Worker chấp nhận hoặc từ chối
- **Check-in**: Worker check-in khi bắt đầu ca
- **Check-out**: Worker check-out khi kết thúc
- **Pay**: Tự động tạo payment record
- **Rate**: Đánh giá sau khi hoàn thành

### 4. Dashboard

- **Business Dashboard**: Quản lý ca làm việc, chi nhánh, tracking nhân sự
- **Worker Dashboard**: Xem ca được đề xuất, quản lý ca đang làm, thu nhập

## API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Jobs

- `GET /api/jobs` - Lấy danh sách jobs
- `POST /api/jobs` - Tạo job mới (Business only)
- `GET /api/jobs/[id]` - Lấy chi tiết job

### Matches

- `GET /api/matches` - Lấy danh sách matches
- `PUT /api/matches` - Cập nhật status match (Accept/Reject)

### Check-in

- `GET /api/checkin?matchId=xxx` - Lấy thông tin check-in
- `POST /api/checkin` - Check-in
- `PUT /api/checkin` - Check-out

### Ratings

- `GET /api/ratings` - Lấy danh sách ratings
- `POST /api/ratings` - Tạo rating mới

### Payments

- `GET /api/payments` - Lấy danh sách payments

### Branches

- `GET /api/branches` - Lấy danh sách chi nhánh
- `POST /api/branches` - Tạo chi nhánh mới (Business only)

## Database Schema

### User

- Thông tin cơ bản: email, password, name, phone
- Role: BUSINESS hoặc WORKER
- Business fields: companyName, taxCode
- Worker fields: skills, location, rating, totalRatings

### Job

- Thông tin ca làm việc: title, description, startTime, endTime
- Mức lương: hourlyRate, totalAmount
- Yêu cầu: skillsRequired, maxWorkers
- Status: PENDING, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED

### Match

- Kết nối Job và Worker
- Status: PENDING, ACCEPTED, REJECTED, CANCELLED
- matchScore: Điểm khớp (0-100)

### CheckIn

- Ghi nhận thời gian check-in/check-out
- Location: Vị trí GPS (tùy chọn)

### Rating

- Điểm đánh giá: 1-5
- Comment: Nhận xét
- Tự động cập nhật rating trung bình của user

### Payment

- Ghi nhận thanh toán
- Status: PENDING, PROCESSING, COMPLETED, FAILED
- Tự động tính toán dựa trên giờ làm việc

## Phát triển tiếp

### Real-time Features

- Có thể tích hợp Socket.io cho real-time updates
- Dashboard có thể refresh tự động khi có thay đổi

### Payment Gateway

- Tích hợp payment gateway (Stripe, PayPal, v.v.)
- Xử lý thanh toán tự động

### Notifications

- Email/SMS notifications
- Push notifications cho mobile app

### Analytics

- Dashboard analytics cho business
- Thống kê thu nhập cho worker
