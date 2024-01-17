import { z } from "zod"

export const dashboardSchema = z.object({
  timeSeriesChartName: z
    .string()
    .describe("the name of the time series chart - inclduding the unit of measure"),
  timeSeries: z
    .array(
      z.object({
        date: z.string(),
        value: z
          .number()
          .describe("the value of the time series at this point in time - must be a valid number")
      })
    )
    .min(10),
  big_metrics: z.array(
    z
      .object({
        name: z.string(),
        value: z.string(),
        secondary_value: z
          .string()
          .optional()
          .describe(
            " an optional secondary value, ideally a unit of measure, but could be descriptive, a diff vs another time period etc.."
          )
      })
      .describe("always include the unit of measure")
  )
})
