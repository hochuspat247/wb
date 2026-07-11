import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  deriveFromDemo,
  deriveRegistrationProduct,
  type RegistrationProduct,
  type RegistrationSource,
  type SignupContextInput,
  truncateReferrer
} from "@/lib/auth/registrationMeta";
import { isAdminProductId } from "@/lib/admin/products";

function resolveProduct(input: SignupContextInput): RegistrationProduct {
  return deriveRegistrationProduct({
    callbackUrl: input.callbackUrl,
    referrer: input.referrer,
    product: input.product
  });
}

export async function applySignupContext(userId: string, input: SignupContextInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      registrationProduct: true,
      registrationSource: true,
      registrationReferrer: true,
      registrationCallbackUrl: true,
      registeredFromDemo: true
    }
  });

  if (!user) {
    return { updated: false };
  }

  const updates: Partial<typeof users.$inferInsert> = {};
  const product = resolveProduct(input);

  if (!user.registrationProduct && product !== "unknown") {
    updates.registrationProduct = product;
  }

  if (!user.registrationCallbackUrl && input.callbackUrl) {
    updates.registrationCallbackUrl = input.callbackUrl.slice(0, 500);
  }

  if (!user.registrationSource && input.source) {
    updates.registrationSource = input.source;
  }

  if (!user.registrationReferrer && input.referrer) {
    updates.registrationReferrer = truncateReferrer(input.referrer, 500);
  }

  if (!user.registeredFromDemo && deriveFromDemo(input.callbackUrl, input.fromDemo)) {
    updates.registeredFromDemo = true;
  }

  if (!Object.keys(updates).length) {
    return { updated: false };
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  return { updated: true };
}

export async function applySignupContextOnRegister(
  email: string,
  input: SignupContextInput & { source: RegistrationSource }
) {
  const product = resolveProduct(input);

  await db
    .update(users)
    .set({
      registrationSource: input.source,
      registrationProduct: product !== "unknown" ? product : null,
      registrationCallbackUrl: input.callbackUrl?.slice(0, 500) ?? null,
      registrationReferrer: truncateReferrer(input.referrer, 500),
      registeredFromDemo: deriveFromDemo(input.callbackUrl, input.fromDemo)
    })
    .where(eq(users.email, email));
}

export async function applySignupContextForNewOAuthUser(
  userId: string,
  input: SignupContextInput & { source: RegistrationSource }
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { registrationSource: true }
  });

  if (!user || user.registrationSource) {
    return;
  }

  const product = resolveProduct(input);

  await db
    .update(users)
    .set({
      registrationSource: input.source,
      registrationProduct: product !== "unknown" ? product : null,
      registrationCallbackUrl: input.callbackUrl?.slice(0, 500) ?? null,
      registrationReferrer: truncateReferrer(input.referrer, 500),
      registeredFromDemo: deriveFromDemo(input.callbackUrl, input.fromDemo)
    })
    .where(eq(users.id, userId));
}

export function parseSignupProduct(value?: string | null): RegistrationProduct | undefined {
  return isAdminProductId(value) ? value : undefined;
}
