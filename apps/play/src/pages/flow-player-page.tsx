import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { FlowDefinition } from '@zflo/core';
import { getSharedFlow, type SharedFlow } from '@zflo/platform-core';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { IntegratedFlowPlayer } from '../components/integrated-flow-player';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CardHeader, CardTitle, CardContent, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FlowPlayerPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const searchId = searchParams.get('id');
  const id = paramId || searchId;
  const [flow, setFlow] = useState<SharedFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [enableTypingAnimation, setEnableTypingAnimation] = useState(true);

  useEffect(() => {
    async function loadFlow() {
      if (!id) {
        setError('No flow ID provided');
        setLoading(false);
        return;
      }

      try {
        const sharedFlow = await getSharedFlow(id);
        if (!sharedFlow) {
          setError('Flow not found');
        } else {
          setFlow(sharedFlow);
        }
      } catch (err) {
        console.error('Failed to load flow:', err);
        setError('Failed to load flow');
      } finally {
        setLoading(false);
      }
    }

    loadFlow();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading flow...</span>
        </div>
      </div>
    );
  }

  if (error || !flow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Flow Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || 'The requested flow could not be found.'}
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Demo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-semibold">{flow.title}</h1>
            <p className="text-sm text-muted-foreground">
              Shared on{' '}
              {flow.created_at
                ? new Date(flow.created_at).toLocaleDateString()
                : 'Unknown'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-flowchart">Show Flowchart</Label>
              <Switch
                id="show-flowchart"
                checked={showFlowchart}
                onCheckedChange={setShowFlowchart}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="typing-animation">Enable Typing Animation</Label>
              <Switch
                id="typing-animation"
                checked={enableTypingAnimation}
                onCheckedChange={setEnableTypingAnimation}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 h-[calc(100vh-80px)]">
        {flow.flow_data ? (
          <IntegratedFlowPlayer
            flow={flow.flow_data as unknown as FlowDefinition}
            showFlowchart={showFlowchart}
            enableTypingAnimation={enableTypingAnimation}
          />
        ) : null}
      </main>
    </div>
  );
}
