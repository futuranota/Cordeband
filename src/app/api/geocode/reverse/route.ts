import { NextResponse } from 'next/server';

type NominatimAddress = {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  postcode?: string;
};

type NominatimResult = {
  display_name?: string;
  address?: NominatimAddress;
};

function pickCity(address: NominatimAddress | undefined): string | null {
  if (!address) return null;
  return address.city ?? address.town ?? address.village ?? address.municipality ?? null;
}

function pickAddressLine(address: NominatimAddress | undefined): string | null {
  if (!address) return null;
  const parts = [address.road, address.house_number].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return NextResponse.json({ error: 'invalid coordinates' }, { status: 400 });
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(latNum));
    url.searchParams.set('lon', String(lonNum));
    url.searchParams.set('addressdetails', '1');

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Cordeband/1.0 (signup location; contact@cordeband.site)',
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'geocode failed' }, { status: 502 });
    }

    const data = (await res.json()) as NominatimResult;
    const address = data.address;

    return NextResponse.json({
      city: pickCity(address),
      postalCode: address?.postcode ?? null,
      addressLine: pickAddressLine(address) ?? data.display_name ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'geocode failed' }, { status: 500 });
  }
}
