export function requestInvitationVerification(input) {
  window.verificationCalls.push({ request: input });
  return new Promise((resolve) => { window.resolveVerification = resolve; });
}
export function verifyInvitationEmail(input) {
  window.verificationCalls.push({ verify: input });
  return new Promise((resolve) => { window.resolveVerification = resolve; });
}
