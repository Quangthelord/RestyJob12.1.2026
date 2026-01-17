"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

export default function WorkerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingMatches: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    // Demo mode - no authentication required
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, jobsRes, paymentsRes] = await Promise.all([
        api.get("/matches"),
        api.get("/jobs?status=PENDING"),
        api.get("/payments"),
      ]);

      setMatches(matchesRes.data.matches || []);
      setAvailableJobs(jobsRes.data.jobs || []);

      const payments = paymentsRes.data.payments || [];
      const pendingMatches = matchesRes.data.matches.filter(
        (m: any) => m.status === "PENDING"
      );
      const activeMatches = matchesRes.data.matches.filter((m: any) =>
        ["ACCEPTED", "IN_PROGRESS"].includes(m.status)
      );
      const completedMatches = matchesRes.data.matches.filter(
        (m: any) => m.status === "COMPLETED"
      );

      setStats({
        pendingMatches: pendingMatches.length,
        activeJobs: activeMatches.length,
        completedJobs: completedMatches.length,
        totalEarnings: payments
          .filter((p: any) => p.status === "COMPLETED")
          .reduce((sum: number, p: any) => sum + p.amount, 0),
      });
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (matchId: string) => {
    try {
      await api.put("/matches", { matchId, status: "ACCEPTED" });
      toast.success("Đã chấp nhận ca làm việc!");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Lỗi khi chấp nhận");
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    try {
      await api.put("/matches", { matchId, status: "REJECTED" });
      toast.success("Đã từ chối ca làm việc");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Lỗi khi từ chối");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
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
              Dashboard Người lao động
            </h1>
            <p className="text-xl text-gray-600">Quản lý ca làm việc của bạn</p>
          </div>
          <Link
            href="/worker/profile"
            className="px-6 py-3 bg-white text-orange-600 border-2 border-orange-600 rounded-lg hover:bg-orange-50 transition font-medium shadow-lg"
          >
            👤 Xem Profile
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Chờ xác nhận
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
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

        {/* Pending Matches */}
        {matches.filter((m) => m.status === "PENDING").length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Ca làm việc được đề xuất
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {matches
                .filter((m) => m.status === "PENDING")
                .map((match) => (
                  <div key={match.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {match.job.title}
                        </h3>
                        <p className="text-gray-600">
                          {match.job.branch?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(match.job.startTime)} -{" "}
                          {formatDateTime(match.job.endTime)}
                        </p>
                        <p className="text-orange-600 font-semibold mt-2">
                          {formatCurrency(match.job.hourlyRate)}/giờ
                        </p>
                        {match.matchScore && (
                          <p className="text-sm text-gray-500 mt-1">
                            Điểm khớp: {match.matchScore}/100
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptMatch(match.id)}
                          className="px-4 py-2 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg"
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={() => handleRejectMatch(match.id)}
                          className="px-4 py-2 bg-white text-red-600 rounded-lg border-2 border-red-600 hover:bg-red-50 transition font-medium"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Active Jobs */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Ca làm việc đang hoạt động
          </h2>
          {matches.filter((m) =>
            ["ACCEPTED", "IN_PROGRESS"].includes(m.status)
          ).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📅</span>
              </div>
              <p className="text-gray-600 mb-4 text-lg">
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
              {matches
                .filter((m) => ["ACCEPTED", "IN_PROGRESS"].includes(m.status))
                .map((match) => (
                  <div
                    key={match.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {match.job.title}
                        </h3>
                        <p className="text-gray-600">{match.job.branch?.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(match.job.startTime)} -{" "}
                          {formatDateTime(match.job.endTime)}
                        </p>
                      </div>
                      <Link
                        href={`/worker/jobs/${match.jobId}`}
                        className="px-4 py-2 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
