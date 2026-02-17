import { getCurrentUser } from "@/lib/auth";
import { getAmbassadorStats } from "@/lib/actions";
import { redirect } from "next/navigation";
import { AmbassadorDashboard } from "@/components/ambassador-dashboard";

export const dynamic = "force-dynamic";

export default async function AmbassadorPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ambassador" && user.role !== "admin")) {
    redirect("/");
  }

  const stats = await getAmbassadorStats();
  if ("error" in stats) redirect("/");

  return <AmbassadorDashboard user={user} stats={stats as never} />;
}
