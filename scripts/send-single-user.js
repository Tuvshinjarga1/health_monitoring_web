// Ганц хэрэглэгчийн дата илгээх тест скрипт
const API_URL = "http://localhost:3000/api/health";

async function sendSingleUserData() {
  const userData = {
    userId: "test_user_live",
    heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 bpm
    stepCount: Math.floor(Math.random() * 5000) + 2000, // 2000-7000 steps
    battery: Math.floor(Math.random() * 100) + 1, // 1-100%
    timestamp: new Date().toISOString(),
  };

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
      console.log(`✅ Live test дата илгээгдлээ:`, {
        userId: userData.userId,
        heartRate: userData.heartRate,
        stepCount: userData.stepCount,
        battery: userData.battery,
      });
      console.log(
        `🔄 Dashboard дээр ${userData.userId} шинэчлэгдэхийг харах боломжтой`
      );
    } else {
      console.error(`❌ Алдаа:`, result.error);
    }
  } catch (error) {
    console.error("🚨 Холболт алдаа:", error.message);
  }
}

// Ганц удаа илгээх
sendSingleUserData();
