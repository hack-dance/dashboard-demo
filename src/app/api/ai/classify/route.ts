import { classification } from "@/app/schemas/content-classification"
import OpenAI from "openai"
import { OAIStream, withResponseModel } from "zod-stream"

import { RateLimiter } from "@/lib/rate-limiter"

const oai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"] ?? undefined,
  organization: process.env["OPENAI_ORG_ID"] ?? undefined
})

export const runtime = "edge"

interface IRequest {
  // response_model: { schema: typeof dashboardSchema; name: string }
  messages: OpenAI.ChatCompletionMessageParam[]
}

export async function POST(request: Request) {
  const rateLimit = await RateLimiter(request)

  if (!rateLimit || rateLimit?.isLimited) {
    return new Response("Daily limit exceeded", {
      status: 429
    })
  }
  const { messages } = (await request.json()) as IRequest

  const params = withResponseModel({
    response_model: {
      schema: classification,
      name: "classification of content"
    },
    params: {
      temperature: 0.2,
      seed: 1,
      messages,

      model: "gpt-4-1106-preview",
      stream: true
    },
    mode: "TOOLS"
  })

  const extractionStream = await oai.chat.completions.create(params)

  return new Response(
    OAIStream({
      res: extractionStream
    })
  )
}
