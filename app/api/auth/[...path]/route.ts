import { auth } from '@/lib/auth/server';

const handlers = auth.handler();

type RouteCtx = { params: Promise<{ path: string[] }> };
type RouteHandler = (req: Request, ctx: RouteCtx) => Promise<Response>;

// Patch SameSite=None → SameSite=Lax for Safari ITP compatibility.
// All auth requests are same-site, so Lax is equivalent in behaviour
// but not blocked by Apple's Intelligent Tracking Prevention.
function withSameSiteLax(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const res = await handler(req, ctx);

    const cookies = res.headers.getSetCookie?.() ?? [];
    if (cookies.length === 0) return res;

    const newHeaders = new Headers(res.headers);
    newHeaders.delete('set-cookie');
    for (const cookie of cookies) {
      newHeaders.append(
        'set-cookie',
        cookie.replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
      );
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  };
}

export const GET    = withSameSiteLax(handlers.GET);
export const POST   = withSameSiteLax(handlers.POST);
export const PUT    = withSameSiteLax(handlers.PUT);
export const DELETE = withSameSiteLax(handlers.DELETE);
export const PATCH  = withSameSiteLax(handlers.PATCH);
