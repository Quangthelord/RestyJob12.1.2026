# Hướng dẫn Deploy RestyJob lên Vercel

## Yêu cầu

1. GitHub repository đã push code
2. Vercel account (miễn phí)
3. PostgreSQL database (Vercel Postgres, Supabase, Neon, hoặc Railway)

## Bước 1: Setup Database

### Option 1: Vercel Postgres (Khuyến nghị)
1. Vào Vercel Dashboard → Storage → Create Database
2. Chọn Postgres
3. Copy connection string

### Option 2: Supabase
1. Tạo project trên [Supabase](https://supabase.com)
2. Vào Settings → Database
3. Copy connection string (URI format)

### Option 3: Neon
1. Tạo project trên [Neon](https://neon.tech)
2. Copy connection string

## Bước 2: Deploy trên Vercel

1. **Import Project**
   - Vào [Vercel Dashboard](https://vercel.com)
   - Click "Add New Project"
   - Import từ GitHub repository

2. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto)
   - Output Directory: `.next` (auto)
   - Install Command: `npm install` (auto)

3. **Environment Variables**
   Thêm các biến môi trường sau:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
   JWT_SECRET=your-random-secret-key-here
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Chờ build hoàn thành

## Bước 3: Run Database Migrations

Sau khi deploy thành công, chạy migrations:

### Cách 1: Vercel CLI
```bash
npx vercel env pull .env.local
npx prisma migrate deploy
```

### Cách 2: Vercel Dashboard
1. Vào Project Settings → Environment Variables
2. Copy DATABASE_URL
3. Chạy local:
```bash
export DATABASE_URL="your-connection-string"
npx prisma migrate deploy
```

### Cách 3: Vercel Build Command (Tự động)
Đã được cấu hình trong `package.json`:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

## Bước 4: Verify Deployment

1. Kiểm tra build logs trong Vercel Dashboard
2. Truy cập URL được cung cấp
3. Test các tính năng:
   - Landing page
   - Marketplace
   - AI Matching
   - Business/Worker dashboards

## Troubleshooting

### Build fails với Prisma
- Đảm bảo DATABASE_URL đã được set
- Kiểm tra Prisma schema có lỗi không
- Chạy `npx prisma generate` local trước

### Database connection errors
- Kiểm tra DATABASE_URL format
- Đảm bảo database cho phép connections từ Vercel IPs
- Kiểm tra SSL requirements

### Environment variables not working
- Đảm bảo variables được set trong Vercel Dashboard
- Redeploy sau khi thêm variables
- Kiểm tra variable names (case-sensitive)

## Production Checklist

- [ ] DATABASE_URL đã được set
- [ ] JWT_SECRET đã được set (random, secure)
- [ ] NODE_ENV=production
- [ ] Database migrations đã chạy
- [ ] Build thành công
- [ ] Test tất cả features
- [ ] Setup custom domain (optional)

## Performance Optimization

- Vercel tự động optimize Next.js
- Static assets được CDN cached
- API routes được serverless functions
- Database connections được pooled

## Monitoring

- Vercel Analytics (optional)
- Vercel Logs để debug
- Database monitoring từ provider

