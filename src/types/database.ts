import type { PlanId } from '@/lib/plans';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  plan: PlanId;
  intended_plan: PlanId | null;
  songs_used_this_month: number;
  stripe_customer_id: string | null;
  address_line: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
};

export type LocalBusiness = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  maps_url: string | null;
  banner_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FunnelRow = {
  id: string;
  email: string;
  full_name: string | null;
  plan: PlanId;
  intended_plan: PlanId | null;
  city: string | null;
  postal_code: string | null;
  created_at: string;
};
