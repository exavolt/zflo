import React from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Zap,
  BookOpen,
  Settings,
  Users,
  Gamepad2,
  ArrowRight,
  ExternalLink,
  Database,
  Replace,
  Waypoints,
  Layers,
  Puzzle,
  Server,
  BrainCircuit,
  WorkflowIcon,
} from 'lucide-react';
import { InlineDemo } from '@/components/inline-demo';

export function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 text-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-background to-muted/20"
        ></div>
        <div
          aria-hidden="true"
          className="absolute inset-0 w-full h-full bg-[radial-gradient(40%_40%_at_50%_10%,rgba(100,116,239,0.1)_0%,rgba(100,116,239,0)_100%)]"
        ></div>
        <div className="container relative max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            ZFlo
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Turn your process documents, flowcharts, diagrams, and branching
            narrative ideas into interactive apps. From static content to
            dynamic, stateful experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild>
              <Link to="/docs">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/use-cases">
                <span>View Use Cases</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is ZFlo */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-3xl font-bold text-center">
                <Zap className="h-8 w-8 text-blue-500" />
                What is ZFlo?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-center leading-relaxed text-muted-foreground max-w-3xl mx-auto">
                ZFlo is a TypeScript-based framework for building interactive
                applications from visual workflows and process documents, or
                from your imagination. Whether it's a flowchart, a state
                machine, a written standard operating procedure (SOP), or a
                branching narrative idea, ZFlo acts as a "brain" that reads
                diagrams, manages persistent state, and executes rule-based
                logic to guide users through a process. It's designed to power
                everything from troubleshooting guides and tutorials to complex
                narrative games.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <InlineDemo />

      {/* Core Features & Architecture */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            A Powerful & Flexible Foundation
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Database}
              title="Stateful Execution"
              description="Maintain a persistent state throughout the user's journey. Variables can be set, modified, and used to influence the flow's direction and content."
            />
            <FeatureCard
              icon={Waypoints}
              title="Conditional Logic"
              description="Define conditions on paths to control which choices are available. The engine evaluates rules against the current state in real-time."
            />
            <FeatureCard
              icon={Replace}
              title="Dynamic Content"
              description="Node titles and content can be dynamically interpolated with state variables, creating personalized experiences."
            />
            <FeatureCard
              icon={Layers}
              title="UI-Agnostic Core"
              description="The core engine has no UI dependencies, allowing it to be used in any JavaScript environment—web, mobile, or server-side."
            />
            <FeatureCard
              icon={Puzzle}
              title="Pluggable Formats"
              description="Easily add support for any text-based diagramming language. Mermaid, PlantUML, and Graphviz DOT are supported out-of-the-box."
            />
            <FeatureCard
              icon={Server}
              title="Multi-Platform"
              description="Provides React hooks for web and has a clear path for React Native, enabling consistent logic across platforms."
            />
          </div>
        </div>
      </section>

      {/* ZFlo + AI */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <BrainCircuit className="h-7 w-7 text-green-500" />
                ZFlo + AI: The Best of Both Worlds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed text-muted-foreground">
                While LLMs are powerful, they can be unpredictable. ZFlo
                provides the deterministic, rule-based structure that AI lacks,
                making them perfect partners. Use ZFlo to orchestrate reliable
                workflows and call on LLMs for creative or reasoning tasks at
                specific steps.
              </p>
              <div className="bg-background/50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold">Hybrid System Examples</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                  <li>
                    <span className="font-semibold">NL-to-State:</span> Use an
                    LLM to parse user text into structured data that updates the
                    ZFlo state.
                  </li>
                  <li>
                    <span className="font-semibold">Dynamic Content:</span> At a
                    specific node, call an LLM to generate context-aware
                    dialogue or choices.
                  </li>
                  <li>
                    <span className="font-semibold">Agentic Workflows:</span>{' '}
                    ZFlo manages the high-level steps, while an LLM agent
                    performs complex reasoning.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Transform Your Content
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UseCaseCard
              icon={Settings}
              title="Guided Problem-Solving"
              description="Convert static troubleshooting guides into dynamic, step-by-step experiences that adapt to user input."
            />
            <UseCaseCard
              icon={Users}
              title="Interactive Training"
              description="Create engaging learning modules with branching scenarios, progress tracking, and personalized feedback."
            />
            <UseCaseCard
              icon={Gamepad2}
              title="Dynamic Narratives"
              description="Build interactive fiction stories where the plot evolves based on user choices and accumulated state."
            />
            <UseCaseCard
              icon={BookOpen}
              title="Interactive Documents"
              description="Transform static process documents and SOPs into guided, interactive workflows."
            />
            <UseCaseCard
              icon={WorkflowIcon}
              title="Live Diagrams"
              description="Bring static diagrams to life with interactive navigation and real-time state management."
            />
            <Card className="border-dashed flex flex-col justify-center items-center text-center p-6 bg-transparent">
              <h3 className="text-lg font-semibold text-muted-foreground">
                And Much More...
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                The possibilities are endless. What will you create?
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground">
            Explore the documentation, try the editor, or dive into the source
            code.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/docs">
                View Documentation <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://zflo-editor.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Try the Editor <ExternalLink />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

// Helper components for cards to keep the main component clean

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <Card className="bg-background/80 backdrop-blur-sm rounded-xl border-border/60 hover:border-blue-500/50 hover:bg-background transition-all duration-300 hover:shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-blue-500" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-[15px]">{description}</p>
    </CardContent>
  </Card>
);

interface UseCaseCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <Card className="bg-background/80 backdrop-blur-sm rounded-xl border-border/60 hover:border-orange-500/50 hover:bg-background transition-all duration-300 hover:shadow-md">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="h-5 w-5 text-orange-500" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);
