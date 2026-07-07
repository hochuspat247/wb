"use client";

import type React from "react";

type ProtectedDemoImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ProtectedDemoImage({ src, alt, className = "" }: ProtectedDemoImageProps) {
  const preventImageSave = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={`protected-demo-image-wrap ${className}`}
      onContextMenu={preventImageSave}
      onCopy={preventImageSave}
      onCut={preventImageSave}
      onDragStart={preventImageSave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={alt}
        className="protected-demo-image"
        draggable={false}
        onContextMenu={preventImageSave}
        onCopy={preventImageSave}
        onCut={preventImageSave}
        onDragStart={preventImageSave}
        src={src}
      />
      <div
        className="protected-demo-image-overlay"
        onContextMenu={preventImageSave}
        onCopy={preventImageSave}
        onCut={preventImageSave}
        onDragStart={preventImageSave}
      />
    </div>
  );
}
