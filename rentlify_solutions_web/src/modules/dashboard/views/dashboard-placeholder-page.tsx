import { CircleDashed, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type DashboardPlaceholderPageProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function DashboardPlaceholderPage({ title, description, icon: Icon }: DashboardPlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="border-b border-border pb-7">
        <Badge className="mb-3 rounded-full px-2.5 py-1" variant="secondary">
          <CircleDashed className="size-3.5" /> Planned workspace
        </Badge>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </header>

      <Card className="mt-8 overflow-hidden border border-border bg-white shadow-xs ring-0">
        <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-border bg-muted/60 text-muted-foreground shadow-xs">
            <Icon className="size-6" />
          </span>
          <h3 className="mt-5 text-lg font-semibold">Ready for the next milestone</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            The protected workspace is prepared. Real {title.toLowerCase()} tools will appear here when their data and
            server-side permissions are implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
