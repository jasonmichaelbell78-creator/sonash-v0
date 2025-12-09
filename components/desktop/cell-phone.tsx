"use client"

import Image from "next/image"

export default function CellPhone() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: "15%",
        right: "3%",
        width: "80px",
        height: "160px",
        transform: "rotate(5deg)",
        zIndex: 5,
      }}
    >
      <Image
        src="/images/cell-phone.jpg"
        alt="Cell Phone"
        fill
        className="object-contain"
        style={{
          filter: "drop-shadow(2px 4px 8px rgba(0,0,0,0.4))",
        }}
      />
    </div>
  )
}
