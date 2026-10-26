export async function rememberSpace(id) {
  window.preferenceRequests.push(id);
  if (window.deferRemember)
    await new Promise((resolve) => {
      window.resolveRemember = resolve;
    });
  return { ok: true, data: { id } };
}

export async function createSpace(input) {
  window.creationRequests = (window.creationRequests || []).concat([input]);
  if (window.deferCreation)
    await new Promise((resolve) => {
      window.resolveCreation = resolve;
    });
  return {
    ok: true,
    data: {
      id: "33333333-3333-4333-8333-333333333333",
      name: input.name,
      memberCount: 1,
      createdAt: "",
    },
  };
}
export async function inviteToSpace() {
  return { ok: true, data: { deliveryStatus: "sent" } };
}

export function respondToInvitation(id, response, token) {
  window.invitationResponseCalls.push({ id, response, token });
  return new Promise(resolve => { window.resolveInvitationResponse = resolve; });
}
