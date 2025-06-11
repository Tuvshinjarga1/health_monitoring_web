import { NextRequest, NextResponse } from "next/server";

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
}

// Health дата хадгалах Map (максимум 50 хэрэглэгч)
const healthDataMap = new Map<string, HealthData>();

// Stream clients
const streamClients = new Set<ReadableStreamDefaultController>();

// Stream handler
function createStreamHandler() {
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      streamClients.add(controller);

      // Эхний дата илгээх
      const currentData = Array.from(healthDataMap.values());
      controller.enqueue(
        `data: ${JSON.stringify({
          type: "initial",
          data: currentData,
        })}\n\n`
      );
    },
    cancel() {
      streamClients.delete(controller);
    },
  });

  return stream;
}

// Бүх stream clients руу дата илгээх
function broadcastToStreams(data: HealthData) {
  const message = `data: ${JSON.stringify({
    type: "update",
    data: data,
  })}\n\n`;

  streamClients.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch (error) {
      console.error("Stream илгээхэд алдаа:", error);
      streamClients.delete(controller);
    }
  });
}

// POST endpoint - Health дата хүлээн авах
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      heartRate,
      stepCount,
      battery,
      timestamp,
      userName,
      timeLabel,
      dateLabel,
      deviceName,
    } = body;

    // Validation
    if (
      !userId ||
      typeof heartRate !== "number" ||
      typeof stepCount !== "number" ||
      typeof battery !== "number" ||
      !timestamp
    ) {
      return NextResponse.json(
        {
          error:
            "userId, heartRate, stepCount, battery, timestamp шаардлагатай",
        },
        { status: 400 }
      );
    }

    // Battery level хязгаарлах
    const validBattery = Math.min(Math.max(battery, 0), 100);

    const healthData: HealthData = {
      userId: String(userId),
      heartRate: Number(heartRate),
      stepCount: Number(stepCount),
      battery: validBattery,
      timestamp: String(timestamp),
      userName: userName ? String(userName) : undefined,
      timeLabel: timeLabel ? String(timeLabel) : undefined,
      dateLabel: dateLabel ? String(dateLabel) : undefined,
      deviceName: deviceName ? String(deviceName) : undefined,
    };

    // Дата хадгалах
    healthDataMap.set(healthData.userId, healthData);

    // Хэрэв 50-аас илүү хэрэглэгч байвал хамгийн хуучин устгах
    if (healthDataMap.size > 50) {
      const firstKey = healthDataMap.keys().next().value;
      if (firstKey) {
        healthDataMap.delete(firstKey);
      }
    }

    console.log(
      `📊 Health data хүлээн авлаа: ${
        healthData.userName || healthData.userId
      } (${healthData.deviceName || "Unknown"}) - HR: ${
        healthData.heartRate
      }, Steps: ${healthData.stepCount}, Battery: ${healthData.battery}% [${
        healthData.timeLabel || "No time"
      }]`
    );

    // Stream clients руу дата илгээх
    broadcastToStreams(healthData);

    return NextResponse.json({
      success: true,
      message: "Health дата амжилттай хадгалагдлаа",
      data: healthData,
    });
  } catch (error) {
    console.error("Health дата process алдаа:", error);
    return NextResponse.json(
      {
        error: "Серверийн алдаа",
      },
      { status: 500 }
    );
  }
}

// GET endpoint - Одоогийн дата буцаах эсвэл stream үүсгэх
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isStream = searchParams.get("stream") === "true";

  if (isStream) {
    // Server-Sent Events stream үүсгэх
    const stream = createStreamHandler();

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } else {
    // Одоогийн бүх дата буцаах
    const currentData = Array.from(healthDataMap.values());
    return NextResponse.json({
      success: true,
      data: currentData,
      count: currentData.length,
    });
  }
}
