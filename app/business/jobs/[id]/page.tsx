"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BusinessJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo mode - no authentication required
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/jobs/${params.id}`);
      setJob(data.job);
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

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Không tìm thấy ca làm việc</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
          <p className="text-gray-600 mb-4">{job.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Chi nhánh</p>
              <p className="font-semibold">{job.branch?.name}</p>
              <p className="text-sm text-gray-600">{job.branch?.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Thời gian</p>
              <p className="font-semibold">
                {formatDateTime(job.startTime)} - {formatDateTime(job.endTime)}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Kỹ năng yêu cầu</p>
            <div className="flex flex-wrap gap-2">
              {job.skillsRequired.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Mức lương</p>
            <p className="font-semibold text-orange-600">
              {formatCurrency(job.hourlyRate)}/giờ
            </p>
            <p className="text-sm text-gray-600">
              Tổng: {formatCurrency(job.totalAmount)}
            </p>
          </div>
        </div>

        {/* Matches */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Người lao động được khớp
          </h2>
          {job.matches && job.matches.length > 0 ? (
            <div className="space-y-4">
              {job.matches.map((match: any) => (
                <div key={match.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {match.worker.name}
                      </h3>
                      <p className="text-gray-600">
                        Điểm đánh giá: {match.worker.rating.toFixed(1)}/5.0
                      </p>
                      {match.matchScore && (
                        <p className="text-sm text-gray-500">
                          Điểm khớp: {match.matchScore}/100
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Trạng thái:{" "}
                        <span className="font-semibold">{match.status}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Chưa có người lao động được khớp
            </p>
          )}
        </div>

        {/* Check-ins */}
        {job.checkIns && job.checkIns.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Lịch sử Check-in</h2>
            <div className="space-y-4">
              {job.checkIns.map((checkIn: any) => (
                <div key={checkIn.id} className="border rounded-lg p-4">
                  <p className="font-semibold">{checkIn.worker.name}</p>
                  <p className="text-sm text-gray-600">
                    Check-in: {formatDateTime(checkIn.checkInTime)}
                  </p>
                  {checkIn.checkOutTime && (
                    <p className="text-sm text-gray-600">
                      Check-out: {formatDateTime(checkIn.checkOutTime)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
