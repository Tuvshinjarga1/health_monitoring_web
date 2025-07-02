"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Heart,
  Activity,
  Battery,
  Users,
  ArrowLeft,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Leaflet-ийг client-side дээр ачааллах
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

// Health дата interface
interface HealthData {
  userId: string;
  heartRate: number;
  stepCount: number;
  battery: number;
  timestamp: string;
  userName?: string;
  timeLabel?: string;
  dateLabel?: string;
  deviceName?: string;
  latitude?: number;
  longitude?: number;
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
              setData(streamData.data || []);
            } else if (streamData.type === "update") {
              const newHealthData = streamData.data;
              setData((prevData) => {
                const updatedData = prevData.filter(
                  (item) => item.userId !== newHealthData.userId
                );
                return [...updatedData, newHealthData].slice(-50);
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

export default function MapPage() {
  const router = useRouter();
  const { data: healthData, isConnected, error } = useStream("health");
  const [mapLoaded, setMapLoaded] = useState(false);

  // GPS координаттай хэрэглэгчдийг шүүх
  const usersWithLocation = healthData.filter(
    (user) => user.latitude && user.longitude
  );

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  // Heart rate өнгө тодорхойлох
  const getHeartRateColor = (hr: number) => {
    if (hr < 60) return "#3B82F6"; // blue
    if (hr <= 100) return "#10B981"; // green
    if (hr <= 150) return "#F59E0B"; // orange
    return "#EF4444"; // red
  };

  // Battery өнгө тодорхойлох
  const getBatteryColor = (battery: number) => {
    if (battery > 50) return "#10B981"; // green
    if (battery > 20) return "#F59E0B"; // orange
    return "#EF4444"; // red
  };

  if (!mapLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Газрын зураг ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Буцах
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                🗺️ GPS Байршлын Зураг
              </h1>
              <p className="text-gray-600">
                Хэрэглэгчдийн реал тайм байршил болон эрүүл мэндийн мэдээлэл
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
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
              {isConnected ? "Live" : "Disconnected"}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Нийт: {healthData.length} хэрэглэгч</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>GPS-тэй: {usersWithLocation.length} хэрэглэгч</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">📍 Монгол улсын төв бүс</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-800">❌ {error}</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="h-[calc(100vh-200px)]">
        {typeof window !== "undefined" && (
          <MapContainer
            center={[47.9184, 106.9177]} // Улаанбаатарын координат
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* User markers */}
            {usersWithLocation.map((user) => {
              if (!user.latitude || !user.longitude) return null;

              return (
                <Marker
                  key={user.userId}
                  position={[user.latitude, user.longitude]}
                >
                  <Popup>
                    <div className="p-3 min-w-[250px]">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {user.userName || user.userId}
                      </h3>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            Зүрхний цохилт:
                          </span>
                          <span
                            className="font-semibold"
                            style={{ color: getHeartRateColor(user.heartRate) }}
                          >
                            {user.heartRate} bpm
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            Алхам:
                          </span>
                          <span className="font-semibold text-green-600">
                            {user.stepCount?.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Battery className="w-4 h-4 text-blue-500" />
                            Батарей:
                          </span>
                          <span
                            className="font-semibold"
                            style={{ color: getBatteryColor(user.battery) }}
                          >
                            {user.battery}%
                          </span>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="text-xs text-gray-500">
                            <div>
                              📱 {user.deviceName || "Тодорхойгүй төхөөрөмж"}
                            </div>
                            <div>⏰ {user.timeLabel || "Цаг тодорхойгүй"}</div>
                            <div>
                              📍 {user.latitude?.toFixed(4)},{" "}
                              {user.longitude?.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* No GPS Data Message */}
      {usersWithLocation.length === 0 && healthData.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm">
          <p className="text-yellow-800 text-sm">
            📍 GPS мэдээлэлтэй хэрэглэгч одоогоор байхгүй байна. Flutter app
            дээрээс GPS зөвшөөрөл өгөөд дахин оролдоно уу.
          </p>
        </div>
      )}
    </div>
  );
}
