// Environments are independent so optional Sandbox tests never disconnect Production.
export function connectionState(current, environment, connected) {
  if (!connected) return { ...current, [environment]: false };
  return { ...current, [environment]: true };
}

/**
 * Saving FBR settings must NOT drop a working connection. The connection only needs re-testing
 * when the URLs or the token actually change; re-saving identical settings keeps it connected.
 */
export function savingDisconnects(current, { post_url, validate_url, token, clear_token }) {
  if (clear_token || token) return true;
  return post_url !== current.post_url || validate_url !== current.validate_url;
}
