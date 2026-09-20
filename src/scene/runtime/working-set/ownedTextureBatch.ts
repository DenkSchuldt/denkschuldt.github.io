interface DisposableTexture {
  dispose: () => void;
}

export function loadOwnedTextureBatch<T extends DisposableTexture>(
  urls: readonly string[],
  load: (url: string) => Promise<T>,
) {
  const owned = new Set<T>();
  let closed = false;

  function dispose() {
    closed = true;
    owned.forEach((texture) => texture.dispose());
    owned.clear();
  }

  const promise = Promise.all(
    urls.map(async (url) => {
      const texture = await load(url);
      if (closed) texture.dispose();
      else owned.add(texture);
      return texture;
    }),
  ).catch((error: unknown) => {
    dispose();
    throw error;
  });

  return { promise, dispose };
}
