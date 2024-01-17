import { Ratelimit } from "@upstash/ratelimit"
import { kv } from "@vercel/kv"

export const DAILY_REQUEST_LIMIT = 5

type RateLimiter = {
  isLimited: boolean
  remaining?: number
}

export async function getLimitMeta(req: Request) {
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve({
      isLimited: false,
      remaining: 420
    })
  }

  const mswindow = 86400000
  const now = Date.now()
  const currentWindow = Math.floor(now / mswindow)

  const ip = req.headers.get("x-forwarded-for")
  const used = (await kv.get(`island:rl_${ip}:${currentWindow}`)) as string

  return {
    remaining: DAILY_REQUEST_LIMIT - parseInt(used ?? "0"),
    isLimited: parseInt(used ?? "0") >= DAILY_REQUEST_LIMIT
  }
}

export async function RateLimiter(req: Request): Promise<RateLimiter | null> {
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve({
      isLimited: false,
      remaining: 100000,
      headers: {}
    })
  }

  if (!process.env.KV_REST_API_URL && !process.env.KV_REST_API_TOKEN) {
    return Promise.resolve(null)
  }

  const ip = req.headers.get("x-forwarded-for")
  const ratelimit = new Ratelimit({
    redis: kv,
    prefix: "island",
    limiter: Ratelimit.slidingWindow(DAILY_REQUEST_LIMIT, "1 d")
  })

  const { success, limit, reset, remaining } = await ratelimit.limit(`rl_${ip}`)

  return Promise.resolve({
    isLimited: !success,
    remaining
  })
}