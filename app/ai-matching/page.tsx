"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { calculateDistance, formatDistance, getCurrentLocation, type Location } from "@/lib/geolocation";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

interface MatchResult {
  id: string;
  type: "PERFECT_MATCH" | "SMART_SCHEDULE";
  jobs: Array<{
    id: string;
    title: string;
    hourlyRate: number;
    totalAmount: number;
    startTime: string;
    endTime: string;
    branch: {
      name: string;
      address: string;
      city: string;
      latitude?: number;
      longitude?: number;
    };
    business: {
      name: string;
      rating?: number;
    };
    skillsRequired: string[];
    matchScore: number;
  }>;
  totalEarnings: number;
  totalHours: number;
  routeOptimized: boolean;
}

export default function AIMatchingPage() {
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ date: string; hour: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  useEffect(() => {
    getCurrentLocation().then(setUserLocation);
  }, []);

  // Generate hours for a day (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Get days of current week
  const getWeekDays = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const formatTime = (hour: number): string => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  const isSlotSelected = (date: string, hour: number): boolean => {
    return selectedSlots.some(
      (slot) =>
        slot.date === date &&
        parseInt(slot.startTime.split(":")[0]) <= hour &&
        parseInt(slot.endTime.split(":")[0]) > hour
    );
  };

  const handleSlotClick = (date: string, hour: number) => {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectStart({ date, hour });
    } else {
      if (selectStart && selectStart.date === date) {
        const startHour = Math.min(selectStart.hour, hour);
        const endHour = Math.max(selectStart.hour, hour) + 1;

        // Remove overlapping slots
        const newSlots = selectedSlots.filter(
          (slot) => !(slot.date === date && 
            parseInt(slot.startTime.split(":")[0]) < endHour &&
            parseInt(slot.endTime.split(":")[0]) > startHour)
        );

        // Add new slot
        newSlots.push({
          date,
          startTime: formatTime(startHour),
          endTime: formatTime(endHour),
        });

        setSelectedSlots(newSlots);
      }
      setIsSelecting(false);
      setSelectStart(null);
    }
  };

  const handleSlotMouseEnter = (date: string, hour: number) => {
    if (isSelecting && selectStart && selectStart.date === date) {
      // Visual feedback while selecting
    }
  };

  const removeSlot = (index: number) => {
    setSelectedSlots(selectedSlots.filter((_, i) => i !== index));
  };

  const handleAIMatching = async () => {
    if (selectedSlots.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khung giờ rảnh");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const { data } = await api.post("/ai-matching", {
        timeSlots: selectedSlots,
        location: userLocation,
      });

      setResults(data.matches || []);
      toast.success(`Tìm thấy ${data.matches?.length || 0} phương án tối ưu!`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Lỗi khi tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = async (match: MatchResult) => {
    try {
      // Apply to all jobs in the match
      for (const job of match.jobs) {
        await api.put("/matches", {
          jobId: job.id,
          status: "ACCEPTED",
        });
      }
      toast.success(`Đã nhận ${match.jobs.length} ca làm việc!`);
      // Refresh results
      handleAIMatching();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Lỗi khi nhận ca làm việc");
    }
  };

  const weekDays = getWeekDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50">
      {/* Header */}
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              AI Matching Thông Minh
            </h1>
            <p className="text-xl text-gray-600">
              Chọn khung giờ rảnh của bạn, AI sẽ tự động tìm ca làm việc phù hợp nhất
            </p>
          </div>

          {/* Calendar View */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
            {/* Week Navigation */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => {
                  const newWeek = new Date(currentWeek);
                  newWeek.setDate(newWeek.getDate() - 7);
                  setCurrentWeek(newWeek);
                }}
                className="px-4 py-2 text-gray-600 hover:text-orange-600 transition"
              >
                ← Tuần trước
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {weekDays[0].toLocaleDateString("vi-VN", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                -{" "}
                {weekDays[6].toLocaleDateString("vi-VN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={() => {
                  const newWeek = new Date(currentWeek);
                  newWeek.setDate(newWeek.getDate() + 7);
                  setCurrentWeek(newWeek);
                }}
                className="px-4 py-2 text-gray-600 hover:text-orange-600 transition"
              >
                Tuần sau →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Day Headers */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="text-sm font-semibold text-gray-600">Giờ</div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className="text-center text-sm font-semibold text-gray-700"
                    >
                      <div>{day.toLocaleDateString("vi-VN", { weekday: "short" })}</div>
                      <div className="text-xs text-gray-500">
                        {day.getDate()}/{day.getMonth() + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="space-y-1">
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 gap-2">
                      <div className="text-xs text-gray-500 py-2 flex items-center">
                        {formatTime(hour)}
                      </div>
                      {weekDays.map((day) => {
                        const dateKey = formatDateKey(day);
                        const isSelected = isSlotSelected(dateKey, hour);
                        const isToday =
                          dateKey === new Date().toISOString().split("T")[0];

                        return (
                          <button
                            key={`${dateKey}-${hour}`}
                            onClick={() => handleSlotClick(dateKey, hour)}
                            onMouseEnter={() => handleSlotMouseEnter(dateKey, hour)}
                            className={`
                              h-12 rounded-lg border-2 transition-all
                              ${
                                isSelected
                                  ? "bg-gradient-orange border-orange-500 shadow-md"
                                  : isToday
                                  ? "bg-orange-50 border-orange-200 hover:border-orange-300"
                                  : "bg-gray-50 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                              }
                            `}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Slots Display */}
            {selectedSlots.length > 0 && (
              <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Khung giờ đã chọn ({selectedSlots.length}):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-orange-300"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(slot.date).toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <button
                        onClick={() => removeSlot(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Matching Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleAIMatching}
                disabled={loading || selectedSlots.length === 0}
                className={`
                  px-8 py-4 rounded-xl font-bold text-lg shadow-2xl
                  transform transition-all duration-300
                  ${
                    loading || selectedSlots.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-orange text-white hover:opacity-90 hover:scale-105 active:scale-95"
                  }
                `}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    AI đang tìm kiếm...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    Matching Thông Minh
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-gray-200 rounded-xl h-32"
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Top {results.length} Phương Án Tối Ưu
              </h2>

              {results.map((match, index) => (
                <div
                  key={index}
                  className={`
                    bg-white rounded-2xl shadow-xl p-6 border-2 transition-all
                    ${
                      match.type === "PERFECT_MATCH"
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-white"
                        : "border-orange-500 bg-gradient-to-br from-orange-50 to-white"
                    }
                  `}
                >
                  {/* Match Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {match.type === "PERFECT_MATCH" ? (
                          <>
                            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                              ⭐ Perfect Match
                            </span>
                            <span className="text-sm text-gray-600">
                              Khớp 100% thời gian và kỹ năng
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">
                              🧠 Smart Schedule
                            </span>
                            <span className="text-sm text-gray-600">
                              Lịch trình tối ưu đã được AI sắp xếp
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📅 {match.jobs.length} ca làm việc</span>
                        <span>⏱️ {match.totalHours.toFixed(1)} giờ</span>
                        <span className="text-orange-600 font-bold text-lg">
                          💰 {formatCurrency(match.totalEarnings)}
                        </span>
                        {match.routeOptimized && (
                          <span className="text-blue-600">📍 Tối ưu lộ trình</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyAll(match)}
                      className="px-6 py-3 bg-gradient-orange text-white rounded-xl hover:opacity-90 transition font-bold shadow-lg"
                    >
                      Nhận toàn bộ ca làm này
                    </button>
                  </div>

                  {/* Jobs List */}
                  <div className="space-y-3">
                    {match.jobs.map((job, jobIndex) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-gray-900">
                                {job.title}
                              </h3>
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                {job.matchScore}% khớp
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {job.business.name} • {job.branch.name}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                🕐{" "}
                                {new Date(job.startTime).toLocaleString("vi-VN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span>💰 {formatCurrency(job.hourlyRate)}/giờ</span>
                              {userLocation &&
                                job.branch.latitude &&
                                job.branch.longitude && (
                                  <span>
                                    📍{" "}
                                    {formatDistance(
                                      calculateDistance(userLocation, {
                                        lat: job.branch.latitude,
                                        lng: job.branch.longitude,
                                      })
                                    )}
                                  </span>
                                )}
                            </div>
                          </div>
                          <Link
                            href={`/worker/jobs/${job.id}`}
                            className="ml-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-orange-100 hover:text-orange-700 transition"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && selectedSlots.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Chưa tìm thấy ca làm việc phù hợp
              </h3>
              <p className="text-gray-600">
                Thử chọn các khung giờ khác hoặc mở rộng phạm vi tìm kiếm
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

