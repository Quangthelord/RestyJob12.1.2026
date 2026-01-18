"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime, calculateHours } from "@/lib/utils";
import toast from "react-hot-toast";

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [job, setJob] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [checkIn, setCheckIn] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo mode - no authentication required
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [jobRes, matchesRes] = await Promise.all([
        api.get(`/jobs/${params.id}`),
        api.get(`/matches?jobId=${params.id}`),
      ]);

      setJob(jobRes.data.job);
      const workerMatch = user ? matchesRes.data.matches.find(
        (m: any) => m.workerId === user.id
      ) : undefined;
      setMatch(workerMatch);

      if (workerMatch) {
        // Fetch check-in
        try {
          const checkInRes = await api.get(
            `/checkin?matchId=${workerMatch.id}`
          );
          setCheckIn(checkInRes.data.checkIn);
        } catch {
          // No check-in yet
        }
      }
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!match) return;

    try {
      const { data } = await api.post("/checkin", {
        matchId: match.id,
        location: navigator.geolocation ? "GPS" : null,
      });
      setCheckIn(data.checkIn);
      toast.success("Check-in thành công!");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Check-in thất bại");
    }
  };

  const handleCheckOut = async () => {
    if (!checkIn) return;

    try {
      await api.put("/checkin", { checkInId: checkIn.id });
      toast.success("Check-out thành công!");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Check-out thất bại");
    }
  };

  const handleRate = async (score: number, comment: string) => {
    if (!match) return;

    try {
      await api.post("/ratings", {
        matchId: match.id,
        score,
        comment,
      });
      toast.success("Đánh giá thành công!");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Đánh giá thất bại");
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

  const canCheckIn = match?.status === "ACCEPTED" && !checkIn;
  const canCheckOut = checkIn && !checkIn.checkOutTime;
  // Check if user has already rated this match
  const existingRating = job.matches?.find(
    (m: any) => m.id === match?.id
  )?.rating;
  const canRate =
    match?.status === "COMPLETED" && !existingRating && user?.role === "WORKER";

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
              <p className="text-sm text-gray-500">Doanh nghiệp</p>
              <p className="font-semibold">
                {job.business?.companyName || job.business?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Thời gian</p>
              <p className="font-semibold">
                {formatDateTime(job.startTime)} - {formatDateTime(job.endTime)}
              </p>
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

          <div>
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
        </div>

        {match && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Trạng thái ca làm việc
            </h2>
            <p className="mb-2">
              Trạng thái: <span className="font-semibold">{match.status}</span>
            </p>
            {match.matchScore && (
              <p className="mb-4">
                Điểm khớp:{" "}
                <span className="font-semibold">{match.matchScore}/100</span>
              </p>
            )}

            {canCheckIn && (
              <button
                onClick={handleCheckIn}
                className="px-6 py-2 bg-gradient-orange text-white rounded-lg hover:opacity-90 font-medium shadow-lg"
              >
                Check-in
              </button>
            )}

            {canCheckOut && (
              <div>
                <p className="mb-2">
                  Đã check-in lúc: {formatDateTime(checkIn.checkInTime)}
                </p>
                <button
                  onClick={handleCheckOut}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Check-out
                </button>
              </div>
            )}

            {checkIn?.checkOutTime && (
              <div>
                <p>Check-in: {formatDateTime(checkIn.checkInTime)}</p>
                <p>Check-out: {formatDateTime(checkIn.checkOutTime)}</p>
                <p className="font-semibold mt-2">
                  Tổng giờ:{" "}
                  {calculateHours(
                    new Date(checkIn.checkInTime),
                    new Date(checkIn.checkOutTime)
                  )}{" "}
                  giờ
                </p>
              </div>
            )}
          </div>
        )}

        {canRate && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Đánh giá</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleRate(
                  parseInt(formData.get("score") as string),
                  formData.get("comment") as string
                );
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm (1-5)
                </label>
                <select
                  name="score"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="5">5 - Rất tốt</option>
                  <option value="4">4 - Tốt</option>
                  <option value="3">3 - Bình thường</option>
                  <option value="2">2 - Kém</option>
                  <option value="1">1 - Rất kém</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhận xét
                </label>
                <textarea
                  name="comment"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-orange text-white rounded-lg hover:opacity-90 font-medium shadow-lg"
              >
                Gửi đánh giá
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
