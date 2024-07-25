import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import prisma from '@/db/db'
import { Product } from '@prisma/client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { cache } from '@/lib/cache'

const getMostPopularProducts = cache(
  () => {
    return prisma.product.findMany({
      where: {
        isAvailableForPurchase: true
      },
      orderBy: {
        orders: {
          _count: 'desc'
        }
      },
      take: 6
    })
  },
  ['/', 'getMostPopularProducts'],
  { revalidate: 60 * 60 * 24 }
)

const getNewestProducts = cache(
  () => {
    return prisma.product.findMany({
      where: {
        isAvailableForPurchase: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 6
    })
  },
  ['/', 'getNewestProducts'],
  { revalidate: 60 * 60 * 24 }
)

export default function HomePage() {
  return (
    <main className="space-y-12">
      <ProductGridSection
        productsFetcher={getMostPopularProducts}
        title="Most Popular"
      />
      <ProductGridSection productsFetcher={getNewestProducts} title="Newest" />
    </main>
  )
}

interface ProductGridSectionProps {
  productsFetcher: () => Promise<Product[]>
  title: string
}

function ProductGridSection({
  productsFetcher,
  title
}: ProductGridSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button variant="outline" asChild>
          <Link className="space-x-2" href="/products">
            <span>View All</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense
          fallback={
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          }
        >
          <ProductSuspense productsFetcher={productsFetcher} />
        </Suspense>
      </div>
    </div>
  )
}

async function ProductSuspense({
  productsFetcher
}: {
  productsFetcher: () => Promise<Product[]>
}) {
  return (await productsFetcher()).map(product => (
    <ProductCard key={product.id} {...product} />
  ))
}
