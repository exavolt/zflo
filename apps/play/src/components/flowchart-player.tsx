import React, { useState } from 'react';
import {
  Play,
  FileText,
  Trash2,
  AlertCircle,
  ChevronDown,
  Image,
} from 'lucide-react';
import { zfloToMermaid } from '@zflo/format-mermaid';
import { FlowDefinition, NodeDefinition } from '@zflo/core';
import { RegistryParser } from '../lib/registry-parser';
import { flowchartExamples } from '@/data/flowcharts';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { FlowchartImageUpload } from './flowchart-image-upload';
import { AuthGuard } from './auth/auth-guard';
import { MermaidViz } from '@zflo/viz-mermaid';
import { useAppInfo } from '@/contexts/app-info';

interface FlowchartPlayerProps {
  value: string;
  onChange: (value: string) => void;
  onPlay: (flow: FlowDefinition, showFlowchart?: boolean) => void;
  theme: 'light' | 'dark';
}

export const FlowchartPlayer: React.FC<FlowchartPlayerProps> = ({
  value,
  onChange,
  onPlay,
}) => {
  const appInfo = useAppInfo();
  const [error, setError] = useState<string | null>(null);
  const [, setSelectedExample] = useState<string>('');
  // const [analysis, setAnalysis] = useState<FlowAnalysis | null>(null);
  // const [isAnalyzing, setIsAnalyzing] = useState(false);
  // const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [formatInfo, setFormatInfo] = useState<string>('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const unifiedParser = new RegistryParser();
  // const analyzer = new FlowAnalyzer();

  const handleChange = (newValue: string) => {
    onChange(newValue);

    // Validate syntax with unified parser
    if (newValue.trim()) {
      const validation = unifiedParser.validate(newValue);
      if (!validation.isValid) {
        setError(validation.errors.join('; '));
      } else {
        setError(null);
        // Show format detection info
        const detection = unifiedParser.detectFormat(newValue);
        setFormatInfo(
          `Detected: ${detection.format} (${Math.round(detection.confidence * 100)}% confidence)`
        );
      }
    } else {
      setError(null);
      setFormatInfo('');
    }
  };

  const handlePlay = (showFlowchart?: boolean) => {
    const parseResult = unifiedParser.parse(value);

    if (!parseResult.success) {
      alert(`Failed to parse flowchart: ${parseResult.error}`);
      return;
    }

    const flowchart = parseResult.flow!;

    try {
      // Debug: log the parsed flowchart
      console.log('Parsed flowchart:', flowchart);

      // Debug: log decision nodes specifically
      const decisionNodes = flowchart.nodes.filter(
        (n: NodeDefinition) => n.outlets && n.outlets.length > 1
      );
      console.log('Decision nodes:', decisionNodes);

      onPlay(flowchart, showFlowchart);
    } catch (error) {
      alert(
        `Failed to parse Mermaid: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // const runAnalysis = useCallback(async () => {
  //   if (!value.trim()) {
  //     setAnalysis(null);
  //     return;
  //   }

  //   try {
  //     setIsAnalyzing(true);
  //     const parseResult = unifiedParser.parse(value);

  //     if (!parseResult.success) {
  //       console.error('Analysis failed: Unable to parse flowchart');
  //       setAnalysis(null);
  //       return;
  //     }

  //     const analysisResult = await analyzer.analyze(parseResult.flowchart!);
  //     setAnalysis(analysisResult);
  //   } catch (error) {
  //     console.error('Analysis failed:', error);
  //     setAnalysis(null);
  //   } finally {
  //     setIsAnalyzing(false);
  //   }
  // }, [value, unifiedParser, analyzer]);

  // // Auto-analyze when content changes (debounced)
  // useEffect(() => {
  //   if (!showAnalysisDialog) return;

  //   const timeoutId = setTimeout(() => {
  //     runAnalysis();
  //   }, 1000); // 1 second debounce

  //   return () => clearTimeout(timeoutId);
  // }, [value, showAnalysisDialog, runAnalysis]);

  const handleDotGenerated = (dotCode: string) => {
    handleChange(dotCode);
    setShowImageUpload(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Play Your Flowchart</h2>
        <p className="text-muted-foreground py-1">
          Create interactive flowchart experiences from your diagrams. Supports
          images and text-based flowcharts. Supported text-based flowchart
          formats:{' '}
          <strong>
            <a href="https://docs.mermaidchart.com/mermaid-oss/syntax/flowchart.html">
              Mermaid
            </a>
          </strong>
          ,{' '}
          <strong>
            <a href="https://graphviz.org/doc/info/lang.html">DOT</a>
          </strong>
          , and{' '}
          <strong>
            <a href="https://plantuml.com/activity-diagram-beta">PlantUML</a>
          </strong>{' '}
          .
        </p>
        <p className="text-muted-foreground py-1">
          You can use the "Load Example" dropdown for a quick start with
          pre-built flowcharts.
        </p>
        <p className="text-sm text-muted-foreground py-1">
          Prefer visual editor? Try our{' '}
          <a
            href={appInfo.urls.editor}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            editor (alpha)
          </a>
          .
        </p>
      </div>

      <div className="gap-4">
        {/* Editor Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Flowchart Source</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Dialog
                  open={showImageUpload}
                  onOpenChange={setShowImageUpload}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Image className="h-4 w-4" />
                      Upload Image
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload Flowchart Image</DialogTitle>
                    </DialogHeader>
                    <AuthGuard>
                      <FlowchartImageUpload
                        onDotGenerated={handleDotGenerated}
                      />
                    </AuthGuard>
                  </DialogContent>
                </Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" />
                      Load Example
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-48">
                    {flowchartExamples.map((example) => (
                      <DropdownMenuItem
                        key={example.name}
                        onClick={() => {
                          handleChange(example.code);
                          setSelectedExample(example.name);
                        }}
                      >
                        {example.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChange('')}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>

                {/*<Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAnalysisDialog(true);
                        if (value.trim()) {
                          runAnalysis();
                        }
                      }}
                      disabled={!!error || !value.trim()}
                    >
                      <MicroscopeIcon className="h-4 w-4" />
                      Analyze Flowchart
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Flowchart Analysis Results
                      </DialogTitle>
                    </DialogHeader>
                    <FlowAnalysisComponent
                      analysis={analysis}
                      isLoading={isAnalyzing}
                      onReanalyze={runAnalysis}
                    />
                  </DialogContent>
                </Dialog>*/}

                <Button
                  onClick={() => handlePlay(false)}
                  disabled={!!error || !value.trim()}
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  Play
                </Button>

                <Button
                  onClick={() => handlePlay(true)}
                  disabled={!!error || !value.trim()}
                  size="sm"
                  variant="outline"
                >
                  <Play className="h-4 w-4" />
                  Play with Flowchart
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Enter your Mermaid/DOT/PlantUML flowchart here..."
                className="w-full h-56 p-3 border rounded-md bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {error && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              {!error && formatInfo && (
                <div className="mt-3 p-2 bg-muted/50 border rounded-md">
                  <span className="text-xs text-muted-foreground">
                    {formatInfo}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Panel */}
          {!error && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">🎨 Visual Preview</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      disabled={!!error || !value.trim()}
                    >
                      <FileText />
                      View Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Generated Mermaid Syntax</DialogTitle>
                    </DialogHeader>
                    <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[60vh] text-sm font-mono">
                      {(() => {
                        const parseResult = unifiedParser.parse(value);
                        return parseResult.success
                          ? zfloToMermaid(parseResult.flow!)
                          : '// Unable to parse flowchart';
                      })()}
                    </pre>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {value.trim() ? (
                  <MermaidViz
                    flow={(() => {
                      try {
                        const parseResult = unifiedParser.parse(value);
                        if (parseResult.success) {
                          return parseResult.flow!;
                        }
                        throw new Error('Failed to parse into ZFlo flow');
                      } catch (e) {
                        console.warn('Failed to parse into ZFlo flow:', e);
                        throw e;
                      }
                    })()}
                    className="border rounded-md p-4 bg-muted/30"
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Enter some flowchart syntax to see the preview.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
