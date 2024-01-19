import { useState } from "react"
import { useJsonStream } from "stream-hooks"

import { Overview } from "@/components/overview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

import { classification } from "./schemas/content-classification"

export const ContentAnalysis = () => {
  const [submitted, setSubmitted] = useState(false)
  const [prompt, _setPrompt] = useState("Paste your text here to classify it")
  const { data, loading, startStream } = useJsonStream({
    schema: classification
  })

  const submitMessage = async () => {
    try {
      setSubmitted(true)
      await startStream({
        url: "/api/ai/classify",
        method: "POST",
        body: {
          messages: [
            {
              content: `You are tasks with classifying the following content.

                Think about what this content could be. 

                Then piece together the information you have to classify it.
                  `,

              role: "system"
            },

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

  return !submitted ? (
    <>
      <div>
        <p>
          This example parses any kind of content and classifies and pulls out some vital
          information from it. You can copy and paste email threads, newsletters or any other kind
          of content. It will then classify the content and pull out the important information.
        </p>
        <Textarea
          className="mb-12 min-h-[50vh] w-full"
          defaultValue={prompt}
          onChange={e => _setPrompt(e.target.value)}
        />
        <Button onClick={submitMessage}>Generate report</Button>
      </div>
    </>
  ) : (
    <div className="">
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <pre>{JSON.stringify(data.tasks, null, 2)}</pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <pre>{JSON.stringify(data.calendar, null, 2)}</pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ideas</CardTitle>
        </CardHeader>
        <CardContent>
          {data.ideas ? (
            data.ideas.map((idea, i) => (
              <div key={i} className="py-2">
                <h2 className="text-lg pb-2">{idea.topic}</h2>
                <p className="pl-2">{idea.detailed_description}</p>
              </div>
            ))
          ) : (
            <p>No ideas yet!</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent>
          {data.people ? (
            data.people.map((person, i) => (
              <div key={i} className="py-2">
                <h2 className="text-lg">
                  {person.name} - {person.role}
                </h2>
                <p className="pl-2">{person.context}</p>
              </div>
            ))
          ) : (
            <p>No people yet!</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
