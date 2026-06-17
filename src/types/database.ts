import type { PlanId } from '@/lib/plans';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  plan: PlanId;
  intended_plan: PlanId | null;
  songs_used_this_month: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};
