import Loader2, { LucideLoader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex justify-center">
      <LucideLoader2 className="size-24 animate-spin" />
    </div>
  )
}
