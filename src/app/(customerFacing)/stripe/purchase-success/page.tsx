import { formatCurrency } from '@/lib/formatters'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

import prisma from '@/db/db'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PurchaseSuccess({
  searchParams
}: {
  searchParams: { payment_intent: string }
}) {
  const paymentIntent = await stripe.paymentIntents.retrieve(
    searchParams.payment_intent
  )

  if (paymentIntent.metadata.productId === null) return notFound()

  const product = await prisma?.product.findUnique({
    where: {
      id: paymentIntent.metadata.productId
    }
  })

  if (product === null) return notFound()

  const isSuccess = paymentIntent.status === 'succeeded'

  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <h1 className="text-4xl font-bold">
        {isSuccess ? 'Thank you for your purchase!' : 'Payment failed'}
      </h1>
      <div className="flex gap-4 items-center">
        <div className="aspect-video flex-shrink-0 w-1/3 relative ">
          <Image
            src={product.imagePath}
            fill
            alt={product.name}
            className="rounded-xl object-cover"
          />
        </div>
        <div>
          <div className="text-lg">
            {formatCurrency(product.priceInCents / 100)}
          </div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="line-clamp-3 text-muted-foreground">
            {product.description}
          </div>
          <Button className="mt-4" size="lg" asChild>
            {isSuccess ? (
              <a
                href={`/products/download/${await createDownloadVerification(
                  product.id
                )}`}
              >
                Download
              </a>
            ) : (
              <Link href={`/products/${product.id}/purchase`}>Try again</Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

async function createDownloadVerification(productId: string) {
  const vrf = await prisma.downloadVerification.create({
    data: {
      productId: productId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  })

  return vrf.id
}
