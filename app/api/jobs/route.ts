import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import { autoMatchJob } from "@/lib/matching";

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  branchId: z.string().uuid(),
  skillsRequired: z.array(z.string()),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  hourlyRate: z.number().positive(),
  maxWorkers: z.number().int().positive().default(1),
});

export async function GET(req: NextRequest) {
  try {
    // Demo mode - authentication optional
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getCurrentUser(token || null);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const businessId = searchParams.get("businessId");

    const where: any = {};
    if (status) where.status = status;
    if (businessId) where.businessId = businessId;
    if (user && user.role === "BUSINESS") where.businessId = user.id;

    const jobs = await prisma.job.findMany({
      where,
      include: {
        branch: true,
        business: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        matches: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                rating: true,
              },
            },
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Demo mode - create mock business user if not authenticated
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let user = await getCurrentUser(token || null);
    
    if (!user) {
      // Create a demo business user
      user = {
        id: "demo-business-id",
        email: "demo@business.com",
        name: "Demo Business",
        role: "BUSINESS" as const,
        companyName: "Demo Company",
      };
    }

    const body = await req.json();
    const data = createJobSchema.parse(body);

    // Calculate total amount
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const totalAmount = hours * data.hourlyRate;

    // Verify branch exists (skip ownership check in demo mode)
    const branch = await prisma.branch.findFirst({
      where: {
        id: data.branchId,
        ...(user ? { businessId: user.id } : {}),
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Chi nhánh không tồn tại" },
        { status: 404 }
      );
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        branchId: data.branchId,
        businessId: user.id,
        skillsRequired: data.skillsRequired,
        startTime: startTime,
        endTime: endTime,
        hourlyRate: data.hourlyRate,
        totalAmount,
        maxWorkers: data.maxWorkers,
      },
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
    });

    // Auto match workers
    await autoMatchJob(job.id);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create job error:", error);
    return NextResponse.json(
      { error: "Tạo ca làm việc thất bại" },
      { status: 500 }
    );
  }
}
