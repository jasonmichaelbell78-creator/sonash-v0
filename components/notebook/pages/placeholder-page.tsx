"use client"

interface PlaceholderPageProps {
  title: string
  description: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <h1 className="font-heading text-3xl text-amber-900/80 mb-4">{title}</h1>
      <p className="font-body text-lg text-amber-900/60 max-w-md">{description}</p>
      <div className="mt-8 w-24 h-1 bg-amber-200 rounded-full" />
    </div>
  )
}
