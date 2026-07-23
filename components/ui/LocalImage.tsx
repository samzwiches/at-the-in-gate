import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";

type LocalImageProps = {
  src?: string;
  alt?: string;
  focalPosition?: string;
  focalPositionClassName?: string;
  loading?: "eager" | "lazy";
  sizes: string;
  className?: string;
};

function publicImagePath(src: string) {
  const normalizedPath = src.replace(/^\/+/, "");

  if (!normalizedPath.startsWith("images/") || normalizedPath.includes("..")) {
    return null;
  }

  return path.join(process.cwd(), "public", normalizedPath);
}

export function localImageExists(src?: string) {
  if (!src) {
    return false;
  }

  const imagePath = publicImagePath(src);
  return imagePath ? existsSync(imagePath) : false;
}

export default function LocalImage({
  src,
  alt,
  focalPosition = "50% 50%",
  focalPositionClassName,
  loading,
  sizes,
  className = "",
}: LocalImageProps) {
  if (!src || !localImageExists(src)) {
    return null;
  }

  return (
    <Image
      fill
      src={src}
      alt={alt ?? ""}
      sizes={sizes}
      loading={loading}
      className={`object-cover ${focalPositionClassName ?? ""} ${className}`}
      style={focalPositionClassName ? undefined : { objectPosition: focalPosition }}
    />
  );
}
