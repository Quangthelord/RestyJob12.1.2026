"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

interface WorkHistory {
  id: string;
  job: {
    title: string;
    business: {
      name: string;
    };
    branch: {
      name: string;
    };
    startTime: string;
    endTime: string;
  };
  rating?: {
    score: number;
    comment: string;
  };
  payment: {
    amount: number;
    status: string;
  };
}

interface TrustMetrics {
  punctuality: number; // Đúng giờ
  attitude: number; // Thái độ
  skills: number; // Kỹ năng chuyên môn
  completionRate: number; // Tỉ lệ hoàn thành
}

export default function WorkerProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingMatches: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
  });
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [trustMetrics, setTrustMetrics] = useState<TrustMetrics>({
    punctuality: 0,
    attitude: 0,
    skills: 0,
    completionRate: 0,
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>>([]);
  const [trustLevel, setTrustLevel] = useState<"BRONZE" | "SILVER" | "GOLD">("BRONZE");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesRes, paymentsRes, ratingsRes, userRes] = await Promise.all([
        api.get("/matches"),
        api.get("/payments"),
        api.get("/ratings"),
        api.get("/auth/me"),
      ]);

      const matches = matchesRes.data.matches || [];
      const payments = paymentsRes.data.payments || [];
      const ratings = ratingsRes.data.ratings || [];

      // Calculate stats
      const pendingMatches = matches.filter((m: any) => m.status === "PENDING");
      const activeMatches = matches.filter((m: any) =>
        ["ACCEPTED", "IN_PROGRESS"].includes(m.status)
      );
      const completedMatches = matches.filter((m: any) => m.status === "COMPLETED");

      setStats({
        pendingMatches: pendingMatches.length,
        activeJobs: activeMatches.length,
        completedJobs: completedMatches.length,
        totalEarnings: payments
          .filter((p: any) => p.status === "COMPLETED")
          .reduce((sum: number, p: any) => sum + p.amount, 0),
      });

      // Calculate trust level based on completed jobs
      if (completedMatches.length >= 50) {
        setTrustLevel("GOLD");
      } else if (completedMatches.length >= 20) {
        setTrustLevel("SILVER");
      } else {
        setTrustLevel("BRONZE");
      }

      // Calculate trust metrics from ratings
      if (ratings.length > 0) {
        const avgPunctuality = ratings.reduce((sum: number, r: any) => sum + (r.punctuality || 0), 0) / ratings.length;
        const avgAttitude = ratings.reduce((sum: number, r: any) => sum + (r.attitude || 0), 0) / ratings.length;
        const avgSkills = ratings.reduce((sum: number, r: any) => sum + (r.skillLevel || 0), 0) / ratings.length;
        const completionRate = (completedMatches.length / matches.length) * 100 || 0;

        setTrustMetrics({
          punctuality: Math.round(avgPunctuality * 20), // Convert 0-5 to 0-100
          attitude: Math.round(avgAttitude * 20),
          skills: Math.round(avgSkills * 20),
          completionRate: Math.round(completionRate),
        });
      }

      // Get work history from completed matches
      const history: WorkHistory[] = [];
      for (const match of completedMatches.slice(0, 10)) {
        try {
          const jobRes = await api.get(`/jobs/${match.jobId}`);
          const ratingRes = ratings.find((r: any) => r.matchId === match.id);
          const paymentRes = payments.find((p: any) => p.matchId === match.id);

          history.push({
            id: match.id,
            job: jobRes.data.job,
            rating: ratingRes,
            payment: paymentRes || { amount: 0, status: "PENDING" },
          });
        } catch (error) {
          console.error("Error fetching job details:", error);
        }
      }
      setWorkHistory(history);

      // Get user skills
      if (userRes.data?.user?.skills) {
        setSkills(userRes.data.user.skills);
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (skill: string) => {
    if (skills.includes(skill) || !skill.trim()) return;

    try {
      // TODO: Update user skills via API
      setSkills([...skills, skill.trim()]);
      toast.success("Đã thêm kỹ năng");
    } catch (error) {
      toast.error("Lỗi khi thêm kỹ năng");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
    toast.success("Đã xóa kỹ năng");
  };

  const getTrustBadgeColor = () => {
    switch (trustLevel) {
      case "GOLD":
        return "bg-gradient-to-br from-yellow-400 to-yellow-600";
      case "SILVER":
        return "bg-gradient-to-br from-gray-300 to-gray-500";
      default:
        return "bg-gradient-to-br from-orange-400 to-orange-600";
    }
  };

  const getTrustBadgeText = () => {
    switch (trustLevel) {
      case "GOLD":
        return "🥇 Vàng";
      case "SILVER":
        return "🥈 Bạc";
      default:
        return "🥉 Đồng";
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard Người lao động
          </h1>
          <p className="text-xl text-gray-600">Quản lý ca làm việc của bạn</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Identity Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              {/* Avatar & Trust Badge */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-orange rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white font-bold text-4xl">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div
                    className={`absolute -bottom-2 -right-2 ${getTrustBadgeColor()} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}
                  >
                    {getTrustBadgeText()}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {user?.name || "Người lao động"}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>

              {/* AI Matching Key */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-orange-600">✨</span> AI Matching Key
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.slice(0, 6).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-sm text-gray-500">Chưa có kỹ năng</p>
                  )}
                </div>
              </div>

              {/* AI Matching Button */}
              <Link
                href="/ai-matching"
                className="w-full px-6 py-4 bg-gradient-orange text-white rounded-xl hover:opacity-90 transition font-bold shadow-lg text-center block"
              >
                ✨ AI Matching Thông Minh
              </Link>
            </div>

            {/* Trust Score Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Trust Score
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Đúng giờ", value: trustMetrics.punctuality, color: "bg-green-500" },
                  { label: "Thái độ", value: trustMetrics.attitude, color: "bg-blue-500" },
                  { label: "Kỹ năng", value: trustMetrics.skills, color: "bg-purple-500" },
                  { label: "Hoàn thành", value: trustMetrics.completionRate, color: "bg-orange-500" },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{metric.label}</span>
                      <span className="text-sm font-bold text-gray-900">{metric.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${metric.color} h-2 rounded-full transition-all`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Performance & Resume */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Chờ xác nhận
                </h3>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.pendingMatches}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Ca đang làm
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.activeJobs}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Ca đã hoàn thành
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completedJobs}
                </p>
              </div>
              <div className="bg-gradient-orange p-6 rounded-xl shadow-lg text-white">
                <h3 className="text-sm font-medium text-white/80 mb-1">
                  Tổng thu nhập
                </h3>
                <p className="text-3xl font-bold">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </div>
            </div>

            {/* Skills & Certifications */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Kỹ năng & Chứng chỉ
                </h3>
                <button
                  onClick={() => {
                    const skill = prompt("Nhập kỹ năng mới:");
                    if (skill) handleAddSkill(skill);
                  }}
                  className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                >
                  + Thêm kỹ năng
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {skills.length === 0 && (
                  <p className="text-gray-500">Chưa có kỹ năng nào</p>
                )}
              </div>
            </div>

            {/* Availability Calendar */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Lịch rảnh
              </h3>
              <p className="text-gray-600 mb-4">
                Cập nhật khung giờ bạn có thể đi làm để AI Matching tìm ca phù hợp
              </p>
              <Link
                href="/ai-matching"
                className="inline-block px-6 py-3 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg"
              >
                ⚙️ Quản lý lịch rảnh
              </Link>
            </div>

            {/* Work History */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Lịch sử làm việc
              </h3>
              {workHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📋</span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Bạn chưa có ca làm nào, hãy dùng AI Matching để tìm việc ngay!
                  </p>
                  <Link
                    href="/ai-matching"
                    className="inline-block px-6 py-3 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg"
                  >
                    ✨ Tìm việc với AI Matching
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {workHistory.map((history) => (
                    <div
                      key={history.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {history.job.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {history.job.business.name} • {history.job.branch.name}
                          </p>
                        </div>
                        {history.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.round(history.rating!.score)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="text-sm text-gray-600 ml-1">
                              {history.rating.score.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>
                          📅{" "}
                          {formatDateTime(history.job.startTime)} -{" "}
                          {formatDateTime(history.job.endTime)}
                        </span>
                        <span className="text-orange-600 font-bold">
                          💰 {formatCurrency(history.payment.amount)}
                        </span>
                      </div>
                      {history.rating?.comment && (
                        <p className="text-sm text-gray-700 italic mt-2">
                          "{history.rating.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



