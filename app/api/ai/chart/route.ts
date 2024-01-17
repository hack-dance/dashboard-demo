import { dashboardSchema } from "@/app/schemas/dashboard"
import OpenAI from "openai"
import { OAIStream, withResponseModel } from "../../../../../ai-ui/public-packages/zod-stream"

const oai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"] ?? undefined,
  organization: process.env["OPENAI_ORG_ID"] ?? undefined
})

export const runtime = "edge"

interface IRequest {
  messages: OpenAI.ChatCompletionMessageParam[]
}

export async function POST(request: Request) {
  const { messages } = (await request.json()) as IRequest


  const params = withResponseModel({
    response_model: { schema: dashboardSchema, name: "Metrics" },
    params: {
      temperature: 0.2,
      seed: 1,
      messages: [
        {
          content: "you are tasked with extracting metrics from raw text - you will try to build one time series with useful and valid data - and up to 8 individual static metrics.",
          role: "system"
        },
        ...messages
      ],
      model: "gpt-4-1106-preview",
      stream: true
    },
    mode: "TOOLS",
  })

  const extractionStream = await oai.chat.completions.create(params)
  
  return new Response(
    OAIStream({
      res: extractionStream
    })
  )
}
