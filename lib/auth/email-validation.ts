import { promises as dns } from "dns";
import { getEmailFormatError, normalizeEmail } from "@/lib/auth/email-format";

const DOMAIN_LOOKUP_TIMEOUT_MS = 5_000;

export { getEmailFormatError, isValidEmailFormat, normalizeEmail } from "@/lib/auth/email-format";

async function domainAcceptsMail(domain: string) {
  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain), DOMAIN_LOOKUP_TIMEOUT_MS);
    if (mxRecords.length > 0) {
      return true;
    }
  } catch {
    // Fall through to A-record lookup.
  }

  try {
    const addresses = await withTimeout(dns.resolve4(domain), DOMAIN_LOOKUP_TIMEOUT_MS);
    return addresses.length > 0;
  } catch {
    return false;
  }
}

export async function getEmailDomainError(email: string) {
  const formatError = getEmailFormatError(email);
  if (formatError) {
    return formatError;
  }

  const domain = normalizeEmail(email).split("@")[1];
  const acceptsMail = await domainAcceptsMail(domain);

  if (!acceptsMail) {
    return "Домен email не принимает почту. Проверьте адрес.";
  }

  return null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("DNS lookup timeout")), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
