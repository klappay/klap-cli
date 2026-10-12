import { isChargeEvent, isConfirmationProgressEvent } from '@klappay/node'
import type { AcceptedPayment, ChargeFeePayer, ListChargesInput } from '@klappay/types'
import {
  ChargeFeePayerSchema,
  ChargeStatusSchema,
  ListChargesSchema,
  NetworkSchema,
  TokenSchema,
} from '@klappay/types'
import type { Command } from 'commander'
import pc from 'picocolors'
import { requireEnvClient } from '../client'
import { ENV_FLAG_DESCRIPTION } from '../config'
import { runUntilInterrupted } from '../interrupt'
import { formatChargeRow, printCharge, printConfirmationProgress, runCommand } from '../print'

type CreateOptions = {
  amount: string
  accept: string[]
  expiresIn: string
  feePayer?: string
  env?: string
}

export function parseFeePayer(value: string): ChargeFeePayer {
  const parsed = ChargeFeePayerSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error(
      `--fee-payer must be one of ${ChargeFeePayerSchema.options.join(', ')}, got "${value}"`,
    )
  }
  return parsed.data
}

export function parseAcceptedPayment(pair: string): AcceptedPayment {
  const [token, network] = pair.split(':')
  if (!token || !network) {
    throw new Error(`--accept must be TOKEN:NETWORK (e.g. USDC:base), got "${pair}"`)
  }
  const parsedToken = TokenSchema.safeParse(token)
  if (!parsedToken.success) {
    throw new Error(
      `--accept's token must be one of ${TokenSchema.options.join(', ')}, got "${token}"`,
    )
  }
  const parsedNetwork = NetworkSchema.safeParse(network)
  if (!parsedNetwork.success) {
    throw new Error(
      `--accept's network must be one of ${NetworkSchema.options.join(', ')}, got "${network}"`,
    )
  }
  return { token: parsedToken.data, network: parsedNetwork.data }
}

type ListOptions = {
  status?: string
  token?: string
  network?: string
  since?: string
  overpaid?: boolean
  limit?: string
  cursor?: string
  env?: string
}

type FlagIssue = { path: (string | number)[]; message: string }

function describeFlagIssues(
  issues: FlagIssue[],
  flags: Record<string, string>,
  fallback: string,
): string {
  return issues
    .map((issue) => {
      const flag = flags[String(issue.path[0])]
      return flag ? `${flag}: ${issue.message}` : fallback
    })
    .join('\n')
}

const LIST_FLAGS: Record<string, string> = {
  status: '--status',
  token: '--token',
  network: '--network',
  since: '--since',
  isOverpaid: '--overpaid',
  limit: '--limit',
  cursor: '--cursor',
}

export function parseListChargesOptions(options: ListOptions): ListChargesInput {
  const parsed = ListChargesSchema.safeParse({
    status: options.status,
    token: options.token,
    network: options.network,
    since: options.since,
    isOverpaid: options.overpaid === undefined ? undefined : String(options.overpaid),
    limit: options.limit,
    cursor: options.cursor,
  })
  if (!parsed.success) {
    throw new Error(describeFlagIssues(parsed.error.issues, LIST_FLAGS, 'invalid list filter'))
  }
  return parsed.data
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value]
}

export function registerCharges(program: Command): void {
  const charges = program.command('charges').description('Create and inspect charges')

  charges
    .command('create')
    .description('Create a charge')
    .requiredOption('--amount <amount>', 'Amount in USD, e.g. 49.90')
    .requiredOption(
      '--accept <token:network>',
      'Accepted payment, e.g. USDC:base — repeat for multiple',
      collect,
      [] as string[],
    )
    .requiredOption('--expires-in <seconds>', 'Expiry in seconds')
    .option(
      '--fee-payer <who>',
      '"merchant" (default) — the fee comes out of your payout — or "payer", which grosses up --amount so the payer covers it instead',
    )
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: CreateOptions) =>
      runCommand(async () => {
        const klap = await requireEnvClient(options.env)
        const charge = await klap.charges.create({
          amount: Number(options.amount),
          currency: 'USD',
          acceptedPayments: options.accept.map(parseAcceptedPayment),
          expiresIn: Number(options.expiresIn),
          feePayer: options.feePayer ? parseFeePayer(options.feePayer) : undefined,
        })
        printCharge(charge)
      }),
    )

  charges
    .command('get <id>')
    .description('Show a charge’s current state')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((id: string, options: { env?: string }) =>
      runCommand(async () => {
        const klap = await requireEnvClient(options.env)
        printCharge(await klap.charges.get(id))
      }),
    )

  charges
    .command('list')
    .description('List charges, one page at a time')
    .option('--status <status>', `Filter by status: ${ChargeStatusSchema.options.join(', ')}`)
    .option('--token <token>', 'Filter by the token actually paid, e.g. USDC')
    .option('--network <network>', 'Filter by the network actually paid on, e.g. base')
    .option('--since <iso-datetime>', 'Only charges created at or after this timestamp')
    .option('--overpaid', 'Only overpaid charges')
    .option('--no-overpaid', 'Only charges that are not overpaid')
    .option('--limit <n>', 'Page size (default 20, max 100)')
    .option(
      '--cursor <cursor>',
      'Fetch the page after a previous `list` (printed when there is one)',
    )
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: ListOptions) =>
      runCommand(async () => {
        const input = parseListChargesOptions(options)
        const klap = await requireEnvClient(options.env)
        const page = await klap.charges.list(input)
        if (page.data.length === 0) {
          console.log(pc.dim('No charges found.'))
          return
        }
        for (const charge of page.data) console.log(formatChargeRow(charge))
        if (page.hasMore && page.nextCursor) {
          console.log(
            pc.dim(`More results — rerun with the same filters plus --cursor ${page.nextCursor}`),
          )
        }
      }),
    )

  charges
    .command('watch <id>')
    .description(
      'Stream a charge’s live status and confirmation progress until it settles (Ctrl+C to stop)',
    )
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((id: string, options: { env?: string }) =>
      runCommand(async () => {
        const klap = await requireEnvClient(options.env)
        await runUntilInterrupted(async (signal) => {
          for await (const event of klap.charges.watchEvents(id, signal)) {
            if (isConfirmationProgressEvent(event)) printConfirmationProgress(event.data)
            else if (isChargeEvent(event)) printCharge(event.data)
          }
        })
      }),
    )
}
