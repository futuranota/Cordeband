const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-70b-versatile';

const SYSTEM_PROMPT = `Eres un compositor musical profesional. Recibes el género, los stems que el usuario quiere practicar, y una descripción de para quién es la canción, en qué momento la van a escuchar y cómo debe sonar.

Responde ÚNICAMENTE con un JSON válido. Sin texto extra, sin markdown, sin backticks. Estructura exacta:
{
  "titulo": "Título de la canción",
  "estructura": [
    {"parte": "Intro",      "descripcion": "breve descripción musical de esta sección"},
    {"parte": "Verso 1",    "descripcion": "..."},
    {"parte": "Pre-coro",   "descripcion": "..."},
    {"parte": "Coro",       "descripcion": "..."},
    {"parte": "Verso 2",    "descripcion": "..."},
    {"parte": "Coro",       "descripcion": "..."},
    {"parte": "Puente",     "descripcion": "..."},
    {"parte": "Coro final", "descripcion": "..."},
    {"parte": "Outro",      "descripcion": "..."}
  ],
  "letra": "letra completa con secciones etiquetadas (INTRO, VERSO 1, PRE-CORO, CORO, etc.) separadas por saltos de línea dobles",
  "suno_prompt": "prompt en inglés listo para Suno — genre, featured instruments priorizando los stems elegidos, mood, tempo, vocal style — máximo 200 caracteres"
}

La letra en español. El suno_prompt en inglés. Refleja la vibra, el momento y la audiencia que describió el usuario.`;

export async function generateComposition(
  genre: string | null,
  stems: string[],
  description: string,
): Promise<string> {
  const genreText = genre ? `Género: ${genre}` : 'Género: libre';
  const stemsText = stems.length > 0 ? stems.join(', ') : 'sin stems específicos';

  const userMessage = `${genreText}
Stems a practicar: ${stemsText}
Descripción del usuario: ${description}`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 1500,
      temperature: 0.8,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  return content.replace(/```json|```/g, '').trim();
}
