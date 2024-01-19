import { z } from "zod"

export const classification = z.object({
  people: z
    .object({
      name: z.string(),
      role: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      location: z.string().nullable(),
      department: z.string().nullable(),
      company: z.string().nullable(),
      context: z.string({
        description: "What is the context of this person in the content?"
      })
    })
    .array(),
  calendar: z
    .object(
      {
        event_name: z.string(),
        start_time: z.date().nullable(),
        end_time: z.date().nullable(),
        location: z.string().nullable(),
        invitees: z
          .string({ description: "Invitees should be a comma separated list of emails" })
          .nullable()
      },
      {
        description:
          "Is there a calendar event in this piece of content that we should be aware of?"
      }
    )
    .array(),
  tasks: z
    .object(
      {
        task_name: z.string(),
        due_date: z.date().nullable(),
        start_date: z.date().nullable(),
        priority: z.string().nullable(),
        description: z.string().nullable()
      },
      {
        description: "Is there a task in this piece of content that we should be aware of?"
      }
    )
    .array(),
  ideas: z
    .object(
      {
        topic: z.string({ description: "What is the thought about?" }),
        detailed_description: z.string({
          description: "What is the though about in more thorough detail?"
        }),
        date: z.string({ description: "When was this thought had?" }) // zodDate not supported error?
        // related: z.string({ description: "What other thoughts are related to this one?" }).nullable() THIS SHOULD CALL ANOTHER FUNCTION TO FIND RELATED NOTES!
      },
      {
        description: `Is there a idea or thought in this piece of content that we should be aware of?

          Each idea should be a separate and distinct thought or idea. It is its own entity.`
      }
    )
    .array()
})
