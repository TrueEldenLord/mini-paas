export type DeploymentStatus = 'queued' | 'building' | 'running' | 'failed';

export interface Deployment {
  id: string;
  repo_url: string;
  status: DeploymentStatus;
  created_at: string;
  updated_at: string;
  container_id: string | null;
  public_url: string | null;
  logs: string | null;
}

export interface CreateDeploymentPayload {
  repo_url: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}
