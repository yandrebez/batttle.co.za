import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
    },
  });

  return (
    <section className="shop-layout">
      <h1>Public Shop</h1>
      <p>Browse products available to all visitors.</p>
      <ul className="product-grid">
        {products.map((product) => (
          <li key={product.id} className="card">
            <h3>{product.name}</h3>
            <p>{product.description ?? "No description provided."}</p>
            <strong>${product.price.toString()}</strong>
          </li>
        ))}
      </ul>
      {products.length === 0 && (
        <article className="card">
          <h3>No products yet</h3>
          <p>Add products from the admin dashboard to populate the shop.</p>
        </article>
      )}
    </section>
  );
}
