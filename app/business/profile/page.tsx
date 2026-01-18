"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Clock,
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  Sparkles,
  DollarSign,
  CheckCircle2,
  Star,
  ShieldCheck,
  Award,
  Phone,
  AlertCircle,
  Users,
  Calendar,
  MessageCircle,
  Info,
  Coffee,
  Store,
  Factory
} from "lucide-react";

type TabType = "overview" | "shifts" | "reviews" | "policies";

interface BusinessProfile {
  id: string;
  name: string;
  companyName?: string;
  logo?: string;
  storefrontImage?: string;
  type: "Chuỗi" | "Independent";
  businessType: "Quán ăn" | "Nhà hàng" | "Cafe" | "Bar" | "Chuỗi F&B";
  scale: "<10" | "10–30" | "30+";
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  operatingHours: string;
  verified: {
    businessLicense: boolean;
  };
  jobReality: {
    positions: string[];
    sampleShift: {
      time: string;
      workload: string;
      rushHour: string;
    };
    uniform: "Có sẵn" | "Tự chuẩn bị";
    specialRequirements: string[];
  };
  compensation: {
    hourlyRate?: number;
    perShiftRate?: number;
    hasPeakHourBonus: boolean;
    paymentMethod: "Trả ngay" | "Theo tuần" | "Theo tháng";
    hasTip: boolean;
    tipSharing: boolean;
    hasMeal: boolean;
    rewards: {
      fullAttendance: string;
      lateArrival: string;
      cancellation: string;
    };
  };
  trustScore: {
    averageRating: number;
    totalRatings: number;
    completionRate: number;
    cancellationRate: number;
    onTimePaymentRate: number;
    reviews: Array<{
      worker: string;
      comment: string;
      rating: number;
      date: string;
    }>;
  };
  badges: string[];
  culture: {
    workAtmosphere: "Nhanh – áp lực" | "Thân thiện – hỗ trợ";
    managerStyle: "Dễ tính" | "Nghiêm";
    hasTraining: boolean;
    longTermOpportunity: boolean;
  };
  operations: {
    cancellationPolicy: string;
    emergencyContact: string;
    safetyPolicy: string;
    noFeeCommitment: boolean;
  };
  activeShifts: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
    filled: number;
    maxWorkers: number;
  }>;
}

