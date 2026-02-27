import { auth } from './server';

export async function requireAuth(): Promise<string> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    throw new Error('Non authentifie');
  }
  return session.user.id;
}
