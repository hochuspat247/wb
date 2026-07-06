import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

type VkUserResponse = {
  response?: Array<{
    id: number;
    first_name?: string;
    last_name?: string;
    photo_200?: string;
  }>;
};

export function VK(options: OAuthUserConfig<VkUserResponse>): OAuthConfig<VkUserResponse> {
  return {
    id: "vk",
    name: "ВКонтакте",
    type: "oauth",
    authorization: {
      url: "https://oauth.vk.com/authorize",
      params: {
        scope: "email",
        response_type: "code",
        v: "5.131"
      }
    },
    token: {
      url: "https://oauth.vk.com/access_token"
    },
    userinfo: {
      url: "https://api.vk.com/method/users.get",
      async request({ tokens }: { tokens: Record<string, unknown> }) {
        const response = await fetch(
          `https://api.vk.com/method/users.get?fields=photo_200&access_token=${tokens.access_token}&v=5.131`
        );
        return response.json();
      }
    },
    profile(profile, tokens) {
      const user = profile.response?.[0];
      const tokenEmail = (tokens as { email?: string }).email;
      const id = String(user?.id ?? tokens.providerAccountId);

      return {
        id,
        name: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Пользователь VK",
        email: tokenEmail || `vk_${id}@oauth.marketcard.local`,
        image: user?.photo_200
      };
    },
    style: {
      bg: "#0077FF",
      text: "#fff"
    },
    options
  };
}
