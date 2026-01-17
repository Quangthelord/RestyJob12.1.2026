# RestyJob12.1.2026

restyjob là một Web-based On-demand Marketplace Platform – một nền tảng web ứng dụng kiến trúc Real-time Matching để kết nối tức thì nguồn lực lao động thời vụ với doanh nghiệp.

## Các trụ cột kỹ thuật chính

### 1. Matching Engine (Web-optimized)
Hệ thống xử lý dữ liệu tập trung giúp lọc, khớp và đề xuất các ca làm việc dựa trên thuật toán tối ưu hóa theo kỹ năng, thời gian và vị trí địa lý.

### 2. Real-time Dashboard
Giao diện điều khiển dành cho doanh nghiệp để quản lý nhiều chi nhánh, theo dõi trạng thái nhân sự và duyệt ca theo thời gian thực (Real-time tracking).

### 3. Trust & Rating System
Hệ thống cơ sở dữ liệu lưu trữ lịch sử làm việc (Log) và điểm tín nhiệm, thay thế cho các hồ sơ giấy hoặc các nhóm mạng xã hội thiếu minh bạch.

### 4. Automated Workflow
Số hóa toàn bộ quy trình từ: Đăng ca (Post) -> Khớp người (Match) -> Điểm danh (Check-in) -> Thanh toán (Pay) trên cùng một giao diện trình duyệt.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) với TypeScript
- **Database**: PostgreSQL với Prisma ORM
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: Axios

## Cài đặt Local

1. Cài đặt dependencies:
```bash
npm install
```

2. Thiết lập database:
```bash
# Tạo file .env với DATABASE_URL
cp .env.example .env
# Chỉnh sửa DATABASE_URL trong .env

# Chạy migrations
npx prisma migrate dev
npx prisma generate
```

3. Chạy development server:
```bash
npm run dev
```

## Deploy trên Vercel

### Bước 1: Chuẩn bị Database
1. Tạo PostgreSQL database trên Vercel Postgres hoặc các provider khác (Supabase, Neon, etc.)
2. Copy connection string (DATABASE_URL)

### Bước 2: Deploy lên Vercel
1. Push code lên GitHub repository
2. Import project vào Vercel từ GitHub
3. Thêm Environment Variables:
   - `DATABASE_URL`: Connection string từ database
   - `JWT_SECRET`: Secret key cho JWT (generate random string)
   - `NODE_ENV`: `production`

### Bước 3: Build Settings
Vercel sẽ tự động detect Next.js và sử dụng:
- Build Command: `npm run build` (đã include prisma generate)
- Output Directory: `.next`
- Install Command: `npm install`

### Bước 4: Post-deploy
Sau khi deploy, chạy migrations:
```bash
npx prisma migrate deploy
```

Hoặc setup trong Vercel Build Command để tự động chạy migrations.

## Cấu trúc dự án

```
restyjob/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── marketplace/       # Marketplace page
│   ├── ai-matching/       # AI Matching page
│   ├── business/          # Business dashboard & profile
│   ├── worker/            # Worker dashboard & profile
│   └── auth/              # Auth pages
├── components/            # React components
├── lib/                   # Utilities & helpers
├── prisma/                # Database schema
└── public/                # Static assets
```

## Features

- ✨ **AI-Powered Instant Matching**: Smart calendar với AI matching engine
- 🏪 **Dynamic Marketplace**: Location-based job search với real-time updates
- 📊 **Profile-Dashboard Hybrid**: Trung tâm điều hành sự nghiệp cho cả worker và business
- 🔄 **Real-time Tracking**: Theo dõi trạng thái nhân sự và ca làm việc
- ⭐ **Trust & Rating System**: Hệ thống đánh giá minh bạch
- 💰 **Automated Payments**: Quy trình thanh toán tự động

## User Roles

- **Business**: Doanh nghiệp đăng ca làm việc và quản lý nhân sự
- **Worker**: Người lao động tìm và nhận ca làm việc

## Notes

- Các npm warnings về deprecated packages (rimraf, glob, eslint) là từ transitive dependencies và không ảnh hưởng đến chức năng
- ESLint 8 warnings sẽ tự động biến mất khi upgrade lên Next.js 15+
- Project hiện tại ở chế độ demo, không yêu cầu authentication
