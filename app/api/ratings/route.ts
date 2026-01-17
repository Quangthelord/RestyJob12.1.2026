import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createRatingSchema = z.object({
  matchId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Demo mode - create mock user if not authenticated
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let user = await getCurrentUser(token || null);
    
    if (!user) {
      user = {
        id: "demo-user-id",
        email: "demo@user.com",
        name: "Demo User",
        role: "WORKER" as const,
      };
    }

    const body = await req.json();
    const data = createRatingSchema.parse(body);

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

    // Verify user can rate this match
    const canRate =
      (user.role === "WORKER" && match.workerId === user.id) ||
      (user.role === "BUSINESS" && match.job.businessId === user.id);

    if (!canRate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already rated
    const existingRating = await prisma.rating.findUnique({
      where: { matchId: data.matchId },
    });

    if (existingRating) {
      return NextResponse.json({ error: "Đã đánh giá rồi" }, { status: 400 });
    }

    // Determine ratee (the other party)
    const rateeId =
      user.role === "WORKER" ? match.job.businessId : match.workerId;

    // Create rating
    const rating = await prisma.rating.create({
      data: {
        matchId: data.matchId,
        raterId: user.id,
        rateeId,
        score: data.score,
        comment: data.comment,
      },
      include: {
        rater: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        ratee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update ratee's rating
    const rateeRatings = await prisma.rating.findMany({
      where: { rateeId },
    });

    const avgRating =
      rateeRatings.reduce((sum, r) => sum + r.score, 0) / rateeRatings.length;

    await prisma.user.update({
      where: { id: rateeId },
      data: {
        rating: avgRating,
        totalRatings: rateeRatings.length,
      },
    });

    return NextResponse.json({ rating }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create rating error:", error);
    return NextResponse.json(
      { error: "Tạo đánh giá thất bại" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Demo mode - authentication optional
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getCurrentUser(token || null);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const where: any = {};
    if (userId) {
      where.OR = [{ raterId: userId }, { rateeId: userId }];
    }

    const ratings = await prisma.rating.findMany({
      where,
      include: {
        rater: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        ratee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        match: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error("Get ratings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
