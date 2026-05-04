export interface Project {
  id: string;
  name: string;
  urls: string[];
  track_title: boolean;
  track_desc: boolean;
  track_content: boolean;
  paused?: boolean;
  interval: number;
  concurrency: number;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ChangeRecord {
  timestamp: string;
  field: string;
  old_value: string;
  new_value: string;
  diff: string;
}

export interface PageState {
  url: string;
  content_hash?: string;
  last_checked: string;
  status: string;
  status_code?: number;
  title?: string;
  description?: string;
  h1?: string;
  text_content?: string;
  changes?: ChangeRecord[];
}

export interface State {
  pages: PageState[];
}
