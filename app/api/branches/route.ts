import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createBranchSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Demo mode - authentication optional
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getCurrentUser(token || null);

    const where: any = {};
    if (user && user.role === "BUSINESS") {
      where.businessId = user.id;
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Get branches error:", error);
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
      user = {
        id: "demo-business-id",
        email: "demo@business.com",
        name: "Demo Business",
        role: "BUSINESS" as const,
        companyName: "Demo Company",
        rating: 0,
        avatar: null,
        skills: [],
        location: null,
      };
    }

    const body = await req.json();
    const data = createBranchSchema.parse(body);

    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        businessId: user.id,
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create branch error:", error);
    return NextResponse.json(
      { error: "Tạo chi nhánh thất bại" },
      { status: 500 }
    );
  }
}
