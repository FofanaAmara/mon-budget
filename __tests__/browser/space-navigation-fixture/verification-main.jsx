import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import InvitationResponse from '@/components/spaces/InvitationResponse';
import { Navigation } from './router.jsx';
window.invitationResponseCalls = [];
window.acceptanceNavigation = [];
window.preferenceRequests = [];
function Fixture() {
  const [open, setOpen] = useState(true);
  const token = new URLSearchParams(window.location.search).has('inbox') ? undefined : '11111111-1111-4111-8111-111111111111.' + 'a'.repeat(43);
  return <Navigation.Provider value={{ pathname: '/invitation/fixture', router: {
    replace: href => window.acceptanceNavigation.push(href),
    push: href => window.acceptanceNavigation.push(href),
  } }}>
    <button onClick={() => setOpen(false)}>Fermer l’invitation</button>
    {open && <InvitationResponse id="11111111-1111-4111-8111-111111111111" token={token} />}
  </Navigation.Provider>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
