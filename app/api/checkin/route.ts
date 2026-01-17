import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const checkInSchema = z.object({
  matchId: z.string().uuid(),
  location: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Demo mode - authentication optional
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getCurrentUser(token || null);

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId is required" },
        { status: 400 }
      );
    }

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        matchId,
        workerId: user.id,
      },
      include: {
        job: {
          include: {
            branch: true,
            business: {
              select: {
                id: true,
                name: true,
                companyName: true,
              },
            },
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!checkIn) {
      return NextResponse.json(
        { error: "Check-in not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ checkIn });
  } catch (error) {
    console.error("Get check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Demo mode - create mock worker user if not authenticated
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let user = await getCurrentUser(token || null);
    
    if (!user) {
      user = {
        id: "demo-worker-id",
        email: "demo@worker.com",
        name: "Demo Worker",
        role: "WORKER" as const,
      };
    }

    const body = await req.json();
    const data = checkInSchema.parse(body);

    // Verify match
    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: {
        job: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    
    // In demo mode, allow check-in even if workerId doesn't match
    if (user && match.workerId !== user.id) {
      // Allow in demo mode - continue
    }

    if (match.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Match chưa được chấp nhận" },
        { status: 400 }
      );
    }

    // Check if already checked in
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        matchId: data.matchId,
        checkOutTime: null,
      },
    });

    if (existingCheckIn) {
      return NextResponse.json({ error: "Đã check-in rồi" }, { status: 400 });
    }

    // Create check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        matchId: data.matchId,
        jobId: match.jobId,
        workerId: user.id,
        location: data.location,
      },
      include: {
        job: {
          include: {
            branch: true,
            business: {
              select: {
                id: true,
                name: true,
                companyName: true,
              },
            },
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ checkIn }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Check-in thất bại" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Demo mode - create mock worker user if not authenticated
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let user = await getCurrentUser(token || null);
    
    if (!user) {
      user = {
        id: "demo-worker-id",
        email: "demo@worker.com",
        name: "Demo Worker",
        role: "WORKER" as const,
      };
    }

    const body = await req.json();
    const { checkInId } = body;

    if (!checkInId) {
      return NextResponse.json(
        { error: "checkInId is required" },
        { status: 400 }
      );
    }

    // Find check-in
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
    });

    if (!checkIn) {
      return NextResponse.json(
        { error: "Check-in not found" },
        { status: 404 }
      );
    }
    
    // In demo mode, allow check-out even if workerId doesn't match
    if (user && checkIn.workerId !== user.id) {
      // Allow in demo mode
    }

    if (checkIn.checkOutTime) {
      return NextResponse.json({ error: "Đã check-out rồi" }, { status: 400 });
    }

    // Update check-out
    const updatedCheckIn = await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        checkOutTime: new Date(),
      },
      include: {
        job: true,
        worker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update job status to completed
    await prisma.job.update({
      where: { id: checkIn.jobId },
      data: { status: "COMPLETED" },
    });

    // Update match status
    await prisma.match.update({
      where: { id: checkIn.matchId },
      data: { status: "COMPLETED" },
    });

    // Create payment record
    const hours =
      (updatedCheckIn.checkOutTime!.getTime() -
        updatedCheckIn.checkInTime.getTime()) /
      (1000 * 60 * 60);
    const amount = hours * updatedCheckIn.job.hourlyRate;

    await prisma.payment.create({
      data: {
        matchId: checkIn.matchId,
        jobId: checkIn.jobId,
        workerId: user.id,
        amount,
        status: "PENDING",
      },
    });

    return NextResponse.json({ checkIn: updatedCheckIn });
  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json({ error: "Check-out thất bại" }, { status: 500 });
  }
}
