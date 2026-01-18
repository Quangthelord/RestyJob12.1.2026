"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { calculateDistance, formatDistance, getCurrentLocation, type Location } from "@/lib/geolocation";
import api from "@/lib/api";
import {
  UtensilsCrossed,
  ChefHat,
  Truck,
  ShoppingBag,
  Briefcase,
  HardHat,
  Globe,
  Sunrise,
  Sun,
  SunMoon,
  Moon,
  Zap,
  Calendar,
  DollarSign,
  Star,
  Filter,
  CheckCircle2,
  Flame,
  Clock,
  MapPin,
  Users,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Bell
} from "lucide-react";

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

// Filter types
type JobType = "PHUC_VU" | "BEP" | "GIAO_HANG" | "BAN_HANG" | "VAN_PHONG" | "LAO_DONG" | "ALL";
type ShiftTime = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "SPLIT" | "ALL";
type DayType = "TODAY" | "WEEKEND" | "HOLIDAY" | "ALL";
type DurationType = "2-4h" | "4-6h" | "8h+" | "ALL";
type PaymentType = "IMMEDIATE" | "WEEKLY" | "MONTHLY" | "ALL";
type ExperienceType = "NO_EXP" | "TRAINED" | "1_MONTH" | "3_MONTH" | "ALL";
type UrgencyType = "TODAY" | "24H" | "ADVANCE" | "ALL";

