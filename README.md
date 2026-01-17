# restyjob - On-demand Marketplace Platform

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
- **Data Fetching**: React Query

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Thiết lập database:
```bash
# Tạo file .env với DATABASE_URL
npx prisma migrate dev
npx prisma generate
```

3. Chạy development server:
```bash
npm run dev
```

## Cấu trúc dự án

```
restyjob/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── (business)/        # Business dashboard
│   ├── (worker)/          # Worker dashboard
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities & helpers
├── prisma/                # Database schema
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks
```

## User Roles

- **Business**: Doanh nghiệp đăng ca làm việc và quản lý nhân sự
- **Worker**: Người lao động tìm và nhận ca làm việc

# RestyJob12.1.2026
