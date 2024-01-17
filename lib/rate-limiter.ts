import { Ratelimit } from "@upstash/ratelimit"
import { kv } from "@vercel/kv"

export const DAILY_REQUEST_LIMIT = 5

type RateLimiter = {
  isLimited: boolean
  remaining?: number
}

export async function RateLimiter(req: Request): Promise<RateLimiter | null> {
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve({
      isLimited: false,
      remaining: 100000
    })
  }

  if (!process.env.KV_REST_API_URL && !process.env.KV_REST_API_TOKEN) {
    return Promise.resolve(null)
  }

  const ip = req.headers.get("x-forwarded-for")

  const ratelimit = new Ratelimit({
    redis: kv,
    prefix: "island-ip",
    limiter: Ratelimit.slidingWindow(DAILY_REQUEST_LIMIT, "1 d")
  })

  const ratelimitTotal = new Ratelimit({
    redis: kv,
    prefix: "island-total",
    limiter: Ratelimit.slidingWindow(1000, "1 d")
  })

  const { success: totalSuccess } = await ratelimitTotal.limit("total")
  const { success, remaining } = await ratelimit.limit(`rl_${ip}`)

  return Promise.resolve({
    isLimited: !success || !totalSuccess,
    remaining
  })
}