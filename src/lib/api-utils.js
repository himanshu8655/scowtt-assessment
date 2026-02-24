export function normalizeApiError(status, parsed) {
  return {
    status,
    code: parsed?.code ?? "UNKNOWN_ERROR",
    message: parsed?.message ?? "Unexpected API error",
  };
}
