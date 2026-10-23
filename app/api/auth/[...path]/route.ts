import { auth } from '@/lib/auth/server';

// SameSite is configured in the SDK so proxy, middleware and server actions agree.
export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();
