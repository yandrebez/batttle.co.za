"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        price: Number(price),
        imageUrl: imageUrl || undefined,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Failed to create product");
      setLoading(false);
      return;
    }

    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setLoading(false);
    router.refresh();
  };

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Product name
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label>
        Description
        <input value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Price
        <input
          type="number"
          value={price}
          min={0}
          step="0.01"
          onChange={(event) => setPrice(event.target.value)}
          required
        />
      </label>
      <label>
        Image URL
        <input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
      </label>
      {error && <p className="error-text">{error}</p>}
      <button className="solid-btn" type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create product"}
      </button>
    </form>
  );
}
