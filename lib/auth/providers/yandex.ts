import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export type YandexProfile = {
  id: string;
  login?: string;
  display_name?: string;
  real_name?: string;
  default_email?: string;
  default_avatar_id?: string;
};

export function Yandex(options: OAuthUserConfig<YandexProfile>): OAuthConfig<YandexProfile> {
  return {
    id: "yandex",
    name: "Яндекс",
    type: "oauth",
    client: {
      token_endpoint_auth_method: "client_secret_post"
    },
    authorization: {
      url: "https://oauth.yandex.ru/authorize",
      params: {
        scope: "login:email login:info"
      }
    },
    token: "https://oauth.yandex.ru/token",
    userinfo: "https://login.yandex.ru/info?format=json",
    profile(profile) {
      return {
        id: profile.id,
        name: profile.display_name || profile.real_name || profile.login || "Пользователь",
        email: profile.default_email || `yandex_${profile.id}@oauth.marketcard.local`,
        image: profile.default_avatar_id
          ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
          : undefined
      };
    },
    style: {
      bg: "#FC3F1D",
      text: "#fff"
    },
    options
  };
}
