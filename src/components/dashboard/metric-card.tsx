import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardMetric } from '@/lib/types'

const toneMap = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  info: 'info'
} as const

export function MetricCard ({ metric }: { metric: DashboardMetric }) {
  return (
    <Card className="p-5">
      <CardHeader className="mb-0">
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-3xl">{metric.value}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant={toneMap[metric.tone ?? 'default']}>{metric.delta ?? 'Live'}</Badge>
      </CardContent>
    </Card>
  )
}
