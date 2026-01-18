"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Star,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  Sunrise,
  Sun,
  SunMoon,
  Moon,
  UtensilsCrossed,
  ChefHat,
  Truck,
  ShoppingBag,
  Briefcase,
  HardHat
} from "lucide-react";

interface WorkerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  birthYear?: number;
  gender?: string;
  location?: string;
  district?: string;
  verified: {
    phone: boolean;
    idCard: boolean;
    student: boolean;
  };
  workReadiness: {
    positions: string[]; // Phục vụ, Thu ngân, Phụ bếp, Pha chế
    experience: string; // Chưa có, <3 tháng, 3-12 tháng, 1 năm+
    skills: string[]; // Giao tiếp, Bưng bê, Pha chế, POS, Ngoại ngữ
    languageLevel?: string; // Không, Cơ bản, Giao tiếp
  };
  availability: {
    timeSlots: string[]; // Sáng, Chiều, Tối, Đêm
    days: string[]; // Trong tuần, Cuối tuần, Lễ
    startEarliest: string; // Hôm nay, Ngày mai, Tuần sau
    maxDistance: number; // km
  };
  expectation: {
    hourlyRate?: number;
    perShiftRate?: number;
    priorities: string[]; // Trả lương ngay, Gần nhà, Ca nhẹ, Môi trường thân thiện
    longTerm: boolean;
  };
  trustScore: {
    completedJobs: number;
    punctualityRate: number; // %
    cancellationRate: number; // %
    averageRating: number; // 1-5
    recentComments: Array<{
      business: string;
      comment: string;
      rating: number;
    }>;
  };
  badges: string[]; // Đi làm đúng giờ, Ít huỷ ca, Người mới - đã xác minh, Làm tốt giờ cao điểm
  softSignal: {
    bio?: string; // 2-3 dòng
    commitments: {
      noBail: boolean;
      arriveEarly: boolean;
      willingToLearn: boolean;
    };
  };
  status: "AVAILABLE" | "BUSY"; // 🟢 Sẵn sàng, 🟡 Bận tạm thời
}

