import Link from 'next/link'
import Navbar from '@/components/Navbar'
import LiveNotification from '@/components/LiveNotification'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LiveNotification />
      {/* Navbar */}
      <Navbar />

      {/* Section 1: Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-orange-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Lấp đầy ca làm trong{' '}
              <span className="text-orange-600">5 phút</span>
              <br />
              Nhân sự chuẩn, việc làm ngay
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Nền tảng kết nối nhân sự thời vụ chuyên biệt cho ngành F&B và Hospitality.
              <br />
              <span className="font-semibold text-gray-800">Minh bạch, nhanh chóng, tin cậy.</span>
            </p>
            
            {/* Dual CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/business/jobs/new"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Đăng ca ngay
                <span className="block text-sm font-normal mt-1 opacity-90">Cho Doanh nghiệp</span>
              </Link>
              <Link
                href="/marketplace"
                className="w-full sm:w-auto px-8 py-4 bg-white text-orange-600 border-2 border-orange-600 rounded-lg hover:bg-orange-50 transition font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Tìm việc ngay
                <span className="block text-sm font-normal mt-1 text-gray-600">Cho Người lao động</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Pain Points & Solutions - Split Screen */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Giải quyết nỗi đau của cả hai bên
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left: Doanh nghiệp */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border-2 border-orange-100 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Doanh nghiệp</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Mệt mỏi vì "bom" ca?</p>
                    <p className="text-gray-600 text-sm">Nhân viên nghỉ đột xuất, không kịp tìm người thay</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Mất giờ tìm người trên Facebook?</p>
                    <p className="text-gray-600 text-sm">Đăng tin, chờ đợi, không biết ai đáng tin</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-orange-600">
                <p className="font-semibold text-orange-600 mb-2">✓ Resty giải quyết:</p>
                <p className="text-gray-700">Hệ thống xác thực và ghép ca thông minh. Tìm người phù hợp trong 5 phút.</p>
              </div>
            </div>

            {/* Right: Người lao động */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border-2 border-blue-100 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Người lao động</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Sợ nợ lương?</p>
                    <p className="text-gray-600 text-sm">Làm xong không nhận được tiền, không biết khiếu nại ở đâu</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Việc làm không phù hợp?</p>
                    <p className="text-gray-600 text-sm">Không biết công việc có đúng như mô tả không</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-600">
                <p className="font-semibold text-blue-600 mb-2">✓ Resty giải quyết:</p>
                <p className="text-gray-700">Nhận lương nhanh, chủ động thời gian. Việc làm được xác thực, minh bạch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Core Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Tính năng cốt lõi
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Những công cụ mạnh mẽ giúp bạn kết nối hiệu quả và tin cậy
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Feature 1: Smart Matching */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-14 h-14 bg-gradient-orange rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ghép ca thông minh</h3>
              <p className="text-gray-600 text-sm">
                Thuật toán tự động tìm người phù hợp nhất dựa trên kỹ năng và vị trí
              </p>
            </div>

            {/* Feature 2: Trust Score */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-14 h-14 bg-gradient-orange rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hệ thống tín nhiệm</h3>
              <p className="text-gray-600 text-sm">
                Hồ sơ năng lực được đánh giá thực tế từ các nhà tuyển dụng trước
              </p>
            </div>

            {/* Feature 3: Real-time Management */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-14 h-14 bg-gradient-orange rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quản lý Real-time</h3>
              <p className="text-gray-600 text-sm">
                Theo dõi trạng thái nhân sự ngay trên Dashboard theo thời gian thực
              </p>
            </div>

            {/* Feature 4: Fast Payment */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-14 h-14 bg-gradient-orange rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thanh toán nhanh</h3>
              <p className="text-gray-600 text-sm">
                Quy trình quyết toán minh bạch, bảo vệ quyền lợi cả hai bên
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Social Proof */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">500+</div>
              <p className="text-lg text-gray-700 font-semibold">Doanh nghiệp đã tin dùng</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">10,000+</div>
              <p className="text-lg text-gray-700 font-semibold">Ca làm việc đã hoàn thành</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">98%</div>
              <p className="text-lg text-gray-700 font-semibold">Tỷ lệ nhân sự có mặt đúng giờ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Quy trình 3 bước đơn giản
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Từ đăng tin đến hoàn thành, tất cả chỉ trong vài phút
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-20 h-20 bg-gradient-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Đăng tin</h3>
              <p className="text-gray-600">
                Nhập yêu cầu, thời gian và mức lương. Hệ thống sẽ tự động tìm người phù hợp.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-20 h-20 bg-gradient-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Khớp lệnh</h3>
              <p className="text-gray-600">
                Hệ thống gửi thông báo đến các ứng viên phù hợp nhất. Họ sẽ phản hồi ngay.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-20 h-20 bg-gradient-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hoàn thành</h3>
              <p className="text-gray-600">
                Check-in, làm việc và đánh giá. Thanh toán tự động sau khi hoàn thành.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Why Choose Resty */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Tại sao chọn Resty?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* For Business */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border-2 border-orange-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Dành cho Doanh nghiệp</h3>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Đừng để thiếu người làm gián đoạn trải nghiệm khách hàng của bạn. Với Resty, bạn có cả một đội ngũ dự phòng chất lượng trong tầm tay.
              </p>
            </div>

            {/* For Workers */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Dành cho Người lao động</h3>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                Biến thời gian rảnh thành thu nhập xứng đáng. Không trung gian, không phí ẩn, làm xong nhận tiền ngay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-orange">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Tham gia hàng nghìn doanh nghiệp và người lao động đã tin tưởng Resty
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/business/jobs/new"
              className="px-8 py-4 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition font-semibold text-lg shadow-xl"
            >
              Đăng ca ngay
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-4 bg-white/10 text-white border-2 border-white rounded-lg hover:bg-white/20 transition font-semibold text-lg"
            >
              Tìm việc ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
