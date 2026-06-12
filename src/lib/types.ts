// Shared domain types (mirror of the Postgres schema).

export type IssueType =
  | 'garbage'
  | 'water_pipeline'
  | 'drainage'
  | 'road_pothole'
  | 'streetlight'
  | 'other';

export type ComplaintStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';
export type MemberRole = 'admin' | 'member';
export type EventType =
  | 'created'
  | 'assigned'
  | 'status_changed'
  | 'note_added'
  | 'photo_added';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ward_name: string | null;
  corporator_name: string | null;
  logo_url: string | null;
  theme_color: string | null;
  gallery_public: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Vasti {
  id: string;
  tenant_id: string;
  name_marathi: string;
  name_english: string;
  is_active: boolean;
}

export interface TeamMember {
  id: string;
  tenant_id: string;
  auth_user_id: string | null;
  name: string;
  phone: string | null;
  role: MemberRole;
  is_active: boolean;
}

export interface Complaint {
  id: string;
  tenant_id: string;
  ticket_code: string;
  issue_type: IssueType;
  description: string | null;
  photo_url: string | null;
  photo_public_id: string | null;
  after_photo_url: string | null;
  after_photo_public_id: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_accuracy_m: number | null;
  vasti_id: string | null;
  landmark: string;
  galli_detail: string | null;
  citizen_name: string;
  citizen_phone: string;
  status: ComplaintStatus;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface ComplaintEvent {
  id: string;
  complaint_id: string;
  actor_id: string | null;
  event_type: EventType;
  detail: string | null;
  created_at: string;
}
