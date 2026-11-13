import { getForecast } from '@/lib/server/forecast';
import { validateRequest } from '@/lib/server/forecast/core';

const error = (code: string, status: number, fields?: Record<string, string>) => Response.json({ error: { code, ...(fields && { fields }) } }, { status });

export async function POST(request: Request) {
  const declared = request.headers.get('content-length');
  if (declared && Number(declared) > 4096) return error('BODY_TOO_LARGE', 413);
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return error('BODY_TOO_LARGE', 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return error('INVALID_JSON', 400); }
  const validated = validateRequest(body);
  if (!validated.request) return error('INVALID_FIELDS', 422, validated.fields);
  try {
    const result = getForecast(validated.request);
    return result ? Response.json(result) : error('FLIGHT_NOT_FOUND', 404);
  } catch { return error('DATA_UNAVAILABLE', 503); }
}
