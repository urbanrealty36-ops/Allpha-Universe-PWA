import type { AssetCategory } from "./asset-factory";
import { PRODUCTION_3D_ACTIVATION_MATRIX, PRODUCTION_3D_STORAGE_BUCKET, PRODUCTION_3D_STORAGE_ROOT, type Production3DActivationDescriptor } from "./production-3d-activation";

export type Production3DRendererSource = "production-storage" | "real-3d-runtime";
export type Production3DRendererResolution = {
  source: Production3DRendererSource; descriptor: Production3DActivationDescriptor;
  storageUrl: string | null; fallbackReason: "storage-url-unavailable" | null;
};

export function resolveProduction3DAsset(themeKey: string | null | undefined, category: AssetCategory, storageBaseUrl?: string | null): Production3DRendererResolution | null {
  if (!themeKey) return null;
  const descriptor = PRODUCTION_3D_ACTIVATION_MATRIX.find((item) => item.themeKey === themeKey && item.category === category);
  if (!descriptor) return null;
  const normalizedBase = storageBaseUrl?.replace(/\/$/, "");
  const storageUrl = normalizedBase ? `${normalizedBase}/${PRODUCTION_3D_STORAGE_BUCKET}/${descriptor.storagePath}` : null;
  return { source: storageUrl ? "production-storage" : "real-3d-runtime", descriptor, storageUrl,
    fallbackReason: storageUrl ? null : "storage-url-unavailable" };
}
export function resolveProduction3DStoragePath(themeKey: string, category: AssetCategory) {
  return `${PRODUCTION_3D_STORAGE_ROOT}/${themeKey}/${category}.glb`;
}