export default function WorkerProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [matchesRes, ratingsRes, userRes] = await Promise.all([
        api.get("/matches"),
        api.get("/ratings"),
        api.get("/auth/me"),
      ]);

      const matches = matchesRes.data.matches || [];
      const ratings = ratingsRes.data.ratings || [];
      const userData = userRes.data?.user;

      // Calculate stats
      const completedMatches = matches.filter((m: any) => m.status === "COMPLETED");
      const acceptedMatches = matches.filter((m: any) => m.status === "ACCEPTED");
      const cancelledMatches = matches.filter((m: any) => ["CANCELLED", "REJECTED"].includes(m.status));

      const totalMatches = matches.length || 1;
      const punctualityRate = acceptedMatches.length > 0 ? (acceptedMatches.filter((m: any) => {
        // TODO: Check check-in time vs job start time
        return true; // Placeholder
      }).length / acceptedMatches.length) * 100 : 0;

      const cancellationRate = (cancelledMatches.length / totalMatches) * 100;
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length 
        : 0;

      // Build profile
      const workerProfile: WorkerProfile = {
        id: userData?.id || "",
        name: userData?.name || "",
        email: userData?.email || "",
        phone: userData?.phone || undefined,
        avatar: userData?.avatar || undefined,
        birthYear: undefined, // TODO: Add to schema
        gender: undefined,
        location: userData?.location || undefined,
        district: undefined, // TODO: Extract from location
        verified: {
          phone: !!userData?.phone,
          idCard: false,
          student: false,
        },
        workReadiness: {
          positions: userData?.skills || [],
          experience: "Chưa có",
          skills: userData?.skills || [],
          languageLevel: "Cơ bản",
        },
        availability: {
          timeSlots: ["Chiều", "Tối"],
          days: ["Trong tuần", "Cuối tuần"],
          startEarliest: "Hôm nay",
          maxDistance: 5,
        },
        expectation: {
          hourlyRate: 50000,
          priorities: ["Trả lương ngay", "Gần nhà"],
          longTerm: false,
        },
        trustScore: {
          completedJobs: completedMatches.length,
          punctualityRate: Math.round(punctualityRate),
          cancellationRate: Math.round(cancellationRate),
          averageRating: averageRating,
          recentComments: ratings.slice(0, 3).map((r: any) => ({
            business: "Nhà hàng ABC", // TODO: Get from match
            comment: r.comment || "",
            rating: r.score,
          })),
        },
        badges: [],
        softSignal: {
          bio: userData?.bio || "Em chăm chỉ, đúng giờ, đã quen làm ca tối và giờ cao điểm.",
          commitments: {
            noBail: true,
            arriveEarly: true,
            willingToLearn: true,
          },
        },
        status: "AVAILABLE",
      };

      // Determine badges
      if (workerProfile.trustScore.punctualityRate >= 90) {
        workerProfile.badges.push("Đi làm đúng giờ");
      }
      if (workerProfile.trustScore.cancellationRate <= 10) {
        workerProfile.badges.push("Ít huỷ ca");
      }
      if (workerProfile.trustScore.completedJobs === 0 && workerProfile.verified.phone) {
        workerProfile.badges.push("Người mới - đã xác minh");
      }
      if (workerProfile.workReadiness.positions.includes("Phục vụ")) {
        workerProfile.badges.push("Làm tốt giờ cao điểm");
      }

      setProfile(workerProfile);
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
      "Giao hàng": Truck,
      "Văn phòng": Briefcase,
      "Lao động phổ thông": HardHat,
    };
    return iconMap[position] || UtensilsCrossed;
  };

  const getTimeSlotIcon = (slot: string) => {
    const iconMap: { [key: string]: any } = {
      "Sáng": Sunrise,
      "Chiều": Sun,
      "Tối": SunMoon,
      "Đêm": Moon,
    };
    return iconMap[slot] || Clock;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header with Status */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Người lao động</h1>
            <p className="text-gray-600">Nhà hàng nhìn 5-10 giây → dám giao ca</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              profile.status === "AVAILABLE" 
                ? "bg-green-100 text-green-700" 
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {profile.status === "AVAILABLE" ? "🟢 Sẵn sàng đi làm" : "🟡 Bận tạm thời"}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              {isEditing ? "Lưu" : "Chỉnh sửa"}
            </button>
          </div>
        </div>

        {/* V. TRUST SCORE - Prominent Bar (Most Important) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-orange-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-orange-600" strokeWidth={2} />
              Độ tin cậy & Lịch sử
            </h2>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
              <span className="text-2xl font-bold text-gray-900">
                {profile.trustScore.averageRating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{profile.trustScore.completedJobs}</div>
              <div className="text-sm text-gray-600">Ca đã hoàn thành</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{profile.trustScore.punctualityRate}%</div>
              <div className="text-sm text-gray-600">Đúng giờ</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{profile.trustScore.cancellationRate}%</div>
              <div className="text-sm text-gray-600">Huỷ ca</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{profile.trustScore.averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Đánh giá trung bình</div>
            </div>
          </div>

          {/* Badges */}
          {profile.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
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

          {/* Recent Comments */}
          {profile.trustScore.recentComments.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Nhận xét từ nhà hàng:</h3>
              {profile.trustScore.recentComments.map((comment, idx) => (
                <div key={idx} className="text-sm text-gray-700">
                  <span className="font-medium">{comment.business}:</span> "{comment.comment}"
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < comment.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                        }`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* I. THÔNG TIN CƠ BẢN (Identity) */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                Thông tin cơ bản
              </h2>
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 bg-gradient-orange rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    profile.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{profile.name}</h3>
                  {profile.birthYear && (
                    <p className="text-sm text-gray-600">Sinh năm {profile.birthYear}</p>
                  )}
                  {profile.gender && (
                    <p className="text-sm text-gray-600">{profile.gender}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {profile.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4" strokeWidth={1.5} />
                    {profile.phone}
                    {profile.verified.phone && <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={1.5} />}
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    {profile.location}
                    {profile.district && <span className="text-gray-500">({profile.district})</span>}
                  </div>
                )}
              </div>

              {/* Verification Badges */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                {profile.verified.phone && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                    SĐT
                  </span>
                )}
                {profile.verified.idCard && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                    CCCD
                  </span>
                )}
                {profile.verified.student && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                    Sinh viên
                  </span>
                )}
              </div>
            </div>

            {/* II. KHẢ NĂNG LÀM VIỆC (Work Readiness) */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Khả năng làm việc</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vị trí có thể làm</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.workReadiness.positions.map((pos) => {
                      const Icon = getPositionIcon(pos);
                      return (
                        <span
                          key={pos}
                          className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.5} />
                          {pos}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kinh nghiệm</label>
                  <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    {profile.workReadiness.experience}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kỹ năng</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.workReadiness.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  {profile.workReadiness.languageLevel && (
                    <div className="mt-2 text-sm text-gray-600">
                      Ngoại ngữ: <span className="font-medium">{profile.workReadiness.languageLevel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* III. THỜI GIAN & TÍNH LINH HOẠT (Availability) */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
                Thời gian & Tính linh hoạt
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian có thể làm</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.availability.timeSlots.map((slot) => {
                      const Icon = getTimeSlotIcon(slot);
                      return (
                        <span
                          key={slot}
                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.5} />
                          {slot}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày có thể làm</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.availability.days.map((day) => (
                      <span
                        key={day}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bắt đầu sớm nhất</label>
                    <span className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                      {profile.availability.startEarliest}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Khoảng cách</label>
                    <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      ≤{profile.availability.maxDistance}km
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* IV. LƯƠNG & MONG MUỐN (Expectation) */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                Lương & Mong muốn
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mức lương mong muốn</label>
                  <div className="flex gap-4">
                    {profile.expectation.hourlyRate && (
                      <div>
                        <span className="text-sm text-gray-600">Theo giờ:</span>
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(profile.expectation.hourlyRate)}
                        </div>
                      </div>
                    )}
                    {profile.expectation.perShiftRate && (
                      <div>
                        <span className="text-sm text-gray-600">Theo ca:</span>
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(profile.expectation.perShiftRate)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ưu tiên</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.expectation.priorities.map((priority) => (
                      <span
                        key={priority}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                      >
                        {priority}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Có thể làm lâu dài</label>
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    profile.expectation.longTerm
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {profile.expectation.longTerm ? "Có" : "Không"}
                  </span>
                </div>
              </div>
            </div>

            {/* VI. THÁI ĐỘ & CAM KẾT (Soft Signal) */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thái độ & Cam kết</h2>
              
              {profile.softSignal.bio && (
                <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-700 italic">"{profile.softSignal.bio}"</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cam kết</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profile.softSignal.commitments.noBail}
                      readOnly
                      className="w-4 h-4 text-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Không bỏ ca</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profile.softSignal.commitments.arriveEarly}
                      readOnly
                      className="w-4 h-4 text-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Đến sớm 10 phút</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profile.softSignal.commitments.willingToLearn}
                      readOnly
                      className="w-4 h-4 text-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Sẵn sàng học việc</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-orange rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Hành động nhanh</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/ai-matching")}
                  className="w-full px-4 py-3 bg-white text-orange-600 rounded-lg hover:bg-gray-100 transition font-medium flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" strokeWidth={2} />
                  AI Matching Thông minh
                </button>
                <button
                  onClick={() => router.push("/marketplace")}
                  className="w-full px-4 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium"
                >
                  Xem Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
