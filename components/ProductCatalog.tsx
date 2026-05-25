"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Spinner } from "@/components/Spinner";
import { addToCart } from "@/lib/cart";
import type { CartItem } from "@/types/cart";
import { useCurrencySymbol } from "@/components/CurrencyProvider";
import styles from "./ProductCatalog.module.css";

type ProductSize = { id: number; size: string; quantity: number };

type Product = Omit<CartItem, "quantity" | "size"> & {
  images?: string[];
  hasSizes: boolean;
  sizes: ProductSize[];
};

type ProductCatalogProps = {
  sectionId?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  variant?: "default" | "landing";
};

export function ProductCatalog({
  sectionId,
  eyebrow = "Shop",
  title = "Products",
  description = "Browse live products from the store catalog.",
  variant = "default",
}: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [addedState, setAddedState] = useState<Record<string, boolean>>({});
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<Record<number, number>>({});
  const [loadError, setLoadError] = useState("");
  const currencySymbol = useCurrencySymbol();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = (await response.json()) as { products?: Product[]; message?: string };

        if (!response.ok) {
          throw new Error(data.message || "Failed to load products.");
        }

        setProducts(data.products || []);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load products.");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    const size = product.hasSizes ? selectedSizes[product.id] : undefined;
    if (product.hasSizes && !size) {
      return;
    }

    addToCart(product, size);
    const key = `${product.id}-${size ?? ""}`;
    setAddedState((previous) => ({ ...previous, [key]: true }));

    window.setTimeout(() => {
      setAddedState((previous) => ({ ...previous, [key]: false }));
    }, 1200);
  };

  return (
    <section
      id={sectionId}
      className={`${styles.catalogSection} ${variant === "landing" ? styles.catalogSectionLanding : ""}`}
    >
      <div className={styles.headingWrap}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.heading}>{title}</h2>
        <p className={styles.subheading}>{description}</p>
      </div>

      {isLoadingProducts ? (
        <div className={styles.loadingState}>
          <Spinner label="Loading products..." />
        </div>
      ) : null}

      {!isLoadingProducts && loadError ? <p className={styles.subheading}>{loadError}</p> : null}

      {!isLoadingProducts ? (
        <div className={styles.productGrid}>
          {products.map((product) => {
            const selectedSize = selectedSizes[product.id];
            const cardKey = `${product.id}-${selectedSize ?? ""}`;
            const isAdded = Boolean(addedState[cardKey]);
            const galleryImages = Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)));
            const selectedImageIndex = selectedImageIndexes[product.id] ?? 0;
            const activeImage = galleryImages[selectedImageIndex] || product.image;
            const outOfStock =
              product.hasSizes && selectedSize
                ? (product.sizes.find((size) => size.size === selectedSize)?.quantity ?? 0) === 0
                : false;

            return (
              <article key={product.id} className={styles.productCard}>
                <div className={styles.imageWrap}>
                  <Image
                    src={activeImage}
                    alt={product.name}
                    width={120}
                    height={120}
                    unoptimized={activeImage.startsWith("data:")}
                    className={styles.productImage}
                  />
                </div>

                {galleryImages.length > 1 ? (
                  <div className={styles.galleryStrip}>
                    {galleryImages.map((image, imageIndex) => (
                      <button
                        key={`${product.id}-${imageIndex}`}
                        type="button"
                        className={`${styles.galleryThumb} ${imageIndex === selectedImageIndex ? styles.galleryThumbActive : ""}`}
                        onClick={() =>
                          setSelectedImageIndexes((prev) => ({
                            ...prev,
                            [product.id]: imageIndex,
                          }))
                        }
                        aria-label={`View angle ${imageIndex + 1} for ${product.name}`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} angle ${imageIndex + 1}`}
                          width={44}
                          height={44}
                          unoptimized={image.startsWith("data:")}
                          className={styles.galleryThumbImage}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>

                {product.hasSizes && product.sizes.length > 0 ? (
                  <div className={styles.sizeSelector}>
                    <p className={styles.sizeLabel}>Select size:</p>
                    <div className={styles.sizePills}>
                      {product.sizes.map((size) => (
                        <button
                          key={size.id}
                          type="button"
                          disabled={size.quantity === 0}
                          className={`${styles.sizePill} ${selectedSize === size.size ? styles.sizePillActive : ""} ${size.quantity === 0 ? styles.sizePillSoldOut : ""}`}
                          onClick={() =>
                            setSelectedSizes((prev) => ({ ...prev, [product.id]: size.size }))
                          }
                        >
                          {size.size}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className={styles.productFooter}>
                  <span className={styles.price}>{currencySymbol}{product.price.toFixed(2)}</span>
                  <button
                    type="button"
                    className={`${styles.addButton} ${isAdded ? styles.addedButton : ""}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={isAdded || outOfStock || (product.hasSizes && !selectedSize)}
                  >
                    {isAdded
                      ? "Added"
                      : outOfStock
                        ? "Sold out"
                        : product.hasSizes && !selectedSize
                          ? "Select size"
                          : "Add to cart"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}