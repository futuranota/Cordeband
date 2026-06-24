import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadBusinessBanner } from '@/lib/supabase/business-storage';
import { MAX_IMAGE_BYTES, validateUpload } from '@/lib/upload-validation';
import type { LocalBusiness } from '@/types/database';

export async function GET(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: dbErr } = await admin
    .from('local_businesses')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ businesses: (data ?? []) as LocalBusiness[] });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const name = String(form.get('name') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const address = String(form.get('address') ?? '').trim();
  const city = String(form.get('city') ?? '').trim();
  const postalCode = String(form.get('postal_code') ?? '').trim();
  const mapsUrl = String(form.get('maps_url') ?? '').trim();
  const sortOrder = Number(form.get('sort_order') ?? '0') || 0;
  const active = form.get('active') !== 'false';
  const banner = form.get('banner');

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }
  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }
  if (banner instanceof File && banner.size > 0) {
    const bannerCheck = await validateUpload(banner, {
      kind: 'image',
      maxBytes: MAX_IMAGE_BYTES,
    });
    if (!bannerCheck.ok) {
      return NextResponse.json({ error: bannerCheck.error }, { status: bannerCheck.status });
    }
  }

  const admin = createAdminClient();
  const { data: business, error: insertErr } = await admin
    .from('local_businesses')
    .insert({
      name,
      description: description || null,
      address,
      city,
      postal_code: postalCode || null,
      maps_url: mapsUrl || null,
      active,
      sort_order: sortOrder,
    })
    .select('*')
    .single();

  if (insertErr || !business) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  if (banner instanceof File && banner.size > 0) {
    try {
      const { url } = await uploadBusinessBanner(
        business.id,
        banner,
        banner.name,
        banner.type || 'image/jpeg',
      );
      const { data: updated, error: updateErr } = await admin
        .from('local_businesses')
        .update({ banner_url: url, updated_at: new Date().toISOString() })
        .eq('id', business.id)
        .select('*')
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ business: updated as LocalBusiness });
    } catch (uploadErr) {
      await admin.from('local_businesses').delete().eq('id', business.id);
      const message = uploadErr instanceof Error ? uploadErr.message : 'Banner upload failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ business: business as LocalBusiness });
}
