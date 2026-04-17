import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getServerAuth } from "@/lib/server-auth";

export default async function RegisterPage() {
  const auth = await getServerAuth();
  if (auth) {
    redirect("/profile");
  }

  return (
    <section className="centered-page">
      <h1>Register</h1>
      <p>Create an account and start shopping.</p>
      <AuthForm mode="register" />
      <p>
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </section>
  );
}
