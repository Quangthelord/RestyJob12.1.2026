import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['BUSINESS', 'WORKER']),
  companyName: z.string().optional(),
  taxCode: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: data.role,
        companyName: data.role === 'BUSINESS' ? data.companyName : null,
        taxCode: data.role === 'BUSINESS' ? data.taxCode : null,
        skills: data.role === 'WORKER' ? (data.skills || []) : [],
        location: data.role === 'WORKER' ? data.location : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        skills: true,
        location: true,
      },
    })

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      user,
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Đăng ký thất bại' },
      { status: 500 }
    )
  }
}

