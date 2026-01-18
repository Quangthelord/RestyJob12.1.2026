"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

const notifications = [
  "Anh Minh vừa tìm được 2 nhân viên phục vụ tại Quận 1",
  "Chị Lan đã nhận ca làm việc tại Nhà hàng ABC",
  "3 doanh nghiệp mới đăng ca làm việc trong 10 phút qua",
  "Hơn 50 người lao động đang tìm việc trong khu vực của bạn",
  "Ca làm việc tại Quận 3 đã được khớp thành công",
];

export default function LiveNotification() {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification after 3 seconds
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    // Rotate notifications every 8 seconds
    const rotateTimer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentNotification((prev) => (prev + 1) % notifications.length);
        setIsVisible(true);
      }, 500);
    }, 8000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(rotateTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border-l-4 border-orange-600 p-4 max-w-sm z-50 transform transition-all duration-500 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-600 animate-pulse" strokeWidth={2} />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {notifications[currentNotification]}
          </p>
          <p className="text-xs text-gray-500 mt-1">Vừa xong</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}



