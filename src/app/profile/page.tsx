import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";

export default async function ProfileRedirectPage() {
  const auth = await getServerAuth();

  if (!auth) {
    redirect("/login");
  }

  if (auth.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/me");
}
