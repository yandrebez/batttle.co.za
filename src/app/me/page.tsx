import { prisma } from "@/lib/prisma";
import { requireServerAuth } from "@/lib/server-auth";

export default async function MePage() {
  const auth = await requireServerAuth();

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return (
      <section className="centered-page">
        <h1>Profile</h1>
        <p>Unable to load your profile.</p>
      </section>
    );
  }

  return (
    <section className="centered-page">
      <h1>User Profile</h1>
      <div className="card">
        <p>
          <strong>Name:</strong> {user.name ?? "Not set"}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        <p>
          <strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
    </section>
  );
}
