import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireServerRole } from "@/lib/server-auth";
import { AdminProductForm } from "@/components/admin-product-form";

export default async function AdminDashboardPage() {
  await requireServerRole(Role.ADMIN);

  const [userCount, productCount, products] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <section className="admin-layout">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <article className="card">
          <h3>Total users</h3>
          <p>{userCount}</p>
        </article>
        <article className="card">
          <h3>Total products</h3>
          <p>{productCount}</p>
        </article>
      </div>

      <article className="card">
        <h2>Create Product</h2>
        <AdminProductForm />
      </article>

      <article className="card">
        <h2>Recent Products</h2>
        <ul className="product-list compact">
          {products.map((product) => (
            <li key={product.id}>
              <span>{product.name}</span>
              <strong>${product.price.toString()}</strong>
            </li>
          ))}
          {products.length === 0 && <li>No products yet.</li>}
        </ul>
      </article>
    </section>
  );
}
