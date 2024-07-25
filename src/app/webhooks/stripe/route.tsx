import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/db/db'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const resend = new Resend(process.env.RESEND_API_KEY as string)

export async function POST(request: NextRequest) {
  const event = stripe.webhooks.constructEvent(
    await request.text(),
    request.headers.get('stripe-signature') as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  )

  if (event.type === 'charge.succeeded') {
    const charge = event.data.object
    const productId = charge.metadata.productId
    const email = charge.billing_details.email
    const pricePaidInCents = charge.amount

    const product = await prisma.product.findUnique({
      where: {
        id: productId
      }
    })

    if (product === null || email === null) {
      return new NextResponse('Bad request', { status: 400 })
    }

    const userFields = {
      email,
      orders: {
        create: {
          productId,
          pricePaidInCents
        }
      }
    }

    const {
      orders: [order]
    } = await prisma.user.upsert({
      where: { email },
      create: userFields,
      update: userFields,
      select: {
        orders: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    const downloadVerification = await prisma.downloadVerification.create({
      data: {
        productId: productId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    })

    await resend.emails.send({
      from: `Support <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: 'Your download verification code',
      react: <h1>Hi</h1>
    })
  }

  return new NextResponse('OK', { status: 200 })
}
