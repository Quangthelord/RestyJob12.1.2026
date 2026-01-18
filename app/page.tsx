import Link from 'next/link'
import Navbar from '@/components/Navbar'
import LiveNotification from '@/components/LiveNotification'
import { Search, Shield, BarChart3, CreditCard } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <LiveNotification />
      
      {/* Subtle radial gradient background */}
      <div className="fixed inset-0 bg-gradient-radial-subtle opacity-20 pointer-events-none -z-10"></div>
      
      {/* Navbar */}
      <Navbar />

      {/* Section 1: Hero Section - Minimalism */}
      <section className="relative py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8 tracking-tight">
              Lấp đầy ca làm trong{' '}
              <span className="bg-gradient-radial-dark bg-clip-text text-transparent">5 phút</span>
              <br />
              <span className="text-gray-800">Nhân sự chuẩn, việc làm ngay</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              Nền tảng kết nối nhân sự thời vụ chuyên biệt cho ngành F&B và Hospitality.
            </p>
            
            {/* Minimal CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/business/jobs/new"
                className="px-8 py-4 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition-all font-semibold text-base minimal-shadow-lg"
              >
                Đăng ca ngay
              </Link>
              <Link
                href="/marketplace"
                className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-semibold text-base minimal-shadow"
              >
                Tìm việc ngay
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Pain Points & Solutions - Minimal */}
      <section className="py-20 bg-gray-50/50 relative">
        <div className="absolute inset-0 bg-gradient-radial-subtle opacity-10 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-16 tracking-tight">
            Giải quyết nỗi đau của cả hai bên
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Left: Doanh nghiệp */}
            <div className="bg-white p-8 rounded-2xl minimal-shadow-lg border border-gray-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial-subtle opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Doanh nghiệp</h3>
                
                <div className="space-y-5 mb-6">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Mệt mỏi vì "bom" ca?</p>
                    <p className="text-gray-600 text-sm leading-relaxed">Nhân viên nghỉ đột xuất, không kịp tìm người thay</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Mất giờ tìm người trên Facebook?</p>
                    <p className="text-gray-600 text-sm leading-relaxed">Đăng tin, chờ đợi, không biết ai đáng tin</p>
                  </div>
                </div>

                <div className="bg-orange-50/50 p-4 rounded-lg border-l-2 border-orange-600">
                  <p className="font-semibold text-orange-600 mb-1 text-sm">Resty giải quyết:</p>
                  <p className="text-gray-700 text-sm leading-relaxed">Hệ thống xác thực và ghép ca thông minh. Tìm người phù hợp trong 5 phút.</p>
                </div>
              </div>
            </div>

            {/* Right: Người lao động */}
            <div className="bg-white p-8 rounded-2xl minimal-shadow-lg border border-gray-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial-subtle opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Người lao động</h3>
                
                <div className="space-y-5 mb-6">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Sợ nợ lương?</p>
                    <p className="text-gray-600 text-sm leading-relaxed">Làm xong không nhận được tiền, không biết khiếu nại ở đâu</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Việc làm không phù hợp?</p>
                    <p className="text-gray-600 text-sm leading-relaxed">Không biết công việc có đúng như mô tả không</p>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-lg border-l-2 border-blue-600">
                  <p className="font-semibold text-blue-600 mb-1 text-sm">Resty giải quyết:</p>
                  <p className="text-gray-700 text-sm leading-relaxed">Nhận lương nhanh, chủ động thời gian. Việc làm được xác thực, minh bạch.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Core Features - Minimal Cards */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Tính năng cốt lõi
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Những công cụ mạnh mẽ giúp bạn kết nối hiệu quả và tin cậy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                title: "Ghép ca thông minh",
                description: "Thuật toán tự động tìm người phù hợp nhất dựa trên kỹ năng và vị trí",
                Icon: Search
              },
              {
                title: "Hệ thống tín nhiệm",
                description: "Hồ sơ năng lực được đánh giá thực tế từ các nhà tuyển dụng trước",
                Icon: Shield
              },
              {
                title: "Quản lý Real-time",
                description: "Theo dõi trạng thái nhân sự ngay trên Dashboard theo thời gian thực",
                Icon: BarChart3
              },
              {
                title: "Thanh toán nhanh",
                description: "Quy trình quyết toán minh bạch, bảo vệ quyền lợi cả hai bên",
                Icon: CreditCard
              }
            ].map((feature, idx) => {
              const IconComponent = feature.Icon
              return (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl minimal-shadow border border-gray-100/50 hover:minimal-shadow-lg transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial-subtle opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                    <IconComponent className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Social Proof - Minimal */}
      <section className="py-20 bg-gray-50/50 relative">
        <div className="absolute inset-0 bg-gradient-radial-subtle opacity-10 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              { number: "500+", label: "Doanh nghiệp đã tin dùng" },
              { number: "10,000+", label: "Ca làm việc đã hoàn thành" },
              { number: "98%", label: "Tỷ lệ nhân sự có mặt đúng giờ" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl lg:text-6xl font-bold bg-gradient-radial-dark bg-clip-text text-transparent mb-3 tracking-tight">
                  {stat.number}
                </div>
                <p className="text-base text-gray-700 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: How it Works - Minimal Steps */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Quy trình 3 bước đơn giản
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Từ đăng tin đến hoàn thành, tất cả chỉ trong vài phút
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Đăng tin",
                description: "Nhập yêu cầu, thời gian và mức lương. Hệ thống sẽ tự động tìm người phù hợp."
              },
              {
                step: "2",
                title: "Khớp lệnh",
                description: "Hệ thống gửi thông báo đến các ứng viên phù hợp nhất. Họ sẽ phản hồi ngay."
              },
              {
                step: "3",
                title: "Hoàn thành",
                description: "Check-in, làm việc và đánh giá. Thanh toán tự động sau khi hoàn thành."
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl minimal-shadow-lg border border-gray-100/50 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial-subtle opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-orange rounded-full flex items-center justify-center mx-auto mb-6 minimal-shadow-lg">
                    <span className="text-2xl font-bold text-white">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Why Choose Resty - Minimal */}
      <section className="py-20 bg-gray-50/50 relative">
        <div className="absolute inset-0 bg-gradient-radial-subtle opacity-10 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-16 tracking-tight">
            Tại sao chọn Resty?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Dành cho Doanh nghiệp",
                description: "Đừng để thiếu người làm gián đoạn trải nghiệm khách hàng của bạn. Với Resty, bạn có cả một đội ngũ dự phòng chất lượng trong tầm tay.",
                accent: "orange"
              },
              {
                title: "Dành cho Người lao động",
                description: "Biến thời gian rảnh thành thu nhập xứng đáng. Không trung gian, không phí ẩn, làm xong nhận tiền ngay.",
                accent: "blue"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`bg-white p-8 rounded-2xl minimal-shadow-lg border border-gray-100/50 relative overflow-hidden group`}
              >
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-radial-subtle opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none`}></div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Minimal */}
      <section className="py-24 bg-gradient-orange relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial-dark opacity-20 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Tham gia hàng nghìn doanh nghiệp và người lao động đã tin tưởng Resty
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/business/jobs/new"
              className="px-8 py-4 bg-white text-orange-600 rounded-lg hover:bg-gray-50 transition-all font-semibold text-base minimal-shadow-lg"
            >
              Đăng ca ngay
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-4 bg-white/10 text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all font-semibold text-base backdrop-blur-sm"
            >
              Tìm việc ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