export default function BusinessProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [jobsRes, branchesRes, paymentsRes, ratingsRes, matchesRes] = await Promise.all([
        api.get("/jobs"),
        api.get("/branches"),
        api.get("/payments"),
        api.get("/ratings"),
        api.get("/matches"),
      ]);

      const jobs = jobsRes.data.jobs || [];
      const branches = branchesRes.data.branches || [];
      const payments = paymentsRes.data.payments || [];
      const ratings = ratingsRes.data.ratings || [];
      const matches = matchesRes.data.matches || [];

      const completedMatches = matches.filter((m: any) => m.status === "COMPLETED");
      const cancelledMatches = matches.filter((m: any) => ["CANCELLED", "REJECTED"].includes(m.status));
      
      const totalJobs = jobs.length || 1;
      const completionRate = (completedMatches.length / totalJobs) * 100;
      const cancellationRate = (cancelledMatches.length / totalJobs) * 100;
      
      const onTimePayments = payments.filter((p: any) => {
        // TODO: Check if payment was on time
        return p.status === "COMPLETED";
      }).length;
      const onTimePaymentRate = payments.length > 0 ? (onTimePayments / payments.length) * 100 : 100;

      const workerRatings = ratings.filter((r: any) => r.raterId !== user?.id);
      const averageRating = workerRatings.length > 0
        ? workerRatings.reduce((sum: number, r: any) => sum + r.score, 0) / workerRatings.length
        : 0;

      const mainBranch = branches[0] || { name: user?.companyName || "", address: "", city: "" };

      // Build profile
      const businessProfile: BusinessProfile = {
        id: user?.id || "",
        name: user?.name || "",
        companyName: user?.companyName || undefined,
        logo: undefined,
        storefrontImage: undefined,
        type: branches.length > 1 ? "Chuỗi" : "Independent",
        businessType: "Nhà hàng",
        scale: "<10",
        address: mainBranch.address || "",
        city: mainBranch.city || "",
        latitude: mainBranch.latitude,
        longitude: mainBranch.longitude,
        operatingHours: "07:00 - 22:00",
        verified: {
          businessLicense: !!(user as any)?.taxCode || false,
        },
        jobReality: {
          positions: ["Phục vụ", "Thu ngân", "Phụ bếp", "Pha chế"],
          sampleShift: {
            time: "4-6 giờ/ca",
            workload: "Trung bình - cao (giờ cao điểm)",
            rushHour: "18:00 - 21:00",
          },
          uniform: "Có sẵn",
          specialRequirements: ["Đứng lâu", "Mang vác"],
        },
        compensation: {
          hourlyRate: 50000,
          hasPeakHourBonus: true,
          paymentMethod: "Trả ngay",
          hasTip: true,
          tipSharing: true,
          hasMeal: true,
          rewards: {
            fullAttendance: "+10% lương",
            lateArrival: "-5% lương",
            cancellation: "Không có phạt",
          },
        },
        trustScore: {
          averageRating: averageRating,
          totalRatings: workerRatings.length,
          completionRate: Math.round(completionRate),
          cancellationRate: Math.round(cancellationRate),
          onTimePaymentRate: Math.round(onTimePaymentRate),
          reviews: workerRatings.slice(0, 5).map((r: any) => ({
            worker: "Lao động ẩn danh",
            comment: r.comment || "",
            rating: r.score,
            date: r.createdAt || "",
          })),
        },
        badges: [],
        culture: {
          workAtmosphere: "Thân thiện – hỗ trợ",
          managerStyle: "Dễ tính",
          hasTraining: true,
          longTermOpportunity: true,
        },
        operations: {
          cancellationPolicy: "Hủy trước 4 giờ không phạt",
          emergencyContact: (user as any)?.phone || "",
          safetyPolicy: "Có bảo hiểm ca làm, an toàn lao động",
          noFeeCommitment: true,
        },
        activeShifts: jobs.filter((j: any) => ["PENDING", "MATCHED", "IN_PROGRESS"].includes(j.status)).slice(0, 5).map((job: any) => ({
          id: job.id,
          title: job.title,
          startTime: job.startTime,
          endTime: job.endTime,
          hourlyRate: job.hourlyRate,
          filled: matches.filter((m: any) => m.jobId === job.id && m.status === "ACCEPTED").length,
          maxWorkers: job.maxWorkers || 1,
        })),
      };

      // Determine badges
      if (businessProfile.trustScore.onTimePaymentRate >= 95) {
        businessProfile.badges.push("Trả lương đúng hạn");
      }
      if (businessProfile.trustScore.cancellationRate <= 10) {
        businessProfile.badges.push("Ít hủy ca");
      }
      if (businessProfile.trustScore.averageRating >= 4.5) {
        businessProfile.badges.push("Nhà hàng thân thiện");
      }

      setProfile(businessProfile);
    } catch (error) {
      toast.error("Lỗi khi tải profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  const getPositionIcon = (position: string) => {
    const iconMap: { [key: string]: any } = {
      "Phục vụ": UtensilsCrossed,
      "Thu ngân": ShoppingBag,
      "Phụ bếp": ChefHat,
      "Pha chế": Sparkles,
    };
    return iconMap[position] || UtensilsCrossed;
  };

  const getBusinessTypeIcon = (type: string) => {
    const iconMap: { [key: string]: any } = {
      "Quán ăn": Store,
      "Nhà hàng": Building2,
      "Cafe": Coffee,
      "Bar": Coffee,
      "Chuỗi F&B": Factory,
    };
    return iconMap[type] || Building2;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with Logo & Name */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 bg-gradient-orange rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {profile.logo ? (
                <img src={profile.logo} alt={profile.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profile.companyName || profile.name}</h1>
                {profile.verified.businessLicense && (
                  <CheckCircle2 className="w-6 h-6 text-green-600" strokeWidth={2} />
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile.type === "Chuỗi" 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {profile.type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  {(() => {
                    const Icon = getBusinessTypeIcon(profile.businessType);
                    return <Icon className="w-4 h-4" strokeWidth={1.5} />;
                  })()}
                  {profile.businessType}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" strokeWidth={1.5} />
                  {profile.scale} nhân sự/ca
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" strokeWidth={1.5} />
                  {profile.address}, {profile.city}
                </div>
              </div>
            </div>
          </div>

          {/* Highlight Box - Những điều cần biết trước khi nhận ca */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Những điều cần biết trước khi nhận ca</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>• Lương: {formatCurrency(profile.compensation.hourlyRate || 0)}/giờ</div>
                  <div>• Trả lương: {profile.compensation.paymentMethod}</div>
                  <div>• Tip: {profile.compensation.hasTip ? "Có" : "Không"}</div>
                  <div>• Ăn ca: {profile.compensation.hasMeal ? "Có" : "Không"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 mb-6">
            {[
              { id: "overview" as TabType, label: "Tổng quan", icon: Building2 },
              { id: "shifts" as TabType, label: "Ca làm", icon: Calendar },
              { id: "reviews" as TabType, label: "Đánh giá", icon: Star },
              { id: "policies" as TabType, label: "Quy định", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-orange-600 text-orange-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* I. THÔNG TIN NHẬN DIỆN */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
                  Thông tin nhận diện
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Loại hình</label>
                    <span className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-2 w-fit">
                      {(() => {
                        const Icon = getBusinessTypeIcon(profile.businessType);
                        return <Icon className="w-4 h-4" strokeWidth={1.5} />;
                      })()}
                      {profile.businessType}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quy mô</label>
                    <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {profile.scale} nhân sự/ca
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <div>
                        {profile.address}
                        <br />
                        {profile.city}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ hoạt động</label>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4" strokeWidth={1.5} />
                      {profile.operatingHours}
                    </div>
                  </div>
                </div>
              </div>

              {/* IV. ĐỘ TIN CẬY & ĐÁNH GIÁ (Trust Layer) */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-300">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
                  Độ tin cậy & Đánh giá
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
                        {profile.trustScore.averageRating.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">({profile.trustScore.totalRatings} đánh giá)</div>
                    </div>
                    {profile.verified.businessLicense && (
                      <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                        Đã xác minh GPKD
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{profile.trustScore.completionRate}%</div>
                      <div className="text-xs text-gray-600">Hoàn thành ca</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{profile.trustScore.cancellationRate}%</div>
                      <div className="text-xs text-gray-600">Hủy ca</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{profile.trustScore.onTimePaymentRate}%</div>
                      <div className="text-xs text-gray-600">Trả lương đúng hạn</div>
                    </div>
                  </div>

                  {/* Badges */}
                  {profile.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                      {profile.badges.map((badge) => (
                        <span
                          key={badge}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1"
                        >
                          <Award className="w-3 h-3" strokeWidth={1.5} />
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* II. THÔNG TIN CÔNG VIỆC */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin công việc</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Các vị trí thường tuyển</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.jobReality.positions.map((pos) => {
                      const Icon = getPositionIcon(pos);
                      return (
                        <span
                          key={pos}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.5} />
                          {pos}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Mô tả ca làm mẫu</label>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" strokeWidth={1.5} />
                      <span>Thời gian: {profile.jobReality.sampleShift.time}</span>
                    </div>
                    <div>• Khối lượng: {profile.jobReality.sampleShift.workload}</div>
                    <div>• Giờ cao điểm: {profile.jobReality.sampleShift.rushHour}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Đồng phục</label>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    profile.jobReality.uniform === "Có sẵn"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {profile.jobReality.uniform}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Yêu cầu đặc biệt</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.jobReality.specialRequirements.map((req) => (
                      <span key={req} className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* III. LƯƠNG & QUYỀN LỢI */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                Lương & Quyền lợi
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mức lương</label>
                  <div className="space-y-2 mb-4">
                    {profile.compensation.hourlyRate && (
                      <div>
                        <span className="text-sm text-gray-600">Theo giờ: </span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatCurrency(profile.compensation.hourlyRate)}
                        </span>
                      </div>
                    )}
                    {profile.compensation.perShiftRate && (
                      <div>
                        <span className="text-sm text-gray-600">Theo ca: </span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatCurrency(profile.compensation.perShiftRate)}
                        </span>
                      </div>
                    )}
                    {profile.compensation.hasPeakHourBonus && (
                      <div className="text-sm text-green-600">✓ Có phụ cấp giờ cao điểm</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cách trả lương</label>
                    <span className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                      {profile.compensation.paymentMethod}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tip & Ăn ca</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span>Tip: {profile.compensation.hasTip ? "Có" : "Không"}</span>
                        {profile.compensation.hasTip && profile.compensation.tipSharing && (
                          <span className="text-xs text-gray-500">(Chia đều)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        Ăn ca: {profile.compensation.hasMeal ? "Có" : "Không"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Thưởng / phạt</label>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div>• Đi đủ ca: <span className="text-green-600 font-medium">{profile.compensation.rewards.fullAttendance}</span></div>
                      <div>• Trễ giờ: <span className="text-yellow-600 font-medium">{profile.compensation.rewards.lateArrival}</span></div>
                      <div>• Hủy ca: <span className="text-gray-600">{profile.compensation.rewards.cancellation}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* V. VĂN HÓA & MÔI TRƯỜNG */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Văn hóa & Môi trường</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Không khí làm việc</label>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    profile.culture.workAtmosphere.includes("Thân thiện")
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {profile.culture.workAtmosphere}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quản lý ca</label>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    profile.culture.managerStyle === "Dễ tính"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {profile.culture.managerStyle}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Đào tạo</label>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    profile.culture.hasTraining
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {profile.culture.hasTraining ? "Có đào tạo cho người mới" : "Không có đào tạo"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cơ hội lâu dài</label>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    profile.culture.longTermOpportunity
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {profile.culture.longTermOpportunity ? "Có thể lên part-time/full-time" : "Chỉ làm ca"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "shifts" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ca làm hiện tại</h2>
            {profile.activeShifts.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1} />
                <p className="text-gray-600">Hiện chưa có ca làm nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.activeShifts.map((shift) => (
                  <div key={shift.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{shift.title}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(shift.startTime)} - {formatDateTime(shift.endTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(shift.hourlyRate)}/giờ
                        </div>
                        <div className="text-sm text-gray-600">
                          {shift.filled}/{shift.maxWorkers} người
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Đánh giá từ người lao động</h2>
            {profile.trustScore.reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1} />
                <p className="text-gray-600">Chưa có đánh giá nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.trustScore.reviews.map((review, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                            }`}
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">{review.worker}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "policies" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Vận hành & An toàn</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quy định hủy ca</label>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  {profile.operations.cancellationPolicy}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Liên hệ khẩn cấp</label>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4" strokeWidth={1.5} />
                  {profile.operations.emergencyContact || "Chưa cập nhật"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chính sách an toàn</label>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  {profile.operations.safetyPolicy}
                </div>
              </div>
              {profile.operations.noFeeCommitment && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                    Cam kết không thu phí người lao động
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => toast.success("Tính năng chat sẽ được thêm sớm!")}
            className="w-14 h-14 bg-gradient-orange text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
