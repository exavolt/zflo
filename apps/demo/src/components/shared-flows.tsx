import { useState } from 'react';
import {
  usePublicFlows,
  usePopularTags,
  type SharedFlow,
} from '@zflo/platform-core';
import { Play, Search, Tag, Calendar } from 'lucide-react';
import { isSupabaseAvailable } from '../lib/supabase';
import { Link } from 'react-router';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from './ui/card';
import { useAppInfo } from '@/contexts/app-info';

export function SharedFlows() {
  const appInfo = useAppInfo();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const {
    flows,
    loading: flowsLoading,
    error: flowsError,
  } = usePublicFlows({
    search: searchTerm || undefined,
    limit: 20,
  });

  const { tags, loading: tagsLoading } = usePopularTags();

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!isSupabaseAvailable) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Shared Flows Unavailable</h3>
        <p className="text-muted-foreground mb-4">
          Supabase integration is not configured. Shared flows from the
          community are not available.
        </p>
        <p className="text-sm text-muted-foreground">
          To enable this feature, configure the Supabase environment variables.
        </p>
      </div>
    );
  }

  if (flowsError) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <Tag className="h-12 w-12 mx-auto text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Failed to Load Flows</h3>
        <p className="text-muted-foreground mb-4">{flowsError}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Community Flows</h2>
        <p className="text-muted-foreground">
          Discover and play flows shared by the {appInfo.name} community.
        </p>
        <p className="text-sm text-muted-foreground py-1">
          To create your own flow, try our{' '}
          <a
            href={appInfo.urls.editor}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            alpha version of the editor
          </a>
          .
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search flows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>

        {/* Popular Tags */}
        {!tagsLoading && tags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Popular Tags:</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {flowsLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Flows Grid */}
      {!flowsLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {flows.map((flow: SharedFlow) => (
            <Card key={flow.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="truncate">{flow.title}</CardTitle>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    {flow.created_at
                      ? new Date(flow.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0 break-words">
                {flow.description && <p>{flow.description}</p>}
              </CardContent>

              <CardFooter className="flex gap-2 mt-auto">
                <Button asChild>
                  <Link to={`/play/${flow.id}`}>
                    <Play />
                    <span>Play</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!flowsLoading && flows.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <Search className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Flows Found</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedTags.length > 0
              ? 'Try adjusting your search or filters'
              : 'No public flows are available yet'}
          </p>
        </div>
      )}
    </div>
  );
}
