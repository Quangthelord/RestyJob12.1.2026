import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Demo mode - authentication optional
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getCurrentUser(token || null);

    const job = await prisma.job.findUnique({
      where: { id: params.id },
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
        matches: {
          include: {
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
        },
        checkIns: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
