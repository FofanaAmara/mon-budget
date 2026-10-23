import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import InvitationVerification from '@/components/spaces/InvitationVerification';
import { VerificationSession } from './verification-auth.jsx';
window.verificationCalls = [];
function Fixture() {
  const [actor, setActor] = useState('alice');
  const [open, setOpen] = useState(true);
  return <VerificationSession.Provider value={{ data: { user: { id: actor } }, isPending: false, error: null }}>
    <button onClick={() => setActor('bob')}>Changer la session de test</button>
    <button onClick={() => setOpen(false)}>Fermer la vérification</button>
    {open && <InvitationVerification token={'11111111-1111-4111-8111-111111111111.' + 'a'.repeat(43)} actorId="alice" />}
  </VerificationSession.Provider>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
