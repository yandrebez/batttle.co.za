import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getServerAuth } from "@/lib/server-auth";

export default async function LoginPage() {
  const auth = await getServerAuth();
  if (auth) {
    redirect("/profile");
  }

  return (
    <section className="centered-page">
      <h1>Login</h1>
      <p>Access your account to view your profile or admin dashboard.</p>
      <AuthForm mode="login" />
      <p>
        Need an account? <Link href="/register">Register</Link>
      </p>
    </section>
  );
}
