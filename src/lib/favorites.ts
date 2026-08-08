"use client";

const STORAGE_KEY = "xerxes_favorites";

export function getFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addFavorite(propertyId: number): number[] {
  const favorites = getFavorites();
  if (!favorites.includes(propertyId)) {
    favorites.push(propertyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
  return favorites;
}

export function removeFavorite(propertyId: number): number[] {
  const favorites = getFavorites().filter((id) => id !== propertyId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return favorites;
}

export function isFavorite(propertyId: number): boolean {
  return getFavorites().includes(propertyId);
}

export function toggleFavorite(propertyId: number): { favorites: number[]; isFavorite: boolean } {
  if (isFavorite(propertyId)) {
    return { favorites: removeFavorite(propertyId), isFavorite: false };
  }
  return { favorites: addFavorite(propertyId), isFavorite: true };
}

export function clearFavorites(): void {
  localStorage.removeItem(STORAGE_KEY);
}
