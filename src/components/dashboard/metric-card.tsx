import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardMetric } from '@/lib/types'

const toneMap = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  info: 'info'
} as const

function isNumericMetricValue (value: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(value.trim())
}

function toTitleCase (value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function MetricCard ({ metric }: { metric: DashboardMetric }) {
  const numeric = isNumericMetricValue(metric.value)

  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <CardHeader className="mb-0 gap-1">
        <CardDescription className="font-medium text-slate-500">{metric.label}</CardDescription>
        <CardTitle className={numeric ? 'text-5xl leading-none md:text-6xl' : 'text-4xl leading-tight'}>
          {numeric ? metric.value : toTitleCase(metric.value)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <Badge variant={toneMap[metric.tone ?? 'default']}>{metric.delta ?? 'Live'}</Badge>
      </CardContent>
    </Card>
  )
}
