// A successful connection selects one environment; credentials and history are retained.
export function connectionState(current, environment, connected) {
  if (!connected) return { ...current, [environment]: false };
  if (environment === "sandbox" && current.production) {
    throw Object.assign(new Error("Disconnect Production before connecting Sandbox."), { status: 409 });
  }
  return { sandbox: environment === "sandbox", production: environment === "production" };
}