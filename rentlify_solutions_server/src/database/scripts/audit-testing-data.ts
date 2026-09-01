import '../../config/load-environment.js'

import { databasePool } from '../client.js'

type ColumnDescription = {
  table_name: string
  column_name: string
  ordinal_position: number
  data_type: string
  is_nullable: 'YES' | 'NO'
  column_default: string | null
}

const sensitiveColumnNames = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'value',
  'ip_address',
])

const quoteIdentifier = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`

const redactSensitiveColumns = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row).map(([columnName, value]) => [
      columnName,
      sensitiveColumnNames.has(columnName) && value !== null ? '[REDACTED]' : value,
    ]),
  )

const run = async () => {
  try {
    const columnResult = await databasePool.query<ColumnDescription>(`
      select
        table_name,
        column_name,
        ordinal_position,
        data_type,
        is_nullable,
        column_default
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    `)

    const columnsByTable = new Map<string, ColumnDescription[]>()
    for (const column of columnResult.rows) {
      const tableColumns = columnsByTable.get(column.table_name) ?? []
      tableColumns.push(column)
      columnsByTable.set(column.table_name, tableColumns)
    }

    const audit: Array<{
      table: string
      columns: Array<{
        name: string
        position: number
        type: string
        nullable: boolean
        default: string | null
      }>
      rowCount: number
      rows: Array<Record<string, unknown>>
    }> = []

    for (const [tableName, columns] of columnsByTable) {
      // Identifiers originate from PostgreSQL's information_schema rather than user input and are
      // still quoted defensively before they are used in the diagnostic query.
      const result = await databasePool.query<Record<string, unknown>>(
        `select * from ${quoteIdentifier('public')}.${quoteIdentifier(tableName)}`,
      )
      audit.push({
        table: tableName,
        columns: columns.map((column) => ({
          name: column.column_name,
          position: column.ordinal_position,
          type: column.data_type,
          nullable: column.is_nullable === 'YES',
          default: column.column_default,
        })),
        rowCount: result.rowCount ?? result.rows.length,
        rows: result.rows.map(redactSensitiveColumns),
      })
    }

    console.info(JSON.stringify({ generatedAt: new Date().toISOString(), tables: audit }, null, 2))
  } finally {
    await databasePool.end()
  }
}

run().catch((error: unknown) => {
  console.error('Testing database audit failed.', error)
  process.exitCode = 1
})
