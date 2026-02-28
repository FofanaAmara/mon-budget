import { AuthView } from '@neondatabase/auth/react';
import type { AuthLocalization } from '@neondatabase/auth/react';

const frLocalization: Partial<AuthLocalization> = {
  SIGN_IN: 'Connexion',
  SIGN_IN_ACTION: 'Se connecter',
  SIGN_IN_DESCRIPTION: 'Entrez votre email pour acceder a votre compte',
  SIGN_IN_WITH: 'Se connecter avec',
  SIGN_UP: 'Inscription',
  SIGN_UP_ACTION: 'Creer un compte',
  SIGN_UP_DESCRIPTION: 'Entrez vos informations pour creer un compte',
  SIGN_UP_EMAIL: 'Consultez vos emails pour le lien de verification.',
  SIGN_OUT: 'Deconnexion',
  EMAIL: 'Email',
  EMAIL_PLACEHOLDER: 'votre@email.com',
  EMAIL_REQUIRED: "L'adresse email est requise",
  PASSWORD: 'Mot de passe',
  PASSWORD_REQUIRED: 'Le mot de passe est requis',
  PASSWORD_TOO_SHORT: 'Mot de passe trop court',
  PASSWORD_TOO_LONG: 'Mot de passe trop long',
  CONFIRM_PASSWORD: 'Confirmer le mot de passe',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Confirmer le mot de passe',
  CONFIRM_PASSWORD_REQUIRED: 'La confirmation du mot de passe est requise',
  PASSWORDS_DO_NOT_MATCH: 'Les mots de passe ne correspondent pas',
  NAME: 'Nom',
  NAME_PLACEHOLDER: 'Nom complet',
  FORGOT_PASSWORD: 'Mot de passe oublie',
  FORGOT_PASSWORD_LINK: 'Mot de passe oublie ?',
  FORGOT_PASSWORD_ACTION: 'Envoyer le lien',
  FORGOT_PASSWORD_DESCRIPTION: 'Entrez votre email pour reinitialiser votre mot de passe',
  FORGOT_PASSWORD_EMAIL: 'Consultez vos emails pour le lien de reinitialisation.',
  RESET_PASSWORD: 'Reinitialiser le mot de passe',
  RESET_PASSWORD_ACTION: 'Enregistrer le nouveau mot de passe',
  RESET_PASSWORD_DESCRIPTION: 'Entrez votre nouveau mot de passe ci-dessous',
  RESET_PASSWORD_SUCCESS: 'Mot de passe reinitialise avec succes',
  DONT_HAVE_AN_ACCOUNT: "Vous n'avez pas de compte ?",
  ALREADY_HAVE_AN_ACCOUNT: 'Vous avez deja un compte ?',
  OR_CONTINUE_WITH: 'Ou continuer avec',
  CONTINUE: 'Continuer',
  CANCEL: 'Annuler',
  PASSWORD_PLACEHOLDER: 'Mot de passe',
  NEW_PASSWORD_PLACEHOLDER: 'Nouveau mot de passe',
  CURRENT_PASSWORD_PLACEHOLDER: 'Mot de passe actuel',
  GO_BACK: 'Retour',
};

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '24px 20px',
      background: 'var(--surface-ground)',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'var(--accent, #3D3BF3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 56 56" fill="none">
            <path d="M8 44 L18 14 L28 34 L38 8 L48 44" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Mes Finances
        </h1>
      </div>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <AuthView pathname={`/auth/${path}`} localization={frLocalization} />
      </div>
    </main>
  );
}
