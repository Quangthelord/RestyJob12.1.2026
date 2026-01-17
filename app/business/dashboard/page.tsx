"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BusinessDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalWorkers: 0,
    totalPayments: 0,
  });

  useEffect(() => {
    // Demo mode - no authentication required
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, branchesRes, paymentsRes] = await Promise.all([
        api.get("/jobs"),
        api.get("/branches"),
        api.get("/payments"),
      ]);

      setJobs(jobsRes.data.jobs || []);
      setBranches(branchesRes.data.branches || []);

      const payments = paymentsRes.data.payments || [];
      const activeJobs = jobsRes.data.jobs.filter((j: any) =>
        ["PENDING", "MATCHED", "IN_PROGRESS"].includes(j.status)
      );
      const uniqueWorkers = new Set(
        jobsRes.data.jobs.flatMap(
          (j: any) => j.matches?.map((m: any) => m.workerId) || []
        )
      );

      setStats({
        totalJobs: jobsRes.data.jobs.length,
        activeJobs: activeJobs.length,
        totalWorkers: uniqueWorkers.size,
        totalPayments: payments.reduce(
          (sum: number, p: any) => sum + p.amount,
          0
        ),
      });
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Dashboard Doanh nghiệp
            </h1>
            <p className="text-xl text-gray-600">Quản lý ca làm việc và nhân sự</p>
          </div>
          <Link
            href="/business/profile"
            className="px-6 py-3 bg-white text-orange-600 border-2 border-orange-600 rounded-lg hover:bg-orange-50 transition font-medium shadow-lg"
          >
            👤 Xem Profile
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-orange p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-sm font-medium text-white/80 mb-1">
              Tổng ca làm việc
            </h3>
            <p className="text-3xl font-bold">
              {stats.totalJobs}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Ca đang hoạt động
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.activeJobs}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Tổng nhân sự
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              {stats.totalWorkers}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Tổng thanh toán
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(stats.totalPayments)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/business/jobs/new"
            className="px-6 py-3 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition shadow-lg font-medium"
          >
            + Đăng ca làm việc mới
          </Link>
          <Link
            href="/business/branches"
            className="px-6 py-3 bg-white text-orange-600 rounded-lg border-2 border-orange-600 hover:bg-orange-50 transition font-medium"
          >
            Quản lý chi nhánh
          </Link>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Ca làm việc gần đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chi nhánh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khớp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.slice(0, 10).map((job) => (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {job.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {job.branch?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {formatDateTime(job.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          job.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : job.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : job.status === "MATCHED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {job._count?.matches || 0} matches
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/business/jobs/${job.id}`}
                        className="text-orange-600 hover:text-orange-800 font-medium"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
