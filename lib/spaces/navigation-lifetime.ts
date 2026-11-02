/** One lifetime per mounted financial space; asynchronous callbacks keep their original lifetime. */
export function createSpaceLifetime() {
  let active = true;
  return {
    isActive: () => active,
    leave: () => {
      active = false;
    },
    stay: () => {
      active = true;
    },
  };
}
