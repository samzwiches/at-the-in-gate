import Image from "next/image";

type ListingPhotoProps = {
  src: string;
  alt: string;
  className?: string;
  focalX?: number;
  focalY?: number;
  fit?: "cover" | "contain";
};

export default function ListingPhoto({ src, alt, className = "", focalX = 50, focalY = 50, fit = "cover" }: ListingPhotoProps) {
  return <Image fill src={src} alt={alt} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className={`object-${fit} ${className}`} style={{ objectPosition: `${focalX}% ${focalY}%` }} />;
}
