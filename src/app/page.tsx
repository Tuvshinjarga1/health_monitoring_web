"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Activity, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // 3 секундын дараа автоматаар health dashboard руу шилжих
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/health");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleManualRedirect = () => {
    router.push("/health");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
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
            <p className="text-sm text-gray-600">50 хэрэглэгч хүртэл дэмжлэг</p>
          </div>
        </div>

        {/* Redirect Info */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
            <span className="text-blue-800 font-medium">
              Health Dashboard руу шилжиж байна...
            </span>
          </div>
          <p className="text-blue-700 text-sm">
            3 секундын дараа автоматаар нээгдэнэ
          </p>
        </div>

        {/* Manual Button */}
        <button
          onClick={handleManualRedirect}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Dashboard руу очих
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>

        {/* Quick Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            💡 Flutter app дээрээс{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              POST /api/health
            </code>{" "}
            руу дата илгээнэ үү
          </p>
          <p className="mt-2">
            📱 Samsung Galaxy Fit 3 болон бусад BLE төхөөрөмжтэй ажиллана
          </p>
        </div>
      </div>
    </div>
  );
}
