import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { distanceBetweenCoordinates } from "@/lib/utils";

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface Location {
  lat: number;
  lng: number;
}

// Calculate time overlap percentage
function calculateTimeOverlap(
  slotStart: Date,
  slotEnd: Date,
  jobStart: Date,
  jobEnd: Date
): number {
  const overlapStart = new Date(
    Math.max(slotStart.getTime(), jobStart.getTime())
  );
  const overlapEnd = new Date(Math.min(slotEnd.getTime(), jobEnd.getTime()));

  if (overlapStart >= overlapEnd) return 0;

  const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
  const slotDuration = slotEnd.getTime() - slotStart.getTime();

  return (overlapDuration / slotDuration) * 100;
}

// Calculate skill match score
function calculateSkillMatch(
  workerSkills: string[],
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 100;

  const matchedSkills = requiredSkills.filter((skill) =>
    workerSkills.some(
      (ws) =>
        ws.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(ws.toLowerCase())
    )
  );

  return (matchedSkills.length / requiredSkills.length) * 100;
}

// Calculate route optimization score
function calculateRouteScore(
  jobs: Array<{ branch: { latitude?: number; longitude?: number } }>,
  userLocation: Location | null
): number {
  if (!userLocation || jobs.length < 2) return 50;

  let totalDistance = 0;
  let prevLocation = userLocation;

  for (const job of jobs) {
    if (job.branch.latitude && job.branch.longitude) {
      const distance = distanceBetweenCoordinates(
        prevLocation.lat,
        prevLocation.lng,
        job.branch.latitude,
        job.branch.longitude
      );
      totalDistance += distance;
      prevLocation = {
        lat: job.branch.latitude,
        lng: job.branch.longitude,
      };
    }
  }

  // Score based on total distance (lower is better)
  // Max 50km = 100 points, 100km = 0 points
  const maxDistance = 100;
  const score = Math.max(0, 100 - (totalDistance / maxDistance) * 100);
  return score;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const user = await getCurrentUser(token || null);

    const body = await req.json();
    const { timeSlots, location }: { timeSlots: TimeSlot[]; location?: Location } = body;

    if (!timeSlots || timeSlots.length === 0) {
      return NextResponse.json(
        { error: "Time slots are required" },
        { status: 400 }
      );
    }

    // Get worker profile (or use mock for demo)
    const workerId = user?.id || "demo-worker-id";
    const worker = await prisma.user.findUnique({
      where: { id: workerId },
      select: { skills: true, rating: true },
    });

    const workerSkills = worker?.skills || [];

    // Fetch all open jobs
    const allJobs = await prisma.job.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        branch: true,
        business: {
          select: {
            name: true,
            rating: true,
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    // Process each time slot and find matching jobs
    const slotMatches: Array<{
      slot: TimeSlot;
      jobs: Array<{
        job: any;
        timeScore: number;
        skillScore: number;
        totalScore: number;
      }>;
    }> = [];

    for (const slot of timeSlots) {
      const slotStart = new Date(`${slot.date}T${slot.startTime}`);
      const slotEnd = new Date(`${slot.date}T${slot.endTime}`);

      const matchingJobs = allJobs
        .map((job) => {
          const jobStart = new Date(job.startTime);
          const jobEnd = new Date(job.endTime);

          // Time overlap score
          const timeScore = calculateTimeOverlap(
            slotStart,
            slotEnd,
            jobStart,
            jobEnd
          );

          // Skip if time overlap is less than 50%
          if (timeScore < 50) return null;

          // Skill match score
          const skillScore = calculateSkillMatch(
            workerSkills,
            job.skillsRequired
          );

          // Combined score (time 60%, skill 40%)
          const totalScore = timeScore * 0.6 + skillScore * 0.4;

          return {
            job,
            timeScore,
            skillScore,
            totalScore,
          };
        })
        .filter((match) => match !== null && match.totalScore > 60)
        .sort((a, b) => (b?.totalScore || 0) - (a?.totalScore || 0))
        .slice(0, 3) as Array<{
        job: any;
        timeScore: number;
        skillScore: number;
        totalScore: number;
      }>;

      if (matchingJobs.length > 0) {
        slotMatches.push({
          slot,
          jobs: matchingJobs,
        });
      }
    }

    // Generate Perfect Matches (single jobs with high scores)
    const perfectMatches = slotMatches
      .flatMap((sm) =>
        sm.jobs
          .filter((m) => m.totalScore >= 90)
          .map((m) => ({
            type: "PERFECT_MATCH" as const,
            jobs: [
              {
                id: m.job.id,
                title: m.job.title,
                hourlyRate: m.job.hourlyRate,
                totalAmount: m.job.totalAmount,
                startTime: m.job.startTime,
                endTime: m.job.endTime,
                branch: m.job.branch,
                business: m.job.business,
                skillsRequired: m.job.skillsRequired,
                matchScore: Math.round(m.totalScore),
              },
            ],
            totalEarnings: m.job.totalAmount,
            totalHours:
              (new Date(m.job.endTime).getTime() -
                new Date(m.job.startTime).getTime()) /
              (1000 * 60 * 60),
            routeOptimized: false,
          }))
      )
      .slice(0, 3);

    // Generate Smart Schedules (multiple jobs optimized by route)
    const smartSchedules: Array<{
      type: "SMART_SCHEDULE";
      jobs: any[];
      totalEarnings: number;
      totalHours: number;
      routeOptimized: boolean;
    }> = [];

    // Group jobs by date and optimize routes
    const jobsByDate = new Map<string, any[]>();
    slotMatches.forEach((sm) => {
      sm.jobs.forEach((m) => {
        const dateKey = new Date(m.job.startTime).toISOString().split("T")[0];
        if (!jobsByDate.has(dateKey)) {
          jobsByDate.set(dateKey, []);
        }
        jobsByDate.get(dateKey)?.push(m);
      });
    });

    // Create optimized schedules for each day
    jobsByDate.forEach((dayJobs, date) => {
      if (dayJobs.length >= 2 && location) {
        // Sort by start time
        dayJobs.sort(
          (a, b) =>
            new Date(a.job.startTime).getTime() -
            new Date(b.job.startTime).getTime()
        );

        // Select jobs that don't overlap and optimize route
        const selectedJobs: any[] = [];
        let lastEndTime = new Date(0);
        let prevLocation = location;

        for (const match of dayJobs) {
          const jobStart = new Date(match.job.startTime);
          if (jobStart >= lastEndTime) {
            // Check if route is reasonable
            if (match.job.branch.latitude && match.job.branch.longitude) {
              const distance = distanceBetweenCoordinates(
                prevLocation.lat,
                prevLocation.lng,
                match.job.branch.latitude,
                match.job.branch.longitude
              );

              // Only add if distance is reasonable (< 20km)
              if (distance < 20 || selectedJobs.length === 0) {
                selectedJobs.push(match);
                lastEndTime = new Date(match.job.endTime);
                prevLocation = {
                  lat: match.job.branch.latitude,
                  lng: match.job.branch.longitude,
                };
              }
            } else {
              selectedJobs.push(match);
              lastEndTime = new Date(match.job.endTime);
            }
          }
        }

        if (selectedJobs.length >= 2) {
          const totalEarnings = selectedJobs.reduce(
            (sum, m) => sum + m.job.totalAmount,
            0
          );
          const totalHours = selectedJobs.reduce((sum, m) => {
            const hours =
              (new Date(m.job.endTime).getTime() -
                new Date(m.job.startTime).getTime()) /
              (1000 * 60 * 60);
            return sum + hours;
          }, 0);

          smartSchedules.push({
            type: "SMART_SCHEDULE",
            jobs: selectedJobs.map((m) => ({
              id: m.job.id,
              title: m.job.title,
              hourlyRate: m.job.hourlyRate,
              totalAmount: m.job.totalAmount,
              startTime: m.job.startTime,
              endTime: m.job.endTime,
              branch: m.job.branch,
              business: m.job.business,
              skillsRequired: m.job.skillsRequired,
              matchScore: Math.round(m.totalScore),
            })),
            totalEarnings,
            totalHours,
            routeOptimized: true,
          });
        }
      }
    });

    // Combine and sort results
    const allMatches = [...perfectMatches, ...smartSchedules].sort((a, b) => {
      // Prioritize perfect matches, then by total earnings
      if (a.type === "PERFECT_MATCH" && b.type !== "PERFECT_MATCH") return -1;
      if (a.type !== "PERFECT_MATCH" && b.type === "PERFECT_MATCH") return 1;
      return b.totalEarnings - a.totalEarnings;
    });

    return NextResponse.json({
      matches: allMatches.slice(0, 5), // Top 5 results
    });
  } catch (error) {
    console.error("AI Matching error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



