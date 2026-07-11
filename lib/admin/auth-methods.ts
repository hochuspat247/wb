export function formatUserAuthMethods(input: { passwordHash?: string | null; providers: string[] }) {
  const methods: string[] = [];

  if (input.passwordHash) {
    methods.push("Email");
  }

  if (input.providers.includes("vk")) {
    methods.push("VK / Mail");
  }

  if (input.providers.includes("yandex")) {
    methods.push("Яндекс");
  }

  if (!methods.length) {
    return "—";
  }

  return methods.join(" · ");
}
