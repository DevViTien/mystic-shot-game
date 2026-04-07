import type { ImgHTMLAttributes } from 'react';

const imageModules = import.meta.glob<string>('/src/assets/image/*', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function resolveImage(name: string): string {
  const key = `/src/assets/image/${name}`;
  return imageModules[key] ?? name;
}

interface AppImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  name: string;
}

export function AppImage({ name, alt, ...rest }: AppImageProps) {
  return <img src={resolveImage(name)} alt={alt ?? name} {...rest} />;
}
