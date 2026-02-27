export interface Link {
  id: number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  creator_id: number;
  dealership_id?: number;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    full_name: string;
  };
}

export interface CreateLinkRequest {
  title: string;
  url: string;
  description?: string;
  category?: string;
}

export interface UpdateLinkRequest {
  title?: string;
  url?: string;
  description?: string;
  category?: string;
}
