"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

interface FavoriteWorker {
  id: string;
  name: string;
  rating: number;
  completedJobs: number;
  skills: string[];
  lastWorkedAt?: string;
}

interface ActiveShift {
  id: string;
  job: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
    maxWorkers: number;
  };
  matches: Array<{
    id: string;
    status: string;
    worker: {
      id: string;
      name: string;
      rating: number;
    };
    checkIn?: {
      checkInTime: string;
    };
  }>;
  branch: {
    name: string;
    address: string;
  };
}

interface Invoice {
  id: string;
  jobId: string;
  jobTitle: string;
  date: string;
  totalAmount: number;
  workers: number;
  status: string;
}

export default function BusinessProfile() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalWorkers: 0,
    totalPayments: 0,
    budgetRemaining: 10000000, // Mock budget
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [favoriteWorkers, setFavoriteWorkers] = useState<FavoriteWorker[]>([]);
  const [activeShifts, setActiveShifts] = useState<ActiveShift[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [employerRating, setEmployerRating] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    fetchData();
    // Set up polling for real-time updates (mock WebSocket)
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, branchesRes, paymentsRes, ratingsRes, matchesRes] =
        await Promise.all([
          api.get("/jobs"),
          api.get("/branches"),
          api.get("/payments"),
          api.get("/ratings"),
          api.get("/matches"),
        ]);

      const jobs = jobsRes.data.jobs || [];
      const payments = paymentsRes.data.payments || [];
      const ratings = ratingsRes.data.ratings || [];
      const matches = matchesRes.data.matches || [];

      // Calculate stats
      const activeJobs = jobs.filter((j: any) =>
        ["PENDING", "MATCHED", "IN_PROGRESS"].includes(j.status)
      );
      const completedJobs = jobs.filter(
        (j: any) => j.status === "COMPLETED"
      );

      // Calculate employer rating from worker ratings
      const workerRatings = ratings.filter((r: any) => r.fromWorker);
      if (workerRatings.length > 0) {
        const avgRating =
          workerRatings.reduce(
            (sum: number, r: any) => sum + (r.employerRating || 0),
            0
          ) / workerRatings.length;
        setEmployerRating(avgRating);
      }

      setStats({
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        totalWorkers: new Set(
          matches.map((m: any) => m.workerId).filter(Boolean)
        ).size,
        totalPayments: payments.reduce(
          (sum: number, p: any) => sum + p.amount,
          0
        ),
        budgetRemaining: 10000000 - payments.reduce(
          (sum: number, p: any) => sum + p.amount,
          0
        ),
      });

      setBranches(branchesRes.data.branches || []);

      // Get favorite workers (top rated workers who worked multiple times)
      const workerStats = new Map<string, any>();
      matches.forEach((match: any) => {
        if (match.worker && match.status === "COMPLETED") {
          const workerId = match.worker.id;
          if (!workerStats.has(workerId)) {
            workerStats.set(workerId, {
              worker: match.worker,
              count: 0,
              totalRating: 0,
            });
          }
          const stats = workerStats.get(workerId);
          stats.count++;
          stats.totalRating += match.worker.rating || 0;
        }
      });

      const favorites: FavoriteWorker[] = Array.from(workerStats.values())
        .filter((s) => s.count >= 2)
        .map((s) => ({
          id: s.worker.id,
          name: s.worker.name,
          rating: s.totalRating / s.count,
          completedJobs: s.count,
          skills: s.worker.skills || [],
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);

      setFavoriteWorkers(favorites);

      // Get active shifts with matches
      const activeShiftsData: ActiveShift[] = [];
      for (const job of activeJobs.slice(0, 5)) {
        try {
          const jobMatches = matches.filter((m: any) => m.jobId === job.id);
          const jobMatchesWithCheckIn = await Promise.all(
            jobMatches.map(async (match: any) => {
              try {
                const checkInRes = await api.get(
                  `/checkin?matchId=${match.id}`
                );
                return {
                  ...match,
                  checkIn: checkInRes.data.checkIn,
                };
              } catch {
                return match;
              }
            })
          );

          activeShiftsData.push({
            id: job.id,
            job,
            matches: jobMatchesWithCheckIn,
            branch: job.branch || { name: "N/A", address: "N/A" },
          });
        } catch (error) {
          console.error("Error fetching job details:", error);
        }
      }
      setActiveShifts(activeShiftsData);

      // Get recent invoices
      const invoices: Invoice[] = completedJobs.slice(0, 5).map((job: any) => {
        const jobPayments = payments.filter((p: any) => p.jobId === job.id);
        return {
          id: `inv-${job.id}`,
          jobId: job.id,
          jobTitle: job.title,
          date: job.endTime,
          totalAmount: jobPayments.reduce(
            (sum: number, p: any) => sum + p.amount,
            0
          ),
          workers: jobPayments.length,
          status: "PAID",
        };
      });
      setRecentInvoices(invoices);

      // Mock verification (in real app, check GPKD)
      setIsVerified(user?.companyName ? true : false);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggestion = async () => {
    toast.success("AI đang phân tích lịch sử và đề xuất khung giờ tối ưu...");
    // TODO: Implement AI suggestion based on historical data
  };

  const handleNotifyFavorites = async (jobId: string) => {
    toast.success(
      `Đã gửi thông báo ưu tiên cho ${favoriteWorkers.length} nhân sự ruột`
    );
    // TODO: Implement notification to favorite workers
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Dashboard Doanh nghiệp
            </h1>
            <p className="text-xl text-gray-600">
              Trung tâm điều phối nhân sự
            </p>
          </div>
          <Link
            href="/business/dashboard"
            className="px-6 py-3 bg-white text-orange-600 border-2 border-orange-600 rounded-lg hover:bg-orange-50 transition font-medium shadow-lg"
          >
            📊 Xem Dashboard
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Brand Identity & Trust */}
          <div className="lg:col-span-1 space-y-6">
            {/* Brand Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              {/* Logo & Verification */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-orange rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white font-bold text-4xl">
                      {user?.companyName?.charAt(0).toUpperCase() || "C"}
                    </span>
                  </div>
                  {isVerified && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Đã xác thực
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {user?.companyName || "Doanh nghiệp"}
                </h2>
                <p className="text-gray-600">{user?.name}</p>
              </div>

              {/* Employer Rating */}
              <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Đánh giá từ người lao động
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(employerRating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {employerRating.toFixed(1)} / 5.0
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Giúp thu hút CLs chất lượng
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <Link
                  href="/business/jobs/new"
                  className="w-full px-6 py-4 bg-gradient-orange text-white rounded-xl hover:opacity-90 transition font-bold shadow-lg text-center block"
                >
                  ➕ Đăng ca mới
                </Link>
                <button
                  onClick={handleAISuggestion}
                  className="w-full px-6 py-4 bg-white text-orange-600 border-2 border-orange-600 rounded-xl hover:bg-orange-50 transition font-bold shadow-lg"
                >
                  🤖 AI Suggestion
                </button>
              </div>
            </div>

            {/* Favorite Workers */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                ⭐ Nhân sự ruột ({favoriteWorkers.length})
              </h3>
              {favoriteWorkers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Chưa có nhân sự ruột. Hoàn thành ca làm việc để xây dựng danh sách.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {favoriteWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {worker.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.round(worker.rating)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {worker.completedJobs} ca
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Operation Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Tổng chi phí
                </h3>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(stats.totalPayments)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Số ca hoàn thành
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  {stats.totalJobs - stats.activeJobs}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Ngân sách còn lại
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(stats.budgetRemaining)}
                </p>
              </div>
              <div className="bg-gradient-orange p-6 rounded-xl shadow-lg text-white">
                <h3 className="text-sm font-medium text-white/80 mb-1">
                  Nhân sự đang làm
                </h3>
                <p className="text-3xl font-bold">{stats.totalWorkers}</p>
              </div>
            </div>

            {/* Multi-Branch Management */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  🏢 Quản lý đa chi nhánh
                </h3>
                <Link
                  href="/business/branches"
                  className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                >
                  + Thêm chi nhánh
                </Link>
              </div>
              {branches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Chưa có chi nhánh nào. Tạo chi nhánh đầu tiên để bắt đầu.
                  </p>
                  <Link
                    href="/business/branches"
                    className="inline-block px-6 py-3 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg"
                  >
                    Tạo chi nhánh
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition"
                    >
                      <h4 className="font-bold text-gray-900 mb-1">
                        {branch.name}
                      </h4>
                      <p className="text-sm text-gray-600">{branch.address}</p>
                      <p className="text-xs text-gray-500 mt-1">{branch.city}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Shifts Monitor */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📊 Ca làm việc đang diễn ra
              </h3>
              {activeShifts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📅</span>
                  </div>
                  <p className="text-gray-600 mb-4 text-lg">
                    Quán đang đủ người? Hãy chuẩn bị trước kịch bản cho giờ cao điểm bằng cách tạo ca dự phòng.
                  </p>
                  <Link
                    href="/business/jobs/new"
                    className="inline-block px-6 py-3 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg"
                  >
                    ➕ Tạo ca dự phòng
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeShifts.map((shift) => {
                    const filledSlots = shift.matches.filter(
                      (m) => m.status === "ACCEPTED" || m.status === "IN_PROGRESS"
                    ).length;
                    const checkedIn = shift.matches.filter(
                      (m) => m.checkIn
                    ).length;
                    const waiting = shift.matches.filter(
                      (m) => m.status === "PENDING"
                    ).length;

                    return (
                      <div
                        key={shift.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {shift.job.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {shift.branch.name} • {shift.branch.address}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(shift.job.startTime)} -{" "}
                              {formatDateTime(shift.job.endTime)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-700">
                              {filledSlots}/{shift.job.maxWorkers} người
                            </p>
                            <p className="text-xs text-gray-500">
                              {checkedIn} đã check-in
                            </p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {filledSlots > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              ✓ Đã có người ({filledSlots})
                            </span>
                          )}
                          {waiting > 0 && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                              ⏳ Đang đợi ({waiting})
                            </span>
                          )}
                          {checkedIn > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              📍 Đã check-in ({checkedIn})
                            </span>
                          )}
                          {filledSlots < shift.job.maxWorkers && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                              ⚠️ Thiếu người
                            </span>
                          )}
                        </div>

                        {/* Workers List */}
                        {shift.matches.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Nhân sự:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {shift.matches
                                .filter(
                                  (m) =>
                                    m.status === "ACCEPTED" ||
                                    m.status === "IN_PROGRESS"
                                )
                                .map((match) => (
                                  <div
                                    key={match.id}
                                    className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-xs"
                                  >
                                    <span className="font-medium text-gray-900">
                                      {match.worker.name}
                                    </span>
                                    {match.checkIn ? (
                                      <span className="text-green-600">✓</span>
                                    ) : (
                                      <span className="text-gray-400">○</span>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <Link
                            href={`/business/jobs/${shift.job.id}`}
                            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-orange-100 hover:text-orange-700 transition text-center"
                          >
                            Xem chi tiết
                          </Link>
                          {favoriteWorkers.length > 0 && (
                            <button
                              onClick={() => handleNotifyFavorites(shift.id)}
                              className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                            >
                              🔔 Ưu tiên
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Automatic Invoicing */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  📄 Hóa đơn & Báo cáo
                </h3>
                <button
                  onClick={() => {
                    toast.success("Đang xuất báo cáo...");
                    // TODO: Implement invoice export
                  }}
                  className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                >
                  📥 Xuất báo cáo
                </button>
              </div>
              {recentInvoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Chưa có hóa đơn nào
                </p>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {invoice.jobTitle}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(invoice.date)} • {invoice.workers} người
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f97316;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ea580c;
        }
      `}</style>
    </div>
  );
}



