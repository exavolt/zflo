'use client';

import { useState } from 'react';
import { FlowPlayer } from '@zflo/ui-react-tw';
import { MermaidParser } from '@zflo/format-mermaid';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MermaidDirectRenderer } from './mermaid-direct-renderer';

const defaultFlow = `flowchart TD
    A[Start] --> B{Is it sunny?}
    B -- Yes --> C[Go to the beach]
    B -- No --> D[Read a book]
    C --> E[End]
    D --> E[End]`;

export function InlineDemo() {
  const [mermaidCode, setMermaidCode] = useState(defaultFlow);
  const mermaidParser = new MermaidParser();

  let flowchart;
  try {
    flowchart = mermaidParser.parse(mermaidCode);
  } catch (error) {
    // Fallback to default if parsing fails
    flowchart = mermaidParser.parse(defaultFlow);
  }

  return (
    <section className="py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          See It in Action
        </h2>
        <Card className="p-4 md:p-6">
          <CardContent className="grid md:grid-cols-2 gap-8 items-start p-0">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mermaid Flowchart</h3>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="edit">Edit Code</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <div className="rounded-lg border p-4 min-h-[300px]">
                    <MermaidDirectRenderer mermaidSyntax={mermaidCode} />
                  </div>
                </TabsContent>
                <TabsContent value="edit" className="mt-4">
                  <textarea
                    value={mermaidCode}
                    onChange={(e) => setMermaidCode(e.target.value)}
                    className="w-full h-[300px] p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your Mermaid flowchart syntax here..."
                  />
                </TabsContent>
              </Tabs>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interactive Player</h3>
              <div className="rounded-lg border p-4 min-h-[300px]">
                <FlowPlayer flowchart={flowchart} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
