"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ContentAnalysis } from "./content-analysis"
import { Dashboard } from "./dashboard"

export default function page() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="parser">Content Parser</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Dashboard />
          </TabsContent>
          <TabsContent value="parser" className="space-y-4">
            <ContentAnalysis />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
