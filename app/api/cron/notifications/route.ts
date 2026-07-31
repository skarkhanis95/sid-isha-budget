import { NextResponse } from "next/server";
import { processDailyNotifications } from "@/lib/services/notification-service";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const results = await processDailyNotifications();
    return NextResponse.json({ success: true, processedCount: results.length, details: results });
  } catch (error) {
    console.error("Cron notification execution error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
