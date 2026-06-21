import { NextRequest, NextResponse } from 'next/server';
import { generateComposition } from '@/lib/groq';
import { createClient } from '@/lib/supabase/server';
import type { StudioApiResponse, StudioCompositionRequest } from '@/types/studio';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<StudioApiResponse>(
        { success: false, error: 'No autenticado.' },
        { status: 401 },
      );
    }

    const body: StudioCompositionRequest = await req.json();
    const { genre, stems, description } = body;

    if (!description?.trim()) {
      return NextResponse.json<StudioApiResponse>(
        { success: false, error: 'La descripción es requerida.' },
        { status: 400 },
      );
    }

    const { data: credited, error: creditError } = await supabase.rpc('deduct_credit', {
      p_user_id: user.id,
      p_action: 'studio_compose',
      p_metadata: {
        genre: genre ?? null,
        stems: stems.map((s) => s.stem),
        description: description.slice(0, 200),
      },
    });

    if (creditError) {
      console.error('Credit RPC error:', creditError);
      return NextResponse.json<StudioApiResponse>(
        { success: false, error: 'Error al verificar créditos.' },
        { status: 500 },
      );
    }

    if (!credited) {
      return NextResponse.json<StudioApiResponse>(
        { success: false, error: 'Sin créditos disponibles. Actualiza tu plan para continuar.' },
        { status: 402 },
      );
    }

    const stemLabels = stems.map((s) => s.label);
    const rawJson = await generateComposition(genre, stemLabels, description);

    let composition;
    try {
      composition = JSON.parse(rawJson);
    } catch {
      await supabase.rpc('refund_credit', {
        p_user_id: user.id,
        p_action: 'studio_compose_refund',
        p_metadata: { reason: 'parse_error' },
      });
      return NextResponse.json<StudioApiResponse>(
        { success: false, error: 'Error al procesar la respuesta. Crédito reembolsado.' },
        { status: 500 },
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    return NextResponse.json<StudioApiResponse>({
      success: true,
      data: composition,
      creditsRemaining: profile?.credits_remaining ?? 0,
    });
  } catch (err) {
    console.error('Studio compose error:', err);
    return NextResponse.json<StudioApiResponse>(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 },
    );
  }
}
