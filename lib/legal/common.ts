import { BRAND } from "@/lib/branding";
import { LEGAL_OPERATOR } from "@/lib/legal/operator";

export const LEGAL_SERVICE_NAMES = `${BRAND.marketCard} и ${BRAND.storyStudio}`;

export const LEGAL_OPERATOR_BLOCK =
  `${LEGAL_OPERATOR.name}, ИНН ${LEGAL_OPERATOR.inn}, ОГРНИП ${LEGAL_OPERATOR.ogrnip}`;

export const LEGAL_SITE = LEGAL_OPERATOR.siteUrl;

export const LEGAL_CONTACT = LEGAL_OPERATOR.email;
