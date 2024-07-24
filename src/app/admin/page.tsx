import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import prisma from '@/db/db'
import { formatCurrency, formatNumber } from '@/lib/formatters'

async function getSalesData() {
  const data = await prisma.order.aggregate({
    _sum: { pricePaidInCents: true },
    _count: true
  })

  return {
    amount: (data._sum.pricePaidInCents || 0) / 100,
    numberOfSales: data._count
  }
}

async function getUserData() {
  const [userCount, orderData] = await Promise.all([
    prisma.user.count(),
    prisma.order.aggregate({
      _sum: { pricePaidInCents: true }
    })
  ])

  return {
    userCount,
    averageValuePerUser:
      userCount === 0
        ? 0
        : (orderData._sum.pricePaidInCents || 0) / userCount / 100
  }
}

async function getProductData() {
  const [activeCount, inactiveCount] = await Promise.all([
    prisma.product.count({
      where: { isAvailableForPurchase: true }
    }),
    prisma.product.count({
      where: { isAvailableForPurchase: false }
    })
  ])

  return {
    activeCount,
    inactiveCount
  }
}

export default async function AdminDashboard() {
  const [
    { amount, numberOfSales },
    { userCount, averageValuePerUser },
    { activeCount, inactiveCount }
  ] = await Promise.all([getSalesData(), getUserData(), getProductData()])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard
        title="Sales"
        subTitle={`${formatNumber(numberOfSales)} Orders`}
        body={formatCurrency(amount)}
      />
      <DashboardCard
        title="Customers"
        subTitle={`${formatCurrency(averageValuePerUser)} Average Value`}
        body={formatNumber(userCount)}
      />
      <DashboardCard
        title="Active Products"
        subTitle={`${formatNumber(inactiveCount)} Inactive Products`}
        body={formatNumber(activeCount)}
      />
    </div>
  )
}

interface DashboardCardProps {
  title: string
  subTitle: string
  body: string
}

function DashboardCard({ title, subTitle, body }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
    </Card>
  )
}
