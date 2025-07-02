"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  Activity,
  Battery,
  User,
  Clock,
  Users,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// Health дата interface
interface HealthData {
  userId: string;
  heartRate: number;
  stepCount: number;
  battery: number;
  timestamp: string;
  userName?: string; // Хэрэглэгчийн нэр
  timeLabel?: string; // Цагны нэр (HH:MM:SS)
  dateLabel?: string; // Өдрийн нэр (YYYY-MM-DD)
  deviceName?: string; // Төхөөрөмжийн нэр
  latitude?: number; // GPS координат - өргөрөг
  longitude?: number; // GPS координат - уртраг
}

// useStream hook
function useStream(streamName: string) {
  const [data, setData] = useState<HealthData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (streamName !== "health") return;

    let eventSource: EventSource | null = null;

    const connectStream = () => {
      try {
        eventSource = new EventSource("/api/health?stream=true");

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log("🔗 Health stream холбогдлоо");
        };

        eventSource.onmessage = (event) => {
          try {
            const streamData = JSON.parse(event.data);

            if (streamData.type === "initial") {
              // Эхний дата
              setData(streamData.data || []);
            } else if (streamData.type === "update") {
              // Шинэ дата шинэчлэх
              const newHealthData = streamData.data;
              setData((prevData) => {
                const updatedData = prevData.filter(
                  (item) => item.userId !== newHealthData.userId
                );
                return [...updatedData, newHealthData].slice(-50); // Максимум 50 хэрэглэгч
              });
            }
          } catch (parseError) {
            console.error("Stream дата parse алдаа:", parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error("Stream алдаа:", error);
          setIsConnected(false);
          setError("Stream холболт тасарсан");

          // 5 секундын дараа дахин холбох
          setTimeout(connectStream, 5000);
        };
      } catch (connectError) {
        console.error("Stream холболт алдаа:", connectError);
        setError("Stream холбогдож чадсангүй");
      }
    };

    connectStream();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [streamName]);

  return { data, isConnected, error };
}

export default function HealthDashboard() {
  const router = useRouter();
  const { data: healthData, isConnected, error } = useStream("health");
  const [sortBy, setSortBy] = useState<
    "userId" | "heartRate" | "timestamp" | "userName"
  >("timestamp");

  // GPS координаттай хэрэглэгчдийн тоо
  const usersWithGPS = healthData.filter(
    (user) => user.latitude && user.longitude
  ).length;

  // Дата эрэмбэлэх
  const sortedData = [...healthData].sort((a, b) => {
    if (sortBy === "timestamp") {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else if (sortBy === "heartRate") {
      return b.heartRate - a.heartRate;
    } else if (sortBy === "userName") {
      const nameA = a.userName || "Хэрэглэгч";
      const nameB = b.userName || "Хэрэглэгч";
      return nameA.localeCompare(nameB);
    } else {
      return a.userId.localeCompare(b.userId);
    }
  });

  // Heart rate өнгө тодорхойлох
  const getHeartRateColor = (hr: number) => {
    if (hr < 60) return "text-blue-600";
    if (hr <= 100) return "text-green-600";
    if (hr <= 150) return "text-orange-600";
    return "text-red-600";
  };

  // Battery өнгө тодорхойлох
  const getBatteryColor = (battery: number) => {
    if (battery > 50) return "text-green-600";
    if (battery > 20) return "text-orange-600";
    return "text-red-600";
  };

  // Цаг форматлах
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "HH:mm:ss");
    } catch {
      return "Invalid time";
    }
  };

  // Огноо форматлах
  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "yyyy-MM-dd");
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                🏥 Health Monitor Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Реал тайм health дата мониторинг систем - Хүснэгт харах
              </p>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* Map button */}
              <button
                onClick={() => router.push("/map")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                GPS Зураг
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Connection Status */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  isConnected
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                {isConnected ? "Stream Active" : "Disconnected"}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{healthData.length} идэвхтэй хэрэглэгч</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{usersWithGPS} GPS-тэй хэрэглэгч</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Хамгийн ихдээр 50 хэрэглэгч</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Sort Controls */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Эрэмбэлэх:</span>
          <div className="flex gap-2">
            {[
              { key: "timestamp", label: "Цаг" },
              { key: "heartRate", label: "Зүрхний цохилт" },
              { key: "userName", label: "Хэрэглэгчийн нэр" },
              { key: "userId", label: "User ID" },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortBy === option.key
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Health Data Table */}
        {sortedData.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Дата хүлээж байна
            </h3>
            <p className="text-gray-500">
              Flutter app-аас health дата ирэхийг хүлээж байна...
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Хэрэглэгч
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Зүрхний цохилт
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Алхах тоо
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Battery className="w-4 h-4" />
                        Батарей
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Цаг/Огноо
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        GPS Байршил
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map((user, index) => (
                    <tr
                      key={user.userId}
                      className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-25"
                      }`}
                    >
                      {/* User ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.userName || "Хэрэглэгч"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.deviceName && `📱 ${user.deviceName}`}
                              {user.deviceName && <br />}
                              ID: {user.userId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Heart Rate */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-bold ${getHeartRateColor(
                              user.heartRate
                            )}`}
                          >
                            {user.heartRate}
                          </span>
                          <span className="text-xs text-gray-500">bpm</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.heartRate < 60
                            ? "Удаан"
                            : user.heartRate <= 100
                            ? "Хэвийн"
                            : user.heartRate <= 150
                            ? "Хурдан"
                            : "Маш хурдан"}
                        </div>
                      </td>

                      {/* Step Count */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-purple-600">
                            {user.stepCount.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">алхам</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.stepCount >= 10000
                            ? "Маш сайн"
                            : user.stepCount >= 5000
                            ? "Сайн"
                            : "Хангалтгүй"}
                        </div>
                      </td>

                      {/* Battery */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-bold ${getBatteryColor(
                              user.battery
                            )}`}
                          >
                            {user.battery}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.battery > 50
                            ? "Дүүрэн"
                            : user.battery > 20
                            ? "Дууссан"
                            : "Маш дууссан"}
                        </div>
                        {/* Battery bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              user.battery > 50
                                ? "bg-green-500"
                                : user.battery > 20
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${user.battery}%` }}
                          ></div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.timeLabel || formatTime(user.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.dateLabel || formatDate(user.timestamp)}
                        </div>
                      </td>

                      {/* GPS Coordinates */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.latitude && user.longitude
                            ? `${user.latitude.toFixed(
                                6
                              )}, ${user.longitude.toFixed(6)}`
                            : "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Нийт <span className="font-medium">{sortedData.length}</span>{" "}
                  хэрэглэгч
                </div>
                <div className="text-xs text-gray-500">
                  Сүүлд шинэчлэгдсэн: {new Date().toLocaleString("mn-MN")}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">
            💡 Flutter app дээрээс{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              POST /api/health
            </code>{" "}
            руу дата илгээнэ үү
          </p>
          <p className="text-xs mt-2">
            userId, heartRate, stepCount, battery, timestamp шаардлагатай
          </p>
        </div>
      </div>
    </div>
  );
}
