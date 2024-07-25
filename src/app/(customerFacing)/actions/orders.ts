'use server'

import prisma from '@/db/db'

export async function userOrderExists({
  email,
  productId
}: {
  email?: string
  productId: string
}) {
  const order =
    (await prisma.order.findFirst({
      where: {
        user: { email: email },
        productId: productId
      },
      select: { id: true }
    })) !== null

  return order
}
