import { NextResponse } from "next/server";
import { processDailyNotifications } from "@/lib/services/notification-service";

export async function GET(request: Request) {
  // Verify authorization header if CRON_SECRET is set
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const results = await processDailyNotifications();
    return NextResponse.json({ success: true, processedCount: results.length, details: results });
  } catch (error) {
    console.error("Cron notification execution error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
