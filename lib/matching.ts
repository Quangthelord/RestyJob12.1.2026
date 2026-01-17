import { prisma } from './prisma'
import { Job, User, MatchStatus } from '@prisma/client'
import { distanceBetweenCoordinates } from './utils'

interface MatchingCriteria {
  skillsWeight: number
  locationWeight: number
  ratingWeight: number
  availabilityWeight: number
}

const DEFAULT_CRITERIA: MatchingCriteria = {
  skillsWeight: 0.4,    // 40% - Kỹ năng
  locationWeight: 0.3,  // 30% - Vị trí địa lý
  ratingWeight: 0.2,   // 20% - Đánh giá
  availabilityWeight: 0.1, // 10% - Lịch sử làm việc
}

interface MatchScore {
  worker: User
  score: number
  breakdown: {
    skillsScore: number
    locationScore: number
    ratingScore: number
    availabilityScore: number
  }
}

/**
 * Tính điểm khớp kỹ năng (0-100)
 */
function calculateSkillsScore(workerSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 100
  
  const matchedSkills = requiredSkills.filter(skill => 
    workerSkills.some(ws => ws.toLowerCase().includes(skill.toLowerCase()) || 
                           skill.toLowerCase().includes(ws.toLowerCase()))
  )
  
  return (matchedSkills.length / requiredSkills.length) * 100
}

/**
 * Tính điểm khớp vị trí địa lý (0-100)
 * Càng gần thì điểm càng cao
 */
function calculateLocationScore(
  workerLocation: string | null,
  jobLocation: string | null,
  maxDistance: number = 50 // km
): number {
  if (!workerLocation || !jobLocation) return 50 // Nếu không có vị trí, cho điểm trung bình
  
  try {
    const [workerLat, workerLng] = workerLocation.split(',').map(Number)
    const [jobLat, jobLng] = jobLocation.split(',').map(Number)
    
    const distance = distanceBetweenCoordinates(workerLat, workerLng, jobLat, jobLng)
    
    if (distance <= 5) return 100
    if (distance <= 10) return 90
    if (distance <= 20) return 70
    if (distance <= 30) return 50
    if (distance <= maxDistance) return 30
    
    return 0
  } catch {
    return 50
  }
}

/**
 * Tính điểm dựa trên rating (0-100)
 */
function calculateRatingScore(rating: number): number {
  // Rating từ 0-5, chuyển thành 0-100
  return (rating / 5) * 100
}

/**
 * Tính điểm dựa trên lịch sử làm việc (0-100)
 */
async function calculateAvailabilityScore(workerId: string, jobStartTime: Date): Promise<number> {
  // Kiểm tra xem worker có ca làm việc trùng lịch không
  const conflictingMatches = await prisma.match.findMany({
    where: {
      workerId,
      status: { in: ['ACCEPTED'] },
      job: {
        OR: [
          {
            startTime: { lte: jobStartTime },
            endTime: { gte: jobStartTime },
          },
        ],
      },
    },
  })
  
  if (conflictingMatches.length > 0) return 0 // Có lịch trùng
  
  // Kiểm tra lịch sử hoàn thành ca làm việc (dựa trên job status)
  const completedJobs = await prisma.match.count({
    where: {
      workerId,
      job: {
        status: 'COMPLETED',
      },
    },
  })
  
  // Worker có nhiều kinh nghiệm hơn thì điểm cao hơn
  if (completedJobs >= 50) return 100
  if (completedJobs >= 20) return 80
  if (completedJobs >= 10) return 60
  if (completedJobs >= 5) return 40
  if (completedJobs > 0) return 20
  
  return 10 // Worker mới
}

/**
 * Matching Engine chính
 * Tìm và xếp hạng các worker phù hợp với job
 */
export async function findMatchingWorkers(
  jobId: string,
  criteria: MatchingCriteria = DEFAULT_CRITERIA
): Promise<MatchScore[]> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { branch: true },
  })
  
  if (!job) throw new Error('Job not found')
  
  // Lấy tất cả workers có kỹ năng phù hợp
  const allWorkers = await prisma.user.findMany({
    where: {
      role: 'WORKER',
      // Lọc workers có ít nhất 1 kỹ năng khớp
      skills: {
        hasSome: job.skillsRequired,
      },
    },
  })
  
  // Tính điểm cho từng worker
  const scores: MatchScore[] = []
  
  for (const worker of allWorkers) {
    const skillsScore = calculateSkillsScore(worker.skills, job.skillsRequired)
    const locationScore = calculateLocationScore(
      worker.location,
      job.branch.latitude && job.branch.longitude
        ? `${job.branch.latitude},${job.branch.longitude}`
        : null
    )
    const ratingScore = calculateRatingScore(worker.rating)
    const availabilityScore = await calculateAvailabilityScore(worker.id, job.startTime)
    
    const totalScore =
      skillsScore * criteria.skillsWeight +
      locationScore * criteria.locationWeight +
      ratingScore * criteria.ratingWeight +
      availabilityScore * criteria.availabilityWeight
    
    scores.push({
      worker,
      score: Math.round(totalScore),
      breakdown: {
        skillsScore: Math.round(skillsScore),
        locationScore: Math.round(locationScore),
        ratingScore: Math.round(ratingScore),
        availabilityScore: Math.round(availabilityScore),
      },
    })
  }
  
  // Sắp xếp theo điểm giảm dần
  return scores.sort((a, b) => b.score - a.score)
}

/**
 * Tự động tạo matches cho job
 */
export async function autoMatchJob(jobId: string, topN: number = 5): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  })
  
  if (!job || job.status !== 'PENDING') return
  
  const matchingWorkers = await findMatchingWorkers(jobId)
  
  // Lấy top N workers
  const topWorkers = matchingWorkers.slice(0, Math.min(topN, job.maxWorkers))
  
  // Tạo matches
  for (const matchScore of topWorkers) {
    // Chỉ tạo match nếu điểm >= 50
    if (matchScore.score >= 50) {
      await prisma.match.create({
        data: {
          jobId,
          workerId: matchScore.worker.id,
          status: 'PENDING',
          matchScore: matchScore.score,
        },
      })
    }
  }
  
  // Cập nhật status của job nếu có matches
  const matchCount = await prisma.match.count({
    where: { jobId, status: 'PENDING' },
  })
  
  if (matchCount > 0) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'MATCHED' },
    })
  }
}

