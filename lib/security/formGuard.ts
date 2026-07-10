type AntiBotInput = {
  honeypot?: string;
};

let formStartedAt = Date.now();

export function resetFormGuardClock() {
  formStartedAt = Date.now();
}

export function buildAntiBotPayload(input: AntiBotInput) {
  return {
    ...input,
    formStartedAt
  };
}
