export async function rememberSpace(id) {
  window.preferenceRequests.push(id);
  if (window.deferRemember)
    await new Promise((resolve) => {
      window.resolveRemember = resolve;
    });
  return { ok: true, data: { id } };
}
