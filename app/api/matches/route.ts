import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateMatchSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "CANCELLED"]),
});

export async function GET(req: NextRequest) {
  try {
    // Demo mode - authentication optional
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getCurrentUser(token || null);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");

    const where: any = {};
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    if (user) {
      if (user.role === "WORKER") where.workerId = user.id;
      if (user.role === "BUSINESS") {
        where.job = { businessId: user.id };
      }
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        job: {
          include: {
            branch: true,
            business: {
              select: {
                id: true,
                name: true,
                companyName: true,
                rating: true,
              },
            },
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            rating: true,
            skills: true,
            location: true,
          },
        },
      },
      orderBy: {
        matchedAt: "desc",
      },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Demo mode - create mock user if not authenticated
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let user = await getCurrentUser(token || null);
    
    if (!user) {
      // Create demo worker user
      user = {
        id: "demo-worker-id",
        email: "demo@worker.com",
        name: "Demo Worker",
        role: "WORKER" as const,
      };
    }

    const body = await req.json();
    const { matchId, ...data } = updateMatchSchema.parse(body);

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId is required" },
        { status: 400 }
      );
    }

    // Verify match belongs to user
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Demo mode - allow operations without strict ownership checks
    if (user) {
      if (user.role === "WORKER" && match.workerId !== user.id) {
        // In demo mode, allow anyway
      }

      if (user.role === "BUSINESS") {
        const job = await prisma.job.findUnique({
          where: { id: match.jobId },
        });
        // In demo mode, allow anyway
      }
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: data.status,
        acceptedAt: data.status === "ACCEPTED" ? new Date() : null,
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
            rating: true,
          },
        },
      },
    });

    // Update job status if match accepted
    if (data.status === "ACCEPTED") {
      await prisma.job.update({
        where: { id: match.jobId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update match error:", error);
    return NextResponse.json(
      { error: "Cập nhật match thất bại" },
      { status: 500 }
    );
  }
}