export default function MarketplacePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  
  // Search & Core Filters (I. CỐT LÕI)
  const [searchQuery, setSearchQuery] = useState("");
  const [jobType, setJobType] = useState<JobType>("ALL");
  const [shiftTime, setShiftTime] = useState<ShiftTime>("ALL");
  const [dayType, setDayType] = useState<DayType>("ALL");
  const [duration, setDuration] = useState<DurationType>("ALL");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [radius, setRadius] = useState<number>(5);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 200000]);

  // Advanced Filters (II. NÂNG CAO)
  const [experience, setExperience] = useState<ExperienceType>("ALL");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("ALL");
  const [ageRange, setAgeRange] = useState<string>("");

  // Trust & Experience Filters (III. TIN CẬY & TRẢI NGHIỆM)
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [noDepositRequired, setNoDepositRequired] = useState(false);
  const [urgency, setUrgency] = useState<UrgencyType>("ALL");

  // UI States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showTrustFilters, setShowTrustFilters] = useState(false);
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

  const getDayType = (startTime: string): DayType => {
    const date = new Date(startTime);
    const day = date.getDay();
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return "TODAY";
    if (day === 0 || day === 6) return "WEEKEND";
    // Check if holiday (simplified - can be improved)
    return "ALL";
  };

  const getDuration = (startTime: string, endTime: string): DurationType => {
    const hours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    if (hours >= 2 && hours < 4) return "2-4h";
    if (hours >= 4 && hours < 8) return "4-6h";
    if (hours >= 8) return "8h+";
    return "ALL";
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

  // Quick Presets
  const applyPreset = (preset: "nearby" | "highSalary" | "noExperience") => {
    setJobType("ALL");
    setShiftTime("ALL");
    setDayType("ALL");
    setDuration("ALL");
    setSelectedLocation("");
    setRadius(5);
    setExperience("ALL");
    setSelectedSkills([]);
    setPaymentType("ALL");
    setVerifiedOnly(false);
    setHighRatingOnly(false);
    setUrgency("ALL");

    switch (preset) {
      case "nearby":
        setRadius(3);
        break;
      case "highSalary":
        setSalaryRange([150000, 500000]);
        break;
      case "noExperience":
        setExperience("NO_EXP");
        break;
    }
  };

  const filteredJobs = jobs
    .map((job) => ({
      ...job,
      distance: getJobDistance(job),
      shiftTime: getShiftTime(job.startTime),
      dayType: getDayType(job.startTime),
      duration: getDuration(job.startTime, job.endTime),
      jobType: determineJobType(job),
    }))
    .filter((job) => {
      // Core Filters
      const matchesSearch =
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.business.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesJobType = jobType === "ALL" || job.jobType === jobType;
      const matchesShiftTime = shiftTime === "ALL" || job.shiftTime === shiftTime;
      const matchesDayType = dayType === "ALL" || job.dayType === dayType;
      const matchesDuration = duration === "ALL" || job.duration === duration;

      const matchesLocation =
        !selectedLocation || job.branch?.city === selectedLocation;

      const matchesRadius =
        !userLocation ||
        !job.branch?.latitude ||
        !job.branch?.longitude ||
        (job.distance !== null && job.distance <= radius);

      const matchesSalary = job.hourlyRate >= salaryRange[0] && job.hourlyRate <= salaryRange[1];

      // Advanced Filters
      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((skill) => job.skillsRequired.includes(skill));

      // Trust Filters
      const matchesVerified = !verifiedOnly || true; // TODO: Add verification field to Job model
      const matchesRating = !highRatingOnly || (job.business.rating && job.business.rating >= 4.5);

      const hoursUntilStart = (new Date(job.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
      const matchesUrgency =
        urgency === "ALL" ||
        (urgency === "TODAY" && hoursUntilStart < 24 && hoursUntilStart >= 0) ||
        (urgency === "24H" && hoursUntilStart >= 0 && hoursUntilStart < 24) ||
        (urgency === "ADVANCE" && hoursUntilStart >= 24);

      return (
        matchesSearch &&
        matchesJobType &&
        matchesShiftTime &&
        matchesDayType &&
        matchesDuration &&
        matchesLocation &&
        matchesRadius &&
        matchesSalary &&
        matchesSkills &&
        matchesVerified &&
        matchesRating &&
        matchesUrgency
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

  const determineJobType = (job: Job): JobType => {
    const titleLower = job.title.toLowerCase();
    const descLower = job.description.toLowerCase();
    const skillsLower = job.skillsRequired.join(" ").toLowerCase();

    if (titleLower.includes("phục vụ") || titleLower.includes("thu ngân") || skillsLower.includes("phục vụ")) {
      return "PHUC_VU";
    }
    if (titleLower.includes("bếp") || titleLower.includes("nấu") || skillsLower.includes("bếp")) {
      return "BEP";
    }
    if (titleLower.includes("giao hàng") || titleLower.includes("shipper")) {
      return "GIAO_HANG";
    }
    if (titleLower.includes("bán hàng") || titleLower.includes("pg") || titleLower.includes("event")) {
      return "BAN_HANG";
    }
    if (titleLower.includes("văn phòng") || titleLower.includes("admin")) {
      return "VAN_PHONG";
    }
    return "LAO_DONG";
  };

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

  const clearAllFilters = () => {
    setSearchQuery("");
    setJobType("ALL");
    setShiftTime("ALL");
    setDayType("ALL");
    setDuration("ALL");
    setSelectedLocation("");
    setRadius(5);
    setSalaryRange([0, 200000]);
    setExperience("ALL");
    setSelectedSkills([]);
    setPaymentType("ALL");
    setVerifiedOnly(false);
    setHighRatingOnly(false);
    setNoDepositRequired(false);
    setUrgency("ALL");
  };

  const allSkills = Array.from(new Set(jobs.flatMap((job) => job.skillsRequired)));
  const locations = Array.from(new Set(jobs.map((job) => job.branch?.city).filter(Boolean)));
  const similarJobs = getSimilarJobs();
  const today = new Date().toISOString().split("T")[0];
  const hasActiveFilters = jobType !== "ALL" || shiftTime !== "ALL" || dayType !== "ALL" || 
    duration !== "ALL" || selectedLocation || salaryRange[0] !== 0 || salaryRange[1] !== 200000 ||
    experience !== "ALL" || selectedSkills.length > 0 || paymentType !== "ALL" ||
    verifiedOnly || highRatingOnly || noDepositRequired || urgency !== "ALL";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50">
      {/* Header */}
      <Navbar />

      {/* Enhanced Search Bar with Presets */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search Input */}
              <div className="md:col-span-2 relative group">
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

              {/* Location */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-5 py-4 bg-white/95 backdrop-blur-sm rounded-xl border-2 border-white/30 focus:ring-4 focus:ring-orange-300 focus:border-white outline-none transition-all shadow-lg font-medium text-gray-900"
              >
                <option value="">Tất cả địa điểm</option>
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

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => applyPreset("nearby")}
                className="px-4 py-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium text-gray-700 hover:text-orange-600 transition-all"
              >
                <MapPin className="w-4 h-4 inline-block mr-1" strokeWidth={2} />
                Việc gần tôi
              </button>
              <button
                onClick={() => applyPreset("highSalary")}
                className="px-4 py-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium text-gray-700 hover:text-orange-600 transition-all"
              >
                <DollarSign className="w-4 h-4 inline-block mr-1" strokeWidth={2} />
                Lương cao hôm nay
              </button>
              <button
                onClick={() => applyPreset("noExperience")}
                className="px-4 py-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium text-gray-700 hover:text-orange-600 transition-all"
              >
                <Sparkles className="w-4 h-4 inline-block mr-1" strokeWidth={2} />
                Không cần kinh nghiệm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="bg-gradient-orange bg-clip-text text-transparent">
                {filteredJobs.length}
              </span>
              <span>việc làm thời vụ đang chờ bạn</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-md">
            <span className="text-sm text-gray-600 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium bg-white text-gray-900"
            >
              <option value="soonest">Sớm nhất</option>
              <option value="newest">Mới nhất</option>
              <option value="salary">Lương cao nhất</option>
              <option value="distance">Gần nhất</option>
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Enhanced Filter Sidebar - 3 Tiers */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center">
                  <Filter className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                Bộ lọc thông minh
              </h2>

              {/* I. CỐT LÕI - Core Filters */}
              <div className="mb-6 pb-6 border-b-2 border-gray-100">
                <h3 className="text-sm font-bold text-orange-600 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-orange-600 text-orange-600" strokeWidth={1.5} />
                  CỐT LÕI
                </h3>

                {/* 1. Loại công việc */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" strokeWidth={1.5} />
                    Loại công việc
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "ALL", label: "Tất cả", Icon: Globe },
                      { value: "PHUC_VU", label: "Phục vụ / Thu ngân", Icon: UtensilsCrossed },
                      { value: "BEP", label: "Bếp / Phụ bếp", Icon: ChefHat },
                      { value: "GIAO_HANG", label: "Giao hàng", Icon: Truck },
                      { value: "BAN_HANG", label: "Bán hàng / PG", Icon: ShoppingBag },
                      { value: "VAN_PHONG", label: "Văn phòng", Icon: Briefcase },
                      { value: "LAO_DONG", label: "Lao động phổ thông", Icon: HardHat },
                    ].map((type) => {
                      const IconComponent = type.Icon
                      return (
                      <button
                        key={type.value}
                        onClick={() => setJobType(type.value as JobType)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                          jobType === type.value
                            ? "bg-orange-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" strokeWidth={1.5} />
                        {type.label}
                      </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Thời gian làm việc */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" strokeWidth={1.5} />
                    Thời gian
                  </label>
                  
                  {/* Theo ca */}
                  <div className="mb-2">
                    <span className="text-xs text-gray-600">Theo ca:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[
                        { value: "ALL", label: "Tất cả", Icon: Globe },
                        { value: "MORNING", label: "Sáng", Icon: Sunrise },
                        { value: "AFTERNOON", label: "Chiều", Icon: Sun },
                        { value: "EVENING", label: "Tối", Icon: SunMoon },
                        { value: "NIGHT", label: "Đêm", Icon: Moon },
                      ].map((shift) => {
                        const IconComponent = shift.Icon
                        return (
                        <button
                          key={shift.value}
                          onClick={() => setShiftTime(shift.value as ShiftTime)}
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                            shiftTime === shift.value
                              ? "bg-orange-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <IconComponent className="w-3 h-3" strokeWidth={1.5} />
                          {shift.label}
                        </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Theo ngày */}
                  <div className="mb-2">
                    <span className="text-xs text-gray-600">Theo ngày:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[
                        { value: "ALL", label: "Tất cả" },
                        { value: "TODAY", label: "Hôm nay" },
                        { value: "WEEKEND", label: "Cuối tuần" },
                        { value: "HOLIDAY", label: "Lễ/Tết" },
                      ].map((day) => (
                        <button
                          key={day.value}
                          onClick={() => setDayType(day.value as DayType)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            dayType === day.value
                              ? "bg-orange-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thời lượng */}
                  <div>
                    <span className="text-xs text-gray-600">Thời lượng:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[
                        { value: "ALL", label: "Tất cả" },
                        { value: "2-4h", label: "2-4h" },
                        { value: "4-6h", label: "4-6h" },
                        { value: "8h+", label: "8h+" },
                      ].map((dur) => (
                        <button
                          key={dur.value}
                          onClick={() => setDuration(dur.value as DurationType)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            duration === dur.value
                              ? "bg-orange-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Địa điểm */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    Địa điểm
                  </label>
                  {userLocation && (
                    <div className="mb-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Khoảng cách: <span className="text-orange-600 font-bold">{radius}km</span>
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
                        <span>≤1km</span>
                        <span>≤3km</span>
                        <span>≤5km</span>
                        <span>50km</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Mức lương */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline-block mr-1" strokeWidth={1.5} />
                    Mức lương (VNĐ/giờ)
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{formatCurrency(salaryRange[0])}</span>
                      <span>{formatCurrency(salaryRange[1])}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: "<30k", max: 30000 },
                        { label: "30-40k", min: 30000, max: 40000 },
                        { label: "40-60k", min: 40000, max: 60000 },
                        { label: "60k+", min: 60000 },
                      ].map((range) => (
                        <button
                          key={range.label}
                          onClick={() => {
                            setSalaryRange([
                              range.min || 0,
                              range.max || 500000,
                            ]);
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            salaryRange[0] === (range.min || 0) && salaryRange[1] === (range.max || 500000)
                              ? "bg-orange-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* II. NÂNG CAO - Advanced Filters */}
              <div className="mb-6 pb-6 border-b-2 border-gray-100">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2">
                    🔧 NÂNG CAO
                  </h3>
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      showAdvancedFilters ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAdvancedFilters && (
                  <div className="space-y-4">
                    {/* Yêu cầu kinh nghiệm */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">📚 Kinh nghiệm</label>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { value: "ALL", label: "Tất cả" },
                          { value: "NO_EXP", label: "Không cần" },
                          { value: "TRAINED", label: "Có đào tạo" },
                          { value: "1_MONTH", label: "≥1 tháng" },
                          { value: "3_MONTH", label: "≥3 tháng" },
                        ].map((exp) => (
                          <button
                            key={exp.value}
                            onClick={() => setExperience(exp.value as ExperienceType)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              experience === exp.value
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {exp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kỹ năng yêu cầu */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">🎯 Kỹ năng</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {allSkills.slice(0, 10).map((skill) => (
                          <label
                            key={skill}
                            className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSkills.includes(skill)}
                              onChange={() => toggleSkill(skill)}
                              className="w-4 h-4 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="text-xs text-gray-700">{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Hình thức trả lương */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">💵 Hình thức trả</label>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { value: "ALL", label: "Tất cả" },
                        { value: "IMMEDIATE", label: "Trả ngay", Icon: Zap },
                        { value: "WEEKLY", label: "Theo tuần", Icon: Calendar },
                        { value: "MONTHLY", label: "Theo tháng", Icon: DollarSign },
                        ].map((pay) => {
                          const IconComponent = pay.Icon
                          return (
                          <button
                            key={pay.value}
                            onClick={() => setPaymentType(pay.value as PaymentType)}
                            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                              paymentType === pay.value
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {IconComponent && <IconComponent className="w-3 h-3" strokeWidth={1.5} />}
                            {pay.label}
                          </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* III. TIN CẬY & TRẢI NGHIỆM - Trust Filters */}
              <div className="mb-6">
                <button
                  onClick={() => setShowTrustFilters(!showTrustFilters)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h3 className="text-sm font-bold text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                    TIN CẬY & TRẢI NGHIỆM
                  </h3>
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      showTrustFilters ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showTrustFilters && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500"
                      />
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" strokeWidth={1.5} />
                      <span className="text-xs text-gray-700">Đã xác minh</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highRatingOnly}
                        onChange={(e) => setHighRatingOnly(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500"
                      />
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
                      <span className="text-xs text-gray-700">Rating 4.5+</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noDepositRequired}
                        onChange={(e) => setNoDepositRequired(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500"
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-green-600" strokeWidth={1.5} />
                      <span className="text-xs text-gray-700">Không yêu cầu đặt cọc</span>
                    </label>

                    {/* Mức độ gấp */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
                        Mức độ gấp
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { value: "ALL", label: "Tất cả" },
                          { value: "TODAY", label: "Hôm nay", Icon: Flame },
                          { value: "24H", label: "24h", Icon: Zap },
                          { value: "ADVANCE", label: "Đặt lịch", Icon: Calendar },
                        ].map((urg) => {
                          const IconComponent = urg.Icon
                          return (
                          <button
                            key={urg.value}
                            onClick={() => setUrgency(urg.value as UrgencyType)}
                            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                              urgency === urg.value
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {IconComponent && <IconComponent className="w-3 h-3" strokeWidth={1.5} />}
                            {urg.label}
                          </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="w-full py-3 text-sm font-medium text-gray-700 hover:text-orange-600 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all"
                >
                  🔄 Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
                <p className="mt-6 text-gray-600 font-medium">Đang tải việc làm...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Không tìm thấy việc làm phù hợp</h3>
                <p className="text-gray-600 mb-8">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>

                {similarJobs.length > 0 && (
                  <div className="mt-8 text-left bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
                      Có thể bạn quan tâm:
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
                                    <MapPin className="w-3 h-3 inline-block mr-1 text-orange-600" strokeWidth={1.5} />
                                    Cách {formatDistance(jobDistance)}
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
                    <Bell className="w-4 h-4 text-orange-600" strokeWidth={1.5} />
                    Bật thông báo khi có ca mới
                  </h4>
                  <p className="text-sm text-gray-700 mb-4">Chúng tôi sẽ gửi thông báo khi có ca làm việc phù hợp tại khu vực của bạn</p>
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
              <div className="space-y-4">
                {filteredJobs.map((job) => {
                  const badge = getJobBadge(job);
                  const jobDistance = job.distance;

                  return (
                    <Link
                      key={job.id}
                      href={`/worker/jobs/${job.id}`}
                      className="block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:border-orange-300 overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bgColor} ${badge.color}`}>
                                {badge.text}
                              </span>
                              {job.business.rating && job.business.rating >= 4.5 && (
                                <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
                                  <span>{job.business.rating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{job.business.name} • {job.branch.name}</p>
                            <p className="text-sm text-gray-500">{job.branch.address}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">⏰</span>
                            <div>
                              <p className="text-xs text-gray-500">Thời gian</p>
                              <p className="text-sm font-semibold text-gray-900">{formatDateTime(job.startTime)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
                            <div>
                              <p className="text-xs text-gray-500">Lương/giờ</p>
                              <p className="text-sm font-semibold text-orange-600">{formatCurrency(job.hourlyRate)}</p>
                            </div>
                          </div>
                          {jobDistance !== null && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
                              <div>
                                <p className="text-xs text-gray-500">Khoảng cách</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDistance(jobDistance)}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">👥</span>
                            <div>
                              <p className="text-xs text-gray-500">Vị trí còn</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {(job.maxWorkers || 1) - (job._count?.matches || 0)}/{job.maxWorkers || 1}
                              </p>
                            </div>
                          </div>
                        </div>

                        {job.skillsRequired.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.skillsRequired.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skillsRequired.length > 4 && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                +{job.skillsRequired.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Tổng ca: {formatCurrency(job.totalAmount)}</span>
                          <button className="px-6 py-2 bg-gradient-orange text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg">
                            Xem chi tiết →
                          </button>
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
    </div>
  );
}
