"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/lib/useAuth";
import { CURRENCIES } from "@/lib/currency";
import { useCurrencySymbol } from "@/components/CurrencyProvider";
import styles from "./page.module.css";

type AdminTab = "products" | "orders" | "clients" | "settings";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN";
  createdAt: string;
  updatedAt: string;
};

type AdminOrder = {
  id: string;
  guestEmail: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  user: { id: string; email: string; name: string | null } | null;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
};

type ProductSize = {
  size: string;
  quantity: number;
};

type ProductRecord = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  isActive: boolean;
  hasSizes: boolean;
  sizes: Array<{ id: number; size: string; quantity: number }>;
  createdAt: string;
  updatedAt: string;
};

type Client = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  orders: Array<{ id: string; totalAmount: number; createdAt: string }>;
};

type AdminFormState = {
  email: string;
  name: string;
  password: string;
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  image: string;
  images: string[];
  isActive: boolean;
  hasSizes: boolean;
  sizes: ProductSize[];
};

type SiteSettingsFormState = {
  landingVideoUrl: string;
  siteBackgroundColor: string;
  menuBackgroundColor: string;
  headerRowColor: string;
  discountCodesRaw: string;
  discountPercent: number;
  currencyCode: string;
};

type StoredSiteSettings = {
  landingVideoUrl: string;
  siteBackgroundColor: string;
  menuBackgroundColor: string;
  headerRowColor: string;
  discountCodes: string[];
  discountPercent: number;
  currencyCode: string;
};

type SettingsSection = "landing" | "discounts" | "appearance" | "admins";

const orderStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

async function compressImageToDataUrl(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = source;
  });

  const maxSize = 700;
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to process image.");
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

const initialForm: AdminFormState = {
  email: "",
  name: "",
  password: "",
};

const initialProductForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  image: "",
  images: [],
  isActive: true,
  hasSizes: false,
  sizes: [],
};

const initialSiteSettingsForm: SiteSettingsFormState = {
  landingVideoUrl: "",
  siteBackgroundColor: "#eefaf2",
  menuBackgroundColor: "#ffffff",
  headerRowColor: "#ffffff",
  discountCodesRaw: "",
  discountPercent: 10,
  currencyCode: "USD",
};

