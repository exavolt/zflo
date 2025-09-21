import { getSupabaseClient } from './client';
import type {
  SharedFlow,
  SharedFlowInsert,
  UserFlow,
  UserFlowInsert,
  UserFlowUpdate,
  FlowFilter,
  EditorData,
} from '../types';

export class SharedFlowsService {
  private get client() {
    return getSupabaseClient();
  }

  async getPublicFlows(filter: FlowFilter = {}): Promise<SharedFlow[]> {
    let query = this.client
      .from('shared_flows')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (filter.search) {
      query = query.ilike('title', `%${filter.search}%`);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.range(
        filter.offset,
        filter.offset + (filter.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch public flows: ${error.message}`);
    }

    console.log(data);

    return data || [];
  }

  async getDiscoverableFlows(filter: FlowFilter = {}): Promise<SharedFlow[]> {
    // Alias for backward compatibility
    return this.getPublicFlows(filter);
  }

  async getSharedFlow(id: string): Promise<SharedFlow | null> {
    const { data, error } = await this.client
      .from('shared_flows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch flow: ${error.message}`);
    }

    return data;
  }

  async saveSharedFlow(
    flowData: any,
    title: string,
    isPublic: boolean = false
  ): Promise<string> {
    const flowInsert: SharedFlowInsert = {
      flow_data: flowData,
      title,
      description: flowData.description,
      is_public: isPublic,
    };

    const { data, error } = await this.client
      .from('shared_flows')
      .insert(flowInsert)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save shared flow: ${error.message}`);
    }

    return data.id;
  }

  async getUserSharedFlows(): Promise<SharedFlow[]> {
    const { data, error } = await this.client
      .from('shared_flows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user shared flows: ${error.message}`);
    }

    return data || [];
  }

  async updateSharedFlowVisibility(
    id: string,
    isPublic: boolean
  ): Promise<void> {
    const { error } = await this.client
      .from('shared_flows')
      .update({ is_public: isPublic })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update flow visibility: ${error.message}`);
    }
  }

  async deleteSharedFlow(id: string): Promise<void> {
    const { error } = await this.client
      .from('shared_flows')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete shared flow: ${error.message}`);
    }
  }
}

export class UserFlowsService {
  private get client() {
    return getSupabaseClient();
  }

  async saveUserFlow(
    editorData: EditorData,
    title: string,
    metadata: any = {}
  ): Promise<string> {
    const { data, error } = await this.client
      .from('user_flows')
      .insert({
        title,
        flow_data: editorData,
        metadata,
      } as UserFlowInsert)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save flow: ${error.message}`);
    }

    return data.id;
  }

  async updateUserFlow(
    id: string,
    editorData: EditorData,
    title: string,
    metadata: any = {}
  ): Promise<void> {
    const { error } = await this.client
      .from('user_flows')
      .update({
        title,
        flow_data: editorData,
        metadata,
      } as UserFlowUpdate)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update flow: ${error.message}`);
    }
  }

  async getUserFlows(): Promise<UserFlow[]> {
    const { data, error } = await this.client
      .from('user_flows')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch flows: ${error.message}`);
    }

    return data || [];
  }

  async getUserFlow(id: string): Promise<UserFlow | null> {
    const { data, error } = await this.client
      .from('user_flows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch flow: ${error.message}`);
    }

    return data;
  }

  async deleteUserFlow(id: string): Promise<void> {
    const { error } = await this.client
      .from('user_flows')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete flow: ${error.message}`);
    }
  }
}

// Legacy exports for backward compatibility
export async function saveSharedFlow(
  flowData: any,
  title: string,
  isPublic: boolean = false
): Promise<string> {
  const service = new SharedFlowsService();
  return service.saveSharedFlow(flowData, title, isPublic);
}

export async function getSharedFlow(id: string): Promise<SharedFlow | null> {
  const service = new SharedFlowsService();
  return service.getSharedFlow(id);
}

export async function saveUserFlow(
  editorData: EditorData,
  title: string,
  metadata: any = {}
): Promise<string> {
  const service = new UserFlowsService();
  return service.saveUserFlow(editorData, title, metadata);
}

export async function updateUserFlow(
  id: string,
  editorData: EditorData,
  title: string,
  metadata: any = {}
): Promise<void> {
  const service = new UserFlowsService();
  return service.updateUserFlow(id, editorData, title, metadata);
}

export async function getUserFlows(): Promise<UserFlow[]> {
  const service = new UserFlowsService();
  return service.getUserFlows();
}

export async function getUserFlow(id: string): Promise<UserFlow | null> {
  const service = new UserFlowsService();
  return service.getUserFlow(id);
}

export async function deleteUserFlow(id: string): Promise<void> {
  const service = new UserFlowsService();
  return service.deleteUserFlow(id);
}

// New shared flow management functions
export async function getUserSharedFlows(): Promise<SharedFlow[]> {
  const service = new SharedFlowsService();
  return service.getUserSharedFlows();
}

export async function updateSharedFlowVisibility(
  id: string,
  isPublic: boolean
): Promise<void> {
  const service = new SharedFlowsService();
  return service.updateSharedFlowVisibility(id, isPublic);
}

export async function deleteSharedFlow(id: string): Promise<void> {
  const service = new SharedFlowsService();
  return service.deleteSharedFlow(id);
}

export async function getPublicFlows(
  filter: FlowFilter = {}
): Promise<SharedFlow[]> {
  const service = new SharedFlowsService();
  return service.getPublicFlows(filter);
}
