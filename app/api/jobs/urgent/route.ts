import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get urgent jobs (starting in < 60 minutes with no matches)
 * These jobs should be prioritized in marketplace
 */
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const urgentJobs = await prisma.job.findMany({
      where: {
        status: "OPEN",
        startTime: {
          gte: now,
          lte: oneHourLater,
        },
      },
      include: {
        branch: true,
        business: {
          select: {
            name: true,
            companyName: true,
            rating: true,
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Filter jobs with no matches or insufficient matches
    const trulyUrgent = urgentJobs.filter(
      (job) => (job._count.matches || 0) < (job.maxWorkers || 1)
    );

    return NextResponse.json({
      urgentJobs: trulyUrgent,
      count: trulyUrgent.length,
    });
  } catch (error) {
    console.error("Get urgent jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