function parseDiscountCodes(rawValue: string): string[] {
  return rawValue
    .split(/[,\n]/)
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length > 0);
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const currencySymbol = useCurrencySymbol();

  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [form, setForm] = useState<AdminFormState>(initialForm);
  const [productForm, setProductForm] = useState<ProductFormState>(initialProductForm);
  const [siteSettingsForm, setSiteSettingsForm] = useState<SiteSettingsFormState>(initialSiteSettingsForm);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [openSettingsSection, setOpenSettingsSection] = useState<SettingsSection>("landing");

  const isCurrentTabLoading =
    isBusy &&
    ((activeTab === "products" && products.length === 0) ||
      (activeTab === "orders" && orders.length === 0) ||
      (activeTab === "clients" && clients.length === 0) ||
      (activeTab === "settings" && admins.length === 0));

  const token = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem("battle_auth_token") || "";
  }, [user?.id]);

  const authHeaders = useMemo(() => {
    if (!token) {
      return {} as HeadersInit;
    }

    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const parseJsonSafely = async <T,>(response: Response): Promise<T | { message?: string }> => {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return { message: "Unexpected server response." };
    }
  };

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") {
      return;
    }

    const loadTabData = async () => {
      setError("");
      setNotice("");
      setIsBusy(true);

      try {
        if (activeTab === "orders") {
          const response = await fetch("/api/admin/orders", { headers: authHeaders });
          const data = (await parseJsonSafely<{ orders?: AdminOrder[]; message?: string }>(response)) as {
            orders?: AdminOrder[];
            message?: string;
          };
          if (!response.ok) {
            throw new Error(data.message || "Failed to load orders.");
          }
          setOrders(data.orders || []);
        }

        if (activeTab === "products") {
          const response = await fetch("/api/admin/products", { headers: authHeaders });
          const data = (await parseJsonSafely<{ products?: ProductRecord[]; message?: string }>(response)) as {
            products?: ProductRecord[];
            message?: string;
          };
          if (!response.ok) {
            throw new Error(data.message || "Failed to load products.");
          }
          setProducts(data.products || []);
        }

        if (activeTab === "clients") {
          const response = await fetch("/api/admin/clients", { headers: authHeaders });
          const data = (await parseJsonSafely<{ clients?: Client[]; message?: string }>(response)) as {
            clients?: Client[];
            message?: string;
          };
          if (!response.ok) {
            throw new Error(data.message || "Failed to load clients.");
          }
          setClients(data.clients || []);
        }

        if (activeTab === "settings") {
          const [adminsResponse, settingsResponse] = await Promise.all([
            fetch("/api/admin/users", { headers: authHeaders }),
            fetch("/api/admin/settings", { headers: authHeaders }),
          ]);

          const adminsData = (await parseJsonSafely<{ admins?: AdminUser[]; message?: string }>(adminsResponse)) as {
            admins?: AdminUser[];
            message?: string;
          };

          if (!adminsResponse.ok) {
            throw new Error(adminsData.message || "Failed to load admin users.");
          }

          const settingsData = (await parseJsonSafely<{
            settings?: StoredSiteSettings;
            message?: string;
          }>(settingsResponse)) as {
            settings?: StoredSiteSettings;
            message?: string;
          };

          if (!settingsResponse.ok) {
            throw new Error(settingsData.message || "Failed to load site settings.");
          }

          setAdmins(adminsData.admins || []);
          setSiteSettingsForm({
            landingVideoUrl: settingsData.settings?.landingVideoUrl || "",
            siteBackgroundColor: settingsData.settings?.siteBackgroundColor || "#eefaf2",
            menuBackgroundColor: settingsData.settings?.menuBackgroundColor || "#ffffff",
            headerRowColor: settingsData.settings?.headerRowColor || "#ffffff",
            discountCodesRaw: Array.isArray(settingsData.settings?.discountCodes)
              ? settingsData.settings!.discountCodes.join("\n")
              : "",
            discountPercent:
              typeof settingsData.settings?.discountPercent === "number"
                ? settingsData.settings.discountPercent
                : 10,
            currencyCode: settingsData.settings?.currencyCode || "USD",
          });
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard data.");
      } finally {
        setIsBusy(false);
      }
    };

    loadTabData();
  }, [activeTab, authHeaders, token, user?.role]);

  const resetForm = () => {
    setEditingAdminId(null);
    setForm(initialForm);
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(initialProductForm);
  };

  const openCreateProductModal = () => {
    resetProductForm();
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: ProductRecord) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      image: product.image,
      images: (Array.isArray(product.images) ? product.images : []).filter((img) => img !== product.image),
      isActive: product.isActive,
      hasSizes: product.hasSizes,
      sizes: product.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
    });
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    resetProductForm();
  };

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const compressed = await compressImageToDataUrl(file);
      if (compressed.length > 900000) {
        throw new Error("Image is too large. Please use a smaller image.");
      }
      setProductForm((prev) => ({
        ...prev,
        image: compressed,
        images: prev.images.filter((img) => img !== compressed),
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    }
  };

  const handleProductExtraImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    try {
      const uploaded = await Promise.all(files.map((file) => compressImageToDataUrl(file)));
      if (uploaded.some((img) => img.length > 900000)) {
        throw new Error("One or more images are too large. Please use smaller images.");
      }

      setProductForm((prev) => {
        const merged = [...prev.images, ...uploaded].filter((img) => img !== prev.image);
        return { ...prev, images: Array.from(new Set(merged)) };
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      event.target.value = "";
    }
  };

  const submitAdminForm = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsBusy(true);

    try {
      const isEdit = Boolean(editingAdminId);
      const url = isEdit ? `/api/admin/users/${editingAdminId}` : "/api/admin/users";
      const method = isEdit ? "PATCH" : "POST";

      const payload: { email?: string; name?: string; password?: string } = {
        email: form.email,
        name: form.name,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (!isEdit && !payload.password) {
        throw new Error("Password is required when creating an admin user.");
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const data = (await parseJsonSafely<{
        admin?: AdminUser;
        message?: string;
      }>(response)) as {
        admin?: AdminUser;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Failed to save admin user.");
      }

      const refreshed = await fetch("/api/admin/users", { headers: authHeaders });
      const refreshedData = (await parseJsonSafely<{ admins?: AdminUser[]; message?: string }>(refreshed)) as {
        admins?: AdminUser[];
        message?: string;
      };
      if (!refreshed.ok) {
        throw new Error(refreshedData.message || "Failed to refresh admin users.");
      }

      setAdmins(refreshedData.admins || []);
      resetForm();
      setNotice(isEdit ? "Admin updated." : "Admin created.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Admin save failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const removeAdmin = async (id: string) => {
    setError("");
    setNotice("");
    setIsBusy(true);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = (await parseJsonSafely<{ message?: string }>(response)) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove admin user.");
      }

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      setNotice("Admin removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Delete failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const submitProductForm = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsBusy(true);

    try {
      const isEdit = editingProductId !== null;
      const url = isEdit ? `/api/admin/products/${editingProductId}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          image: productForm.image,
          images: productForm.images,
          isActive: productForm.isActive,
          hasSizes: productForm.hasSizes,
          sizes: productForm.sizes,
        }),
      });

      const data = (await parseJsonSafely<{ message?: string }>(response)) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Failed to save product.");
      }

      const refreshed = await fetch("/api/admin/products", { headers: authHeaders });
      const refreshedData = (await parseJsonSafely<{ products?: ProductRecord[]; message?: string }>(refreshed)) as {
        products?: ProductRecord[];
        message?: string;
      };
      if (!refreshed.ok) {
        throw new Error(refreshedData.message || "Failed to refresh products.");
      }

      setProducts(refreshedData.products || []);
      closeProductModal();
      setNotice(isEdit ? "Product updated." : "Product created.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Product save failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const removeProduct = async (id: number) => {
    setError("");
    setNotice("");
    setIsBusy(true);

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = (await parseJsonSafely<{ message?: string }>(response)) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Failed to remove product.");
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
      setNotice("Product removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Product delete failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    setError("");
    setNotice("");
    setIsBusy(true);

    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ status }),
      });

      const data = (await parseJsonSafely<{ order?: AdminOrder; message?: string }>(response)) as {
        order?: AdminOrder;
        message?: string;
      };

      if (!response.ok || !data.order) {
        throw new Error(data.message || "Failed to update order status.");
      }

      setOrders((prev) => prev.map((order) => (order.id === id ? data.order! : order)));
      setNotice("Order status updated.");
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Order status update failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const uploadLandingVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setNotice("");
    setIsUploadingVideo(true);

    try {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/admin/settings/video", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = (await parseJsonSafely<{ videoUrl?: string; message?: string }>(response)) as {
        videoUrl?: string;
        message?: string;
      };

      if (!response.ok || !data.videoUrl) {
        throw new Error(data.message || "Failed to upload landing video.");
      }

      setSiteSettingsForm((prev) => ({ ...prev, landingVideoUrl: data.videoUrl || "" }));
      setNotice("Video uploaded. Click Save Site Settings to publish it.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Video upload failed.");
    } finally {
      setIsUploadingVideo(false);
      event.target.value = "";
    }
  };

  const submitSiteSettingsForm = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsBusy(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          landingVideoUrl: siteSettingsForm.landingVideoUrl,
          siteBackgroundColor: siteSettingsForm.siteBackgroundColor,
          menuBackgroundColor: siteSettingsForm.menuBackgroundColor,
          headerRowColor: siteSettingsForm.headerRowColor,
          discountCodes: parseDiscountCodes(siteSettingsForm.discountCodesRaw),
          discountPercent: siteSettingsForm.discountPercent,
          currencyCode: siteSettingsForm.currencyCode,
        }),
      });

      const data = (await parseJsonSafely<{
        settings?: StoredSiteSettings;
        message?: string;
      }>(response)) as {
        settings?: StoredSiteSettings;
        message?: string;
      };

      if (!response.ok || !data.settings) {
        throw new Error(data.message || "Failed to save site settings.");
      }

      setSiteSettingsForm({
        landingVideoUrl: data.settings.landingVideoUrl || "",
        siteBackgroundColor: data.settings.siteBackgroundColor || "#eefaf2",
        menuBackgroundColor: data.settings.menuBackgroundColor || "#ffffff",
        headerRowColor: data.settings.headerRowColor || "#ffffff",
        discountCodesRaw: Array.isArray(data.settings.discountCodes)
          ? data.settings.discountCodes.join("\n")
          : "",
        discountPercent:
          typeof data.settings.discountPercent === "number"
            ? data.settings.discountPercent
            : 10,
        currencyCode: data.settings.currencyCode || "USD",
      });
      setNotice("Site settings updated.");
    } catch (settingsError) {
      setError(settingsError instanceof Error ? settingsError.message : "Settings save failed.");
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.loadingState}>
            <Spinner label="Checking access..." />
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.header}>
            <h1>Admin Access</h1>
            <p>You must sign in as an admin to access this page.</p>
            <Link href="/profile">Go to Profile</Link>
          </div>
        </section>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.header}>
            <h1>Access Denied</h1>
            <p>This page is only available for admin accounts.</p>
            <p>Signed in as: {user.email}</p>
            <Link href="/">Go to Home</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.header}>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user.email}</p>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "products" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "orders" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "clients" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("clients")}
          >
            Clients
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "settings" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        {notice ? <div className={styles.notice}>{notice}</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}

        {isCurrentTabLoading ? (
          <div className={styles.loadingState}>
            <Spinner label="Loading dashboard data..." />
          </div>
        ) : null}

        <div className={styles.panel}>
          {activeTab === "products" ? (
            <>
              <div className={styles.productsHeaderRow}>
                <p className={styles.muted}>Manage live store products.</p>
                <button type="button" className={styles.submit} onClick={openCreateProductModal}>
                  Create Product
                </button>
              </div>

              <div className={styles.productGrid}>
                {products.map((product) => (
                  <article key={product.id} className={styles.productCard}>
                    <div className={styles.rowTop}>
                      <span className={styles.rowTitle}>{product.name}</span>
                      <span className={styles.meta}>{product.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <div className={`${styles.rowText} ${styles.productDescription}`}>{product.description}</div>
                    <div className={styles.rowText}>Price: {currencySymbol}{product.price.toFixed(2)}</div>
                    <div className={styles.productPreviewWrap}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} className={styles.previewImage} />
                      ) : (
                        <div className={styles.imagePlaceholder}>No image</div>
                      )}
                    </div>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btn}
                        onClick={() => openEditProductModal(product)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger}`}
                        onClick={() => removeProduct(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
                {!products.length && !isBusy ? <div className={styles.row}>No products found.</div> : null}
              </div>

              {isProductModalOpen ? (
                <div className={styles.modalBackdrop} onClick={closeProductModal}>
                  <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <h3>{editingProductId !== null ? "Edit Product" : "Create Product"}</h3>
                      <button type="button" className={styles.btn} onClick={closeProductModal}>
                        Close
                      </button>
                    </div>

                    <form className={styles.form} onSubmit={submitProductForm}>
                      <div className={styles.formRow}>
                        <label htmlFor="productName">Product Name</label>
                        <input
                          id="productName"
                          type="text"
                          value={productForm.name}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                          required
                        />
                      </div>

                      <div className={styles.formRow}>
                        <label htmlFor="productDescription">Description</label>
                        <input
                          id="productDescription"
                          type="text"
                          value={productForm.description}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                          required
                        />
                      </div>

                      <div className={styles.formRow}>
                        <label htmlFor="productPrice">Price</label>
                        <input
                          id="productPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={productForm.price}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                          required
                        />
                      </div>

                      <div className={styles.formRow}>
                        <label htmlFor="productImage">Upload Main Product Image</label>
                        <input
                          id="productImage"
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          required={!editingProductId && !productForm.image}
                        />
                      </div>

                      <div className={styles.formRow}>
                        <label htmlFor="productImages">Upload Extra Angles (optional)</label>
                        <input
                          id="productImages"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleProductExtraImagesUpload}
                        />
                      </div>

                      {productForm.image ? (
                        <div className={styles.previewCollection}>
                          <div className={styles.previewWrap}>
                            <img src={productForm.image} alt="Main product preview" className={styles.previewImage} />
                          </div>
                          {productForm.images.map((image, index) => (
                            <div key={`${image.slice(0, 24)}-${index}`} className={styles.previewWrap}>
                              <img src={image} alt={`Extra product preview ${index + 1}`} className={styles.previewImage} />
                              <button
                                type="button"
                                className={`${styles.btn} ${styles.btnDanger} ${styles.previewRemove}`}
                                onClick={() =>
                                  setProductForm((prev) => ({
                                    ...prev,
                                    images: prev.images.filter((_, imageIndex) => imageIndex !== index),
                                  }))
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className={styles.formRow}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={productForm.hasSizes}
                            onChange={(event) =>
                              setProductForm((prev) => ({
                                ...prev,
                                hasSizes: event.target.checked,
                                sizes: event.target.checked ? prev.sizes : [],
                              }))
                            }
                          />
                          {" "}This product comes in different sizes
                        </label>
                      </div>

                      {productForm.hasSizes ? (
                        <div className={styles.sizesSection}>
                          <p className={styles.sizesLabel}>Sizes &amp; Stock</p>
                          {productForm.sizes.map((sizeEntry, index) => (
                            <div key={index} className={styles.sizeRow}>
                              <input
                                type="text"
                                placeholder="Size (e.g. S, M, L, XL, 42)"
                                value={sizeEntry.size}
                                onChange={(event) =>
                                  setProductForm((prev) => {
                                    const updated = [...prev.sizes];
                                    updated[index] = { ...updated[index], size: event.target.value };
                                    return { ...prev, sizes: updated };
                                  })
                                }
                                className={styles.sizeInput}
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="Qty"
                                value={sizeEntry.quantity}
                                onChange={(event) =>
                                  setProductForm((prev) => {
                                    const updated = [...prev.sizes];
                                    updated[index] = { ...updated[index], quantity: Number(event.target.value) || 0 };
                                    return { ...prev, sizes: updated };
                                  })
                                }
                                className={styles.sizeQtyInput}
                              />
                              <button
                                type="button"
                                className={`${styles.btn} ${styles.btnDanger}`}
                                onClick={() =>
                                  setProductForm((prev) => ({
                                    ...prev,
                                    sizes: prev.sizes.filter((_, i) => i !== index),
                                  }))
                                }
                              >
                                X
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className={styles.btn}
                            onClick={() =>
                              setProductForm((prev) => ({
                                ...prev,
                                sizes: [...prev.sizes, { size: "", quantity: 0 }],
                              }))
                            }
                          >
                            + Add Size
                          </button>
                        </div>
                      ) : null}

                      <div className={styles.formActions}>
                        <button type="submit" className={styles.submit} disabled={isBusy}>
                          {editingProductId !== null ? "Update Product" : "Create Product"}
                        </button>
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={() => setProductForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                        >
                          {productForm.isActive ? "Set Inactive" : "Set Active"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === "orders" ? (
            <>
              <p className={styles.muted}>All orders in the system.</p>
              <div className={styles.list}>
                {orders.map((order) => (
                  <div key={order.id} className={styles.row}>
                    <div className={styles.rowTop}>
                      <span className={styles.rowTitle}>Order {order.id}</span>
                      <span className={styles.meta}>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={styles.rowText}>
                      Customer: {order.user?.email || order.guestEmail || "Guest"}
                    </div>
                    <div className={styles.rowText}>
                      Items: {order.items.length} | Total: {currencySymbol}{order.totalAmount.toFixed(2)}
                    </div>
                    <div className={styles.actions}>
                      <select
                        className={styles.select}
                        value={order.status}
                        onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {!orders.length && !isBusy ? <div className={styles.row}>No orders found.</div> : null}
              </div>
            </>
          ) : null}

          {activeTab === "clients" ? (
            <>
              <p className={styles.muted}>Registered user accounts and purchase summary.</p>
              <div className={styles.list}>
                {clients.map((client) => {
                  const totalSpent = client.orders.reduce((sum, order) => sum + order.totalAmount, 0);

                  return (
                    <div key={client.id} className={styles.row}>
                      <div className={styles.rowTop}>
                        <span className={styles.rowTitle}>{client.name || "Unnamed Client"}</span>
                        <span className={styles.meta}>{new Date(client.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.rowText}>{client.email}</div>
                      <div className={styles.rowText}>
                        Orders: {client.orders.length} | Lifetime Value: {currencySymbol}{totalSpent.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
                {!clients.length && !isBusy ? <div className={styles.row}>No clients found.</div> : null}
              </div>
            </>
          ) : null}

          {activeTab === "settings" ? (
            <>
              <p className={styles.muted}>Click a settings tab below to open and edit that section.</p>

              <div className={styles.settingsAccordion}>
                <section className={styles.settingsSection}>
                  <button
                    type="button"
                    className={`${styles.settingsSectionButton} ${openSettingsSection === "landing" ? styles.settingsSectionButtonOpen : ""}`}
                    onClick={() => setOpenSettingsSection((prev) => (prev === "landing" ? "discounts" : "landing"))}
                  >
                    Landing Settings
                  </button>
                  {openSettingsSection === "landing" ? (
                    <div className={styles.settingsSectionBody}>
                      <form className={styles.form} onSubmit={submitSiteSettingsForm}>
                        <div className={styles.formRow}>
                          <label htmlFor="landingVideoUpload">Upload Landing Video</label>
                          <input
                            id="landingVideoUpload"
                            type="file"
                            accept="video/mp4,video/webm,video/ogg"
                            onChange={uploadLandingVideo}
                            disabled={isUploadingVideo || isBusy}
                          />
                          <p className={styles.muted}>Accepted formats: MP4, WebM, OGG. Max size: 25MB.</p>
                        </div>

                        <div className={styles.formRow}>
                          <label htmlFor="landingVideoUrl">Landing Video URL</label>
                          <input
                            id="landingVideoUrl"
                            type="url"
                            placeholder="/uploads/landing-video.mp4"
                            value={siteSettingsForm.landingVideoUrl}
                            onChange={(event) =>
                              setSiteSettingsForm((prev) => ({ ...prev, landingVideoUrl: event.target.value }))
                            }
                          />
                        </div>

                        {siteSettingsForm.landingVideoUrl ? (
                          <div className={styles.videoPreviewWrap}>
                            <video
                              key={siteSettingsForm.landingVideoUrl}
                              src={siteSettingsForm.landingVideoUrl}
                              className={styles.videoPreview}
                              controls
                              muted
                              playsInline
                              preload="metadata"
                            />
                          </div>
                        ) : null}

                        <div className={styles.formActions}>
                          <button type="submit" className={styles.submit} disabled={isBusy || isUploadingVideo}>
                            Save Landing Settings
                          </button>
                          <button
                            type="button"
                            className={styles.btn}
                            onClick={() =>
                              setSiteSettingsForm((prev) => ({
                                ...prev,
                                landingVideoUrl: "",
                              }))
                            }
                          >
                            Clear Video URL
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}
                </section>

                <section className={styles.settingsSection}>
                  <button
                    type="button"
                    className={`${styles.settingsSectionButton} ${openSettingsSection === "discounts" ? styles.settingsSectionButtonOpen : ""}`}
                    onClick={() => setOpenSettingsSection((prev) => (prev === "discounts" ? "appearance" : "discounts"))}
                  >
                    Discount Codes
                  </button>
                  {openSettingsSection === "discounts" ? (
                    <div className={styles.settingsSectionBody}>
                      <form className={styles.form} onSubmit={submitSiteSettingsForm}>
                        <div className={styles.formRow}>
                          <label htmlFor="discountPercent">Discount Percent (%)</label>
                          <input
                            id="discountPercent"
                            type="number"
                            min={0}
                            max={100}
                            value={siteSettingsForm.discountPercent}
                            onChange={(event) =>
                              setSiteSettingsForm((prev) => ({
                                ...prev,
                                discountPercent: Math.min(100, Math.max(0, Number(event.target.value))),
                              }))
                            }
                          />
                          <p className={styles.muted}>Percentage discount applied when a valid code is used (e.g. 10 = 10% off).</p>
                        </div>

                        <div className={styles.formRow}>
                          <label htmlFor="discountCodes">Discount Codes</label>
                          <textarea
                            id="discountCodes"
                            className={styles.textarea}
                            placeholder={"SUMMER10\nWELCOME15\nVIP25"}
                            value={siteSettingsForm.discountCodesRaw}
                            onChange={(event) =>
                              setSiteSettingsForm((prev) => ({ ...prev, discountCodesRaw: event.target.value }))
                            }
                          />
                          <p className={styles.muted}>Add one code per line (or comma-separated).</p>
                        </div>

                        <div className={styles.formActions}>
                          <button type="submit" className={styles.submit} disabled={isBusy || isUploadingVideo}>
                            Save Discount Codes
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}
                </section>

                <section className={styles.settingsSection}>
                  <button
                    type="button"
                    className={`${styles.settingsSectionButton} ${openSettingsSection === "appearance" ? styles.settingsSectionButtonOpen : ""}`}
                    onClick={() => setOpenSettingsSection((prev) => (prev === "appearance" ? "admins" : "appearance"))}
                  >
                    Appearance Colors
                  </button>
                  {openSettingsSection === "appearance" ? (
                    <div className={styles.settingsSectionBody}>
                      <form className={styles.form} onSubmit={submitSiteSettingsForm}>
                        <div className={styles.settingsColorGrid}>
                          <div className={styles.formRow}>
                            <label htmlFor="currencyCode">Store Currency</label>
                            <select
                              id="currencyCode"
                              value={siteSettingsForm.currencyCode}
                              onChange={(event) =>
                                setSiteSettingsForm((prev) => ({ ...prev, currencyCode: event.target.value }))
                              }
                            >
                              {CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} — {c.name} ({c.symbol})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formRow}>
                            <label htmlFor="siteBackgroundColor">Landing Background Color</label>
                            <input
                              id="siteBackgroundColor"
                              type="color"
                              value={siteSettingsForm.siteBackgroundColor}
                              onChange={(event) =>
                                setSiteSettingsForm((prev) => ({ ...prev, siteBackgroundColor: event.target.value }))
                              }
                            />
                          </div>

                          <div className={styles.formRow}>
                            <label htmlFor="menuBackgroundColor">Menu Color</label>
                            <input
                              id="menuBackgroundColor"
                              type="color"
                              value={siteSettingsForm.menuBackgroundColor}
                              onChange={(event) =>
                                setSiteSettingsForm((prev) => ({ ...prev, menuBackgroundColor: event.target.value }))
                              }
                            />
                          </div>

                          <div className={styles.formRow}>
                            <label htmlFor="headerRowColor">Header Row Color</label>
                            <input
                              id="headerRowColor"
                              type="color"
                              value={siteSettingsForm.headerRowColor}
                              onChange={(event) =>
                                setSiteSettingsForm((prev) => ({ ...prev, headerRowColor: event.target.value }))
                              }
                            />
                          </div>
                        </div>

                        <div className={styles.formActions}>
                          <button type="submit" className={styles.submit} disabled={isBusy || isUploadingVideo}>
                            Save Appearance
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}
                </section>

                <section className={styles.settingsSection}>
                  <button
                    type="button"
                    className={`${styles.settingsSectionButton} ${openSettingsSection === "admins" ? styles.settingsSectionButtonOpen : ""}`}
                    onClick={() => setOpenSettingsSection((prev) => (prev === "admins" ? "landing" : "admins"))}
                  >
                    Admin Accounts
                  </button>
                  {openSettingsSection === "admins" ? (
                    <div className={styles.settingsSectionBody}>
                      <p className={styles.muted}>Manage admin accounts. Permissions can be added later.</p>

                      <form className={styles.form} onSubmit={submitAdminForm}>
                        <h3 className={styles.sectionTitle}>Admin Accounts</h3>
                        <div className={styles.formRow}>
                          <label htmlFor="adminEmail">Admin Email</label>
                          <input
                            id="adminEmail"
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                            required
                          />
                        </div>

                        <div className={styles.formRow}>
                          <label htmlFor="adminName">Admin Name</label>
                          <input
                            id="adminName"
                            type="text"
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                          />
                        </div>

                        <div className={styles.formRow}>
                          <label htmlFor="adminPassword">
                            {editingAdminId ? "New Password (optional)" : "Password"}
                          </label>
                          <input
                            id="adminPassword"
                            type="password"
                            value={form.password}
                            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                            required={!editingAdminId}
                          />
                        </div>

                        <div className={styles.formActions}>
                          <button type="submit" className={styles.submit} disabled={isBusy}>
                            {editingAdminId ? "Update Admin" : "Add Admin"}
                          </button>
                          {editingAdminId ? (
                            <button type="button" className={styles.btn} onClick={resetForm}>
                              Cancel Edit
                            </button>
                          ) : null}
                        </div>
                      </form>

                      <div className={styles.list}>
                        {admins.map((admin) => (
                          <div key={admin.id} className={styles.row}>
                            <div className={styles.rowTop}>
                              <span className={styles.rowTitle}>{admin.name || "Admin User"}</span>
                              <span className={styles.meta}>{new Date(admin.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.rowText}>{admin.email}</div>
                            <div className={styles.actions}>
                              <button
                                type="button"
                                className={styles.btn}
                                onClick={() => {
                                  setEditingAdminId(admin.id);
                                  setForm({ email: admin.email, name: admin.name || "", password: "" });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`${styles.btn} ${styles.btnDanger}`}
                                onClick={() => removeAdmin(admin.id)}
                                disabled={admin.id === user.id}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        {!admins.length && !isBusy ? <div className={styles.row}>No admin users found.</div> : null}
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
