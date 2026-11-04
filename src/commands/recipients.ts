import { type PaginationQuery, PaginationQuerySchema } from '@klappay/types'
import type { Command } from 'commander'
import pc from 'picocolors'
import { requireEnvClient } from '../client'
import { ENV_FLAG_DESCRIPTION } from '../config'
import { formatRecipientRow, formatTransferability, runCommand } from '../print'
import { describeFlagIssues } from './charges'

type ListOptions = {
  limit?: string
  cursor?: string
  env?: string
}

const LIST_FLAGS: Record<string, string> = {
  limit: '--limit',
  cursor: '--cursor',
}

export function parseListRecipientsOptions(options: ListOptions): PaginationQuery {
  const parsed = PaginationQuerySchema.safeParse({ limit: options.limit, cursor: options.cursor })
  if (!parsed.success) {
    throw new Error(describeFlagIssues(parsed.error.issues, LIST_FLAGS, 'invalid list filter'))
  }
  return parsed.data
}

export function registerRecipients(program: Command): void {
  const recipients = program
    .command('recipients')
    .description('Inspect your registered split recipients')

  recipients
    .command('list')
    .description('List recipients, one page at a time')
    .option('--limit <n>', 'Page size (default 20, max 100)')
    .option(
      '--cursor <cursor>',
      'Fetch the page after a previous `list` (printed when there is one)',
    )
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: ListOptions) =>
      runCommand(async () => {
        const input = parseListRecipientsOptions(options)
        const klap = await requireEnvClient(options.env)
        const page = await klap.recipients.list(input)
        if (page.data.length === 0) {
          console.log(pc.dim('No recipients found.'))
          return
        }
        for (const recipient of page.data) console.log(formatRecipientRow(recipient))
        if (page.hasMore && page.nextCursor) {
          console.log(pc.dim(`More results — rerun with --cursor ${page.nextCursor}`))
        }
      }),
    )

  recipients
    .command('transferability <id>')
    .description('Show what each token issuer’s contract says about a recipient’s address')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((id: string, options: { env?: string }) =>
      runCommand(async () => {
        const klap = await requireEnvClient(options.env)
        const report = await klap.recipients.getTransferability(id)
        for (const line of formatTransferability(report)) console.log(line)
      }),
    )
}
