import { getRoutes } from '@/lib/server/forecast';

export async function GET() {
  try { return Response.json(getRoutes()); }
  catch { return Response.json({ error: { code: 'DATA_UNAVAILABLE' } }, { status: 503 }); }
}
