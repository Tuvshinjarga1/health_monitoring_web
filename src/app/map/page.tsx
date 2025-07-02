"use client";

import { useState, useEffect } from "react";
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

// Dynamic Map Component
function DynamicMap({ healthData }: { healthData: HealthData[] }) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    // Leaflet-ийг динамик ачаалах
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;

      try {
        // Leaflet CSS нэмэх
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Leaflet library ачаалах
        const L = await import("leaflet");

        // Default markers засах
        delete (L as any).Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        setLeafletLoaded(true);

        // Map үүсгэх
        if (!mapInstance) {
          const map = L.map("map").setView([47.9184, 106.9177], 10);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);

          setMapInstance(map);
        }
      } catch (error) {
        console.error("Leaflet ачаалахад алдаа:", error);
      }
    };

    loadLeaflet();
  }, [mapInstance]);

  // Markers шинэчлэх
  useEffect(() => {
    if (!leafletLoaded || !mapInstance) return;

    const loadMarkers = async () => {
      const L = await import("leaflet");

      // Хуучин markers устгах
      mapInstance.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          mapInstance.removeLayer(layer);
        }
      });

      // GPS координаттай хэрэглэгчдийг шүүх
      const usersWithLocation = healthData.filter(
        (user) => user.latitude && user.longitude
      );

      // Шинэ markers нэмэх
      usersWithLocation.forEach((user) => {
        if (!user.latitude || !user.longitude) return;

        const marker = L.marker([user.latitude, user.longitude]).addTo(
          mapInstance
        );

        const popupContent = `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; font-weight: bold; display: flex; align-items: center; gap: 5px;">
              👤 ${user.userName || user.userId}
            </h3>
            <div style="font-size: 14px; line-height: 1.5;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>❤️ Зүрхний цохилт:</span>
                <strong style="color: ${getHeartRateColor(user.heartRate)};">${
          user.heartRate
        } bpm</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>👟 Алхам:</span>
                <strong style="color: #10B981;">${user.stepCount?.toLocaleString()}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>🔋 Батарей:</span>
                <strong style="color: ${getBatteryColor(user.battery)};">${
          user.battery
        }%</strong>
              </div>
              <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">
              <div style="font-size: 12px; color: #666;">
                <div>📱 ${user.deviceName || "Тодорхойгүй төхөөрөмж"}</div>
                <div>⏰ ${user.timeLabel || "Цаг тодорхойгүй"}</div>
                <div>📍 ${user.latitude?.toFixed(4)}, ${user.longitude?.toFixed(
          4
        )}</div>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
      });
    };

    loadMarkers();
  }, [leafletLoaded, mapInstance, healthData]);

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

  return (
    <div className="relative h-full">
      <div id="map" className="w-full h-full"></div>
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Газрын зураг ачааллаж байна...</p>
          </div>
        </div>
      )}
    </div>
  );
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

  // GPS координаттай хэрэглэгчдийг шүүх
  const usersWithLocation = healthData.filter(
    (user) => user.latitude && user.longitude
  );

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
        <DynamicMap healthData={healthData} />
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
