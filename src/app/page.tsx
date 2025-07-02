"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Activity, Users, ArrowRight, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

// Map компонентыг dynamic import хийх
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

  useEffect(() => {
    if (streamName !== "health") return;

    let eventSource: EventSource | null = null;

    const connectStream = () => {
      try {
        eventSource = new EventSource("/api/health?stream=true");

        eventSource.onopen = () => {
          setIsConnected(true);
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

        eventSource.onerror = () => {
          setIsConnected(false);
          setTimeout(connectStream, 5000);
        };
      } catch (connectError) {
        console.error("Stream холболт алдаа:", connectError);
      }
    };

    connectStream();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [streamName]);

  return { data, isConnected };
}

export default function HomePage() {
  const router = useRouter();
  const { data: healthData, isConnected } = useStream("health");
  const [mapLoaded, setMapLoaded] = useState(false);

  // GPS координаттай хэрэглэгчдийг шүүх
  const usersWithLocation = healthData.filter(
    (user) => user.latitude && user.longitude
  );

  useEffect(() => {
    setMapLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header Section */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <Heart className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🏥 Health Monitor
            </h1>
            <p className="text-xl text-gray-600">
              Real-Time Health Data Monitoring System
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{healthData.length} идэвхтэй хэрэглэгч</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{usersWithLocation.length} GPS-тэй хэрэглэгч</span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              {isConnected ? "Live" : "Offline"}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Heart Rate</h3>
              <p className="text-sm text-gray-600">
                Real-time зүрхний цохилт мониторинг
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <Activity className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Activity</h3>
              <p className="text-sm text-gray-600">
                Алхамын тоо, батарей мониторинг
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Multi-User</h3>
              <p className="text-sm text-gray-600">
                50 хэрэглэгч хүртэл дэмжлэг
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-center mb-12">
            <button
              onClick={() => router.push("/health")}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 Dashboard руу очих
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>

            <button
              onClick={() => router.push("/map")}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              🗺️ GPS Зураг харах
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        {/* Live Map Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              🗺️ Live GPS Map
            </h2>
            <p className="text-gray-600 mt-2">
              Хэрэглэгчдийн real-time байршил харуулж байна
            </p>
          </div>

          <div className="h-96">
            {mapLoaded && typeof window !== "undefined" ? (
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
                        <div className="p-3 min-w-[200px]">
                          <h3 className="font-semibold text-lg mb-2">
                            {user.userName || user.userId}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div>❤️ {user.heartRate} bpm</div>
                            <div>
                              👟 {user.stepCount?.toLocaleString()} алхам
                            </div>
                            <div>🔋 {user.battery}%</div>
                            <div className="text-xs text-gray-500 mt-2">
                              📍 {user.latitude?.toFixed(4)},{" "}
                              {user.longitude?.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    Газрын зураг ачааллаж байна...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Map Footer */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>📍 {usersWithLocation.length} хэрэглэгч GPS-тэй</span>
              <span className="text-xs">
                Дэлгэрэнгүй харахын тулд /map хуудас руу очино уу
              </span>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">
            💡 Flutter app дээрээс{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              POST /api/health
            </code>{" "}
            руу дата илгээнэ үү
          </p>
          <p className="text-xs mt-2">
            📱 Samsung Galaxy Fit 3 болон бусад BLE төхөөрөмжтэй ажиллана
          </p>
        </div>
      </div>
    </div>
  );
}
