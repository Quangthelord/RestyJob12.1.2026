"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { calculateDistance, formatDistance, getCurrentLocation, type Location } from "@/lib/geolocation";
import api from "@/lib/api";

interface Job {
  id: string;
  title: string;
  description: string;
  hourlyRate: number;
  totalAmount: number;
  startTime: string;
  endTime: string;
  skillsRequired: string[];
  branch: {
    name: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  business: {
    name: string;
    companyName?: string;
    rating?: number;
  };
  status: string;
  createdAt: string;
  maxWorkers: number;
  _count?: {
    matches: number;
  };
}

type ShiftTime = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "SPLIT" | "ALL";
type IncomeType = "HOURLY" | "SHIFT" | "ALL";

export default function MarketplacePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedShiftTime, setSelectedShiftTime] = useState<ShiftTime>("ALL");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [radius, setRadius] = useState<number>(10);
  const [incomeType, setIncomeType] = useState<IncomeType>("ALL");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "salary" | "soonest" | "distance">("soonest");

  // Empty state subscription
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscriptionArea, setSubscriptionArea] = useState("");

  useEffect(() => {
    fetchJobs();
    getCurrentLocation().then(setUserLocation);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/jobs?status=PENDING");
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftTime = (startTime: string): ShiftTime => {
    const hour = new Date(startTime).getHours();
    if (hour >= 5 && hour < 12) return "MORNING";
    if (hour >= 12 && hour < 17) return "AFTERNOON";
    if (hour >= 17 && hour < 22) return "EVENING";
    if (hour >= 22 || hour < 5) return "NIGHT";
    return "SPLIT";
  };

  const getJobDistance = (job: Job): number | null => {
    if (!userLocation || !job.branch?.latitude || !job.branch?.longitude) {
      return null;
    }
    return calculateDistance(userLocation, {
      lat: job.branch.latitude,
      lng: job.branch.longitude,
    });
  };

  const getJobBadge = (job: Job): { text: string; color: string; bgColor: string } => {
    const hoursUntilStart = (new Date(job.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    const availableSlots = (job.maxWorkers || 1) - (job._count?.matches || 0);
    
    if (hoursUntilStart < 2) return { text: "Gấp", color: "text-red-700", bgColor: "bg-red-100" };
    if (hoursUntilStart < 24) return { text: "Mới", color: "text-green-700", bgColor: "bg-green-100" };
    if (job.hourlyRate > 200000) return { text: "Lương cao", color: "text-orange-700", bgColor: "bg-orange-100" };
    if (availableSlots <= 1) return { text: "Sắp đầy", color: "text-yellow-700", bgColor: "bg-yellow-100" };
    return { text: "Đang tuyển", color: "text-blue-700", bgColor: "bg-blue-100" };
  };

  const filteredJobs = jobs
    .map((job) => ({
      ...job,
      distance: getJobDistance(job),
      shiftTime: getShiftTime(job.startTime),
    }))
    .filter((job) => {
      const matchesSearch =
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.business.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate =
        !selectedDate ||
        new Date(job.startTime).toDateString() === new Date(selectedDate).toDateString();

      const matchesShiftTime = selectedShiftTime === "ALL" || job.shiftTime === selectedShiftTime;

      const matchesLocation =
        !selectedLocation || job.branch?.city === selectedLocation;

      const matchesRadius =
        !userLocation ||
        !job.branch?.latitude ||
        !job.branch?.longitude ||
        (job.distance !== null && job.distance <= radius);

      const matchesCategory =
        !selectedCategory ||
        job.skillsRequired.some((skill) =>
          skill.toLowerCase().includes(selectedCategory.toLowerCase())
        );

      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((skill) => job.skillsRequired.includes(skill));

      return (
        matchesSearch &&
        matchesDate &&
        matchesShiftTime &&
        matchesLocation &&
        matchesRadius &&
        matchesCategory &&
        matchesSkills
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "salary":
          return b.hourlyRate - a.hourlyRate;
        case "soonest":
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        case "distance":
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        default:
          return 0;
      }
    });

  const getSimilarJobs = (): Job[] => {
    if (filteredJobs.length > 0) return [];
    
    return jobs
      .map((job) => ({
        ...job,
        distance: getJobDistance(job),
      }))
      .filter((job) => {
        const hasSimilarSkills = selectedSkills.length > 0 &&
          job.skillsRequired.some((skill) =>
            selectedSkills.some((selected) => skill.toLowerCase().includes(selected.toLowerCase()))
          );
        const isNearby = job.distance !== null && job.distance <= radius * 2;
        return hasSimilarSkills || isNearby;
      })
      .slice(0, 5);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubscribe = async () => {
    alert(`Đã bật thông báo cho khu vực: ${subscriptionArea || selectedLocation || "Tất cả"}`);
    setShowSubscription(false);
  };

  const allSkills = Array.from(new Set(jobs.flatMap((job) => job.skillsRequired)));
  const locations = Array.from(new Set(jobs.map((job) => job.branch?.city).filter(Boolean)));
  const similarJobs = getSimilarJobs();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50">
      {/* Header */}
      <Navbar />

      {/* Enhanced Search Bar */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Input with icon */}
              <div className="md:col-span-2 relative group">
                <div className="absolute inset-0 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm việc làm thời vụ..."
                    className="w-full px-5 py-4 pl-14 rounded-xl border-2 border-white/30 bg-white/95 backdrop-blur-sm focus:ring-4 focus:ring-orange-300 focus:border-white focus:bg-white outline-none transition-all shadow-lg text-gray-900 placeholder-gray-400"
                  />
                  <svg
                    className="w-6 h-6 text-orange-600 absolute left-5 top-1/2 transform -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Location */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-5 py-4 bg-white/95 backdrop-blur-sm rounded-xl border-2 border-white/30 focus:ring-4 focus:ring-orange-300 focus:border-white focus:bg-white outline-none transition-all shadow-lg font-medium text-gray-900"
            >
              <option value="">📍 Tất cả địa điểm</option>
              {locations.map((location) => (
                <option key={location} value={location} className="text-gray-900">
                  {location}
                </option>
              ))}
            </select>

              {/* Search Button */}
              <button
                onClick={fetchJobs}
                className="px-6 py-4 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                🔍 Tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="bg-gradient-orange bg-clip-text text-transparent">
                {filteredJobs.length}
              </span>
              <span>việc làm thời vụ đang chờ bạn</span>
            </h1>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span>🏠 Trang chủ</span>
              <span>/</span>
              <span className="text-orange-600 font-medium">Marketplace</span>
              <span>/</span>
              <span>Việc làm thời vụ</span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-md">
            <span className="text-sm text-gray-600 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium bg-white text-gray-900"
            >
              <option value="soonest">⏰ Sớm nhất</option>
              <option value="newest">🆕 Mới nhất</option>
              <option value="salary">💰 Lương cao nhất</option>
              <option value="distance">📍 Gần nhất</option>
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Enhanced Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </div>
                Bộ lọc thông minh
              </h2>

              {/* Date Filter */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  📅 Ngày làm việc
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-gray-900"
                />
              </div>

              {/* Shift Time Filter */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  ⏰ Buổi làm việc
                </label>
                <select
                  value={selectedShiftTime}
                  onChange={(e) => setSelectedShiftTime(e.target.value as ShiftTime)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-gray-900"
                >
                  <option value="ALL">🌅 Tất cả</option>
                  <option value="MORNING">🌄 Sáng (5h-12h)</option>
                  <option value="AFTERNOON">☀️ Chiều (12h-17h)</option>
                  <option value="EVENING">🌆 Tối (17h-22h)</option>
                  <option value="NIGHT">🌙 Đêm (22h-5h)</option>
                  <option value="SPLIT">🔄 Ca gãy</option>
                </select>
              </div>

              {/* Radius Filter */}
              {userLocation && (
                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    📍 Bán kính: <span className="text-orange-600">{radius}km</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1km</span>
                    <span>50km</span>
                  </div>
                </div>
              )}

              {/* Income Type Filter */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  💰 Loại thu nhập
                </label>
                <select
                  value={incomeType}
                  onChange={(e) => setIncomeType(e.target.value as IncomeType)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-gray-900"
                >
                  <option value="ALL">💵 Tất cả</option>
                  <option value="HOURLY">⏱️ Lương theo giờ</option>
                  <option value="SHIFT">📋 Lương theo ca</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  🏢 Ngành hàng
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-gray-900"
                >
                  <option value="">🎯 Tất cả</option>
                  <option value="phục vụ">🍽️ Phục vụ</option>
                  <option value="pha chế">☕ Pha chế</option>
                  <option value="bếp">👨‍🍳 Bếp</option>
                  <option value="tạp vụ">🧹 Tạp vụ</option>
                  <option value="bảo vệ">🛡️ Bảo vệ</option>
                </select>
              </div>

              {/* Skills Filter */}
              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  🎯 Kỹ năng yêu cầu
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {allSkills.slice(0, 15).map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center gap-3 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                        className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-orange-600 transition-colors">
                        {skill}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedDate ||
                selectedShiftTime !== "ALL" ||
                selectedLocation ||
                selectedCategory ||
                selectedSkills.length > 0 ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDate("");
                    setSelectedShiftTime("ALL");
                    setSelectedLocation("");
                    setSelectedCategory("");
                    setSelectedSkills([]);
                    setSearchQuery("");
                  }}
                  className="w-full py-3 text-sm font-medium text-gray-700 hover:text-orange-600 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all"
                >
                  🔄 Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Job Listings */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
                <p className="mt-6 text-gray-600 font-medium">Đang tải việc làm...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Không tìm thấy việc làm phù hợp
                </h3>
                <p className="text-gray-600 mb-8">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>

                {similarJobs.length > 0 && (
                  <div className="mt-8 text-left bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-orange-600">💡</span> Có thể bạn quan tâm:
                    </h4>
                    <div className="space-y-3">
                      {similarJobs.map((job) => {
                        const jobDistance = getJobDistance(job);
                        return (
                          <Link
                            key={job.id}
                            href={`/worker/jobs/${job.id}`}
                            className="block bg-white rounded-lg p-4 hover:shadow-md transition-all border border-gray-200 hover:border-orange-300"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-semibold text-gray-900">{job.title}</h5>
                                <p className="text-sm text-gray-600">{job.business.name}</p>
                                {jobDistance !== null && (
                                  <p className="text-xs text-orange-600 mt-1 font-medium">
                                    📍 Cách {formatDistance(jobDistance)}
                                  </p>
                                )}
                              </div>
                              <span className="text-orange-600 font-bold text-lg">
                                {formatCurrency(job.hourlyRate)}/giờ
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    🔔 Bật thông báo khi có ca mới
                  </h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Chúng tôi sẽ gửi thông báo khi có ca làm việc phù hợp tại khu vực của bạn
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subscriptionArea}
                      onChange={(e) => setSubscriptionArea(e.target.value)}
                      placeholder={selectedLocation || "Nhập khu vực..."}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={handleSubscribe}
                      className="px-6 py-3 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-bold shadow-lg"
                    >
                      Đăng ký
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredJobs.map((job) => {
                  const badge = getJobBadge(job);
                  const availableSlots = (job.maxWorkers || 1) - (job._count?.matches || 0);
                  const trustScore = job.business.rating || 0;

                  return (
                    <Link
                      key={job.id}
                      href={`/worker/jobs/${job.id}`}
                      className="block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 border-transparent hover:border-orange-200 transform hover:-translate-y-1"
                    >
                      <div className="flex gap-5">
                        {/* Enhanced Company Logo */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-2xl">
                              {job.business.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Enhanced Job Info */}
                        <div className="flex-1">
                          {/* Header with Badge */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {job.title}
                                </h3>
                                <span
                                  className={`px-3 py-1 ${badge.bgColor} ${badge.color} text-xs font-bold rounded-full shadow-sm`}
                                >
                                  {badge.text}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2 font-medium">
                                {job.business.name}
                                {job.branch?.name && ` • ${job.branch.name}`}
                              </p>
                              {trustScore > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < Math.round(trustScore)
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
                                  <span className="text-xs text-gray-600 font-medium">
                                    {trustScore.toFixed(1)} • Còn {availableSlots}/{job.maxWorkers || 1} chỗ
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Primary Info Grid */}
                          <div className="grid md:grid-cols-3 gap-4 mb-4 p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-orange-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Thời gian</p>
                                <p className="text-sm font-bold text-gray-900">
                                  {new Date(job.startTime).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  {new Date(job.startTime).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Lương/giờ</p>
                                <p className="text-lg font-bold text-orange-600">
                                  {formatCurrency(job.hourlyRate)}
                                </p>
                              </div>
                            </div>
                            {job.distance !== null && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Khoảng cách</p>
                                  <p className="text-sm font-bold text-gray-900">
                                    {formatDistance(job.distance)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Skills Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.skillsRequired.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-orange-100 hover:text-orange-700 transition-colors"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skillsRequired.length > 4 && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                +{job.skillsRequired.length - 4}
                              </span>
                            )}
                          </div>

                          {/* Enhanced Footer */}
                          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500">Tổng thu nhập</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(job.totalAmount)}
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  alert("Đã lưu ca làm việc");
                                }}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-orange-600 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all"
                              >
                                💾 Lưu ca
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.location.href = `/worker/jobs/${job.id}`;
                                }}
                                className="px-6 py-2.5 text-sm bg-gradient-orange text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              >
                                ✨ Ứng tuyển
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
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
