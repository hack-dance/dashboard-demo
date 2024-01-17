import { z } from "zod";

export const dashboardSchema = z.object({
  timeSeries: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
    })
  ),
  big_metrics: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      secondary_value: z.string().optional().describe(" an optional secondary value, could be descriptive, a diff vs another time period etc..")
    })
  )
});