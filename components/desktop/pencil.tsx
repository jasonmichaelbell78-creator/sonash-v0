"use client";

import Image from "next/image";

export default function Pencil() {
  const pencilUrl = "/images/gemini-generated-image-gj5efogj5efogj5e.jpeg";

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        bottom: "5%",
        right: "5%",
        width: "400px",
        height: "250px",
        transform: "rotate(-25deg)",
        zIndex: 30,
      }}
    >
      <Image
        src={pencilUrl || "/placeholder.svg"}
        alt="Pencil"
        fill
        sizes="400px"
        className="object-contain"
        style={{
          filter: "drop-shadow(3px 6px 8px rgba(0,0,0,0.5))",
        }}
      />
    </div>
  );
}
