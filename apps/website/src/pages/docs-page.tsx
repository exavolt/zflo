import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Code, Zap } from 'lucide-react';

export function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Documentation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Learn how to build interactive flows with ZFlo. From basic concepts to
          advanced patterns.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Learn the fundamentals of ZFlo, including installation, basic
              concepts, and your first flow.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://github.com/exavolt/zflo/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Guide <ExternalLink />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-500" />
              API Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Complete API documentation for all ZFlo packages and their
              methods.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://github.com/exavolt/zflo/tree/main/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                Browse API <ExternalLink />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Interactive Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Try ZFlo in your browser with our interactive flow editor. No
              installation required.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://zflo-editor.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Editor <ExternalLink />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Explore example flows and use cases to see ZFlo in action.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a
                href="https://github.com/exavolt/zflo/tree/main/examples"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Examples <ExternalLink />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/20">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Core Concepts</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Flow Structure</li>
                <li>• State Management</li>
                <li>• Conditional Logic</li>
                <li>• Dynamic Content</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Advanced Topics</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Custom Formats</li>
                <li>• Server-side Execution</li>
                <li>• AI Integration</li>
                <li>• Performance Optimization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
