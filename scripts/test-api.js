// Health API тест скрипт
const API_URL = "http://localhost:3000/api/health";

// Тест дата үүсгэх
function generateTestData(userId) {
  return {
    userId: userId,
    heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
    stepCount: Math.floor(Math.random() * 10000) + 1000, // 1000-11000 steps
    battery: Math.floor(Math.random() * 100) + 1, // 1-100%
    timestamp: new Date().toISOString(),
  };
}

// Health дата илгээх
async function sendHealthData(userData) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ User ${userData.userId} дата илгээгдлээ:`, {
        heartRate: userData.heartRate,
        stepCount: userData.stepCount,
        battery: userData.battery,
      });
    } else {
      console.error(`❌ User ${userData.userId} алдаа:`, result.error);
    }

    return result;
  } catch (error) {
    console.error(`🚨 ${userData.userId} холболт алдаа:`, error.message);
    return null;
  }
}

// Бүх health дата авах
async function getAllHealthData() {
  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (response.ok) {
      console.log("\n📊 Одоогийн health дата:");
      console.log(`Нийт хэрэглэгч: ${result.count}`);
      result.data.forEach((user) => {
        console.log(
          `  👤 ${user.userId}: HR=${user.heartRate}bpm, Steps=${user.stepCount}, Battery=${user.battery}%`
        );
      });
      return result.data;
    } else {
      console.error("❌ Дата авахад алдаа:", result.error);
      return null;
    }
  } catch (error) {
    console.error("🚨 GET request алдаа:", error.message);
    return null;
  }
}

// Stream тест
function testStream() {
  console.log("\n🔗 Stream холболт эхлүүлж байна...");

  const eventSource = new EventSource(`${API_URL}?stream=true`);

  eventSource.onopen = () => {
    console.log("✅ Stream амжилттай холбогдлоо");
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "initial") {
        console.log(
          `📋 Эхний дата (${data.data.length} хэрэглэгч):`,
          data.data
        );
      } else if (data.type === "update") {
        console.log(`🔄 Шинэ update:`, data.data);
      }
    } catch (error) {
      console.error("❌ Stream дата parse алдаа:", error);
    }
  };

  eventSource.onerror = (error) => {
    console.error("🚨 Stream алдаа:", error);
  };

  // 30 секундын дараа stream хаах
  setTimeout(() => {
    eventSource.close();
    console.log("🔚 Stream хаагдлаа");
  }, 30000);
}

// Олон хэрэглэгчийн дата тест
async function testMultipleUsers() {
  console.log("\n🧪 Олон хэрэглэгчийн тест эхлүүлж байна...\n");

  const users = ["user001", "user002", "user003", "user004", "user005"];

  // Бүх хэрэглэгчийн дата илгээх
  for (const userId of users) {
    const testData = generateTestData(userId);
    await sendHealthData(testData);

    // Хооронд бага зэрэг хүлээх
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Бүх дата харах
  setTimeout(async () => {
    await getAllHealthData();
  }, 1000);
}

// Үндсэн тест функц
async function runTests() {
  console.log("🏥 Health API Тест эхлүүлж байна...\n");

  try {
    // 1. Server эсэх шалгах
    console.log("1️⃣ Server амьд эсэх шалгаж байна...");
    const healthCheck = await getAllHealthData();

    if (healthCheck === null) {
      console.error(
        "❌ Server холбогдохгүй байна. npm run dev ажиллуулсан эсэхээ шалгана уу."
      );
      return;
    }

    console.log("✅ Server амжилттай холбогдлоо!\n");

    // 2. Олон хэрэглэгчийн тест
    await testMultipleUsers();

    // 3. Stream тест (browser орчинд л ажиллана)
    if (typeof window !== "undefined") {
      testStream();
    } else {
      console.log("ℹ️ Stream тест зөвхөн browser дээр ажиллана");
    }

    console.log(
      "\n✨ Бүх тест дууслаа! Health dashboard http://localhost:3000/health дээр ороод үзээрэй."
    );
  } catch (error) {
    console.error("🚨 Тест алдаа:", error);
  }
}

// Тест ажиллуулах
runTests();
