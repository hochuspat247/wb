import { redirect } from "next/navigation";

type Props = { params: Promise<{ path?: string[] }> };

export default async function StoryStydioCatchAll({ params }: Props) {
  const resolved = await params;
  const suffix = resolved.path?.length ? `/${resolved.path.join("/")}` : "";
  redirect(`/storystudio${suffix}`);
}
