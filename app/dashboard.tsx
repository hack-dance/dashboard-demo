"use client"
import { Overview } from "@/components/overview";
import { useJsonStream } from "stream-hooks"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";
import { dashboardSchema } from "./schemas/dashboard";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { treasury } from "./text";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const [submitted, setSubmitted] = useState(false)
  const [prompt, _setPrompt] = useState(treasury)
  const { data, loading, startStream } = useJsonStream({
    schema: dashboardSchema
  })

  const submitMessage = async () => {
    try {
      setSubmitted(true)
      await startStream({
        url: "/api/ai/chart",
        method: "POST",
        body: {
          messages: [
            {
              content: prompt,
              role: "user"
            }
          ]
        }
      })
    } catch (e) {
      console.error(e)
    }
  }

  
    return !submitted ? (<>
      <div>
        <Textarea className="mb-12 min-h-[50vh] w-full" defaultValue={prompt} />
        <Button onClick={submitMessage}>Generate report</Button>
      </div>
      </>) : (
    <>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {data?.big_metrics?.map((metric) => (
        <Card key={metric.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.secondary_value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>

  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{data?.timeSeriesChartName ?? ""}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <Overview data={data?.timeSeries ?? []} />
      </CardContent>
    </Card>
  </div>
  </>
  )
}