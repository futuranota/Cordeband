import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  bannerPathFromUrl,
  removeBusinessBanner,
  uploadBusinessBanner,
} from '@/lib/supabase/business-storage';
import { MAX_IMAGE_BYTES, validateUpload } from '@/lib/upload-validation';
import type { LocalBusiness } from '@/types/database';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await context.params;
  const contentType = request.headers.get('content-type') ?? '';

  const admin = createAdminClient();
  const { data: existing, error: fetchErr } = await admin
    .from('local_businesses')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (contentType.includes('multipart/form-data')) {
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
    const sortOrderRaw = form.get('sort_order');
    const activeRaw = form.get('active');
    const banner = form.get('banner');
    const removeBanner = form.get('remove_banner') === 'true';

    if (name) updates.name = name;
    if (description || form.has('description')) updates.description = description || null;
    if (address) updates.address = address;
    if (city) updates.city = city;
    if (form.has('postal_code')) updates.postal_code = postalCode || null;
    if (form.has('maps_url')) updates.maps_url = mapsUrl || null;
    if (sortOrderRaw !== null) updates.sort_order = Number(sortOrderRaw) || 0;
    if (activeRaw !== null) updates.active = activeRaw !== 'false';

    if (removeBanner) {
      await removeBusinessBanner(bannerPathFromUrl(existing.banner_url));
      updates.banner_url = null;
    }

    if (banner instanceof File && banner.size > 0) {
      const bannerCheck = await validateUpload(banner, {
        kind: 'image',
        maxBytes: MAX_IMAGE_BYTES,
      });
      if (!bannerCheck.ok) {
        return NextResponse.json({ error: bannerCheck.error }, { status: bannerCheck.status });
      }
      try {
        await removeBusinessBanner(bannerPathFromUrl(existing.banner_url));
        const { url } = await uploadBusinessBanner(id, banner, banner.name, banner.type || 'image/jpeg');
        updates.banner_url = url;
      } catch (uploadErr) {
        const message = uploadErr instanceof Error ? uploadErr.message : 'Banner upload failed';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  } else {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if ('description' in body) updates.description = typeof body.description === 'string' ? body.description.trim() || null : null;
    if (typeof body.address === 'string' && body.address.trim()) updates.address = body.address.trim();
    if (typeof body.city === 'string' && body.city.trim()) updates.city = body.city.trim();
    if ('postal_code' in body) {
      updates.postal_code = typeof body.postal_code === 'string' ? body.postal_code.trim() || null : null;
    }
    if ('maps_url' in body) {
      updates.maps_url = typeof body.maps_url === 'string' ? body.maps_url.trim() || null : null;
    }
    if ('sort_order' in body) updates.sort_order = Number(body.sort_order) || 0;
    if ('active' in body) updates.active = !!body.active;
  }

  const { data, error: updateErr } = await admin
    .from('local_businesses')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ business: data as LocalBusiness });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await context.params;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('local_businesses')
    .select('banner_url')
    .eq('id', id)
    .single();

  const { error: deleteErr } = await admin.from('local_businesses').delete().eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  if (existing?.banner_url) {
    await removeBusinessBanner(bannerPathFromUrl(existing.banner_url));
  }

  return NextResponse.json({ ok: true });
}
