let pendingWallpaperId: string | null = null;

export function queueWallpaperPick(id: string) {
  pendingWallpaperId = id;
}

export function takeWallpaperPick(): string | null {
  const id = pendingWallpaperId;
  pendingWallpaperId = null;
  return id;
}
