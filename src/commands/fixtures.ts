import {
  type ChargeStatus,
  ChargeStatusSchema,
  type SettlementStatus,
  SettlementStatusSchema,
} from '@klappay/types'
import type { Command } from 'commander'
import { buildChargeFixture } from '../fixtures'
import { parseAcceptedPayment } from './charges'

function collect(value: string, previous: string[]): string[] {
  return [...previous, value]
}

export function parseStatus(value: string): ChargeStatus {
  const parsed = ChargeStatusSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error(
      `--status must be one of ${ChargeStatusSchema.options.join(', ')}, got "${value}"`,
    )
  }
  return parsed.data
}

export function parseSettlementStatus(value: string): SettlementStatus {
  const parsed = SettlementStatusSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error(
      `--settlement must be one of ${SettlementStatusSchema.options.join(', ')}, got "${value}"`,
    )
  }
  return parsed.data
}

type ChargeOptions = {
  status?: string
  amount?: string
  accept: string[]
  overpaid?: boolean
  settlement?: string
  env?: string
}

export function registerFixtures(program: Command): void {
  const fixtures = program
    .command('fixtures')
    .description('Generate realistic sample data locally — no API call, no testnet funds')

  fixtures
    .command('charge')
    .description('Print a Charge object for a given lifecycle status')
    .option(
      '--status <status>',
      `One of ${ChargeStatusSchema.options.join(', ')} (default pending)`,
    )
    .option('--amount <amount>', 'Amount in USD (default 49.90)')
    .option(
      '--accept <token:network>',
      'Accepted payment, e.g. USDC:base — repeat for multiple (default USDC:base)',
      collect,
      [] as string[],
    )
    .option('--overpaid', 'Simulate an overpaid, confirmed charge')
    .option(
      '--settlement <status>',
      `One of ${SettlementStatusSchema.options.join(', ')} — only applies once confirmed`,
    )
    .option(
      '--env <environment>',
      "test (default) or live — sets the fixture's environment field only",
    )
    .action((options: ChargeOptions) => {
      const charge = buildChargeFixture({
        status: options.status ? parseStatus(options.status) : undefined,
        amount: options.amount ? Number(options.amount) : undefined,
        acceptedPayments:
          options.accept.length > 0 ? options.accept.map(parseAcceptedPayment) : undefined,
        overpaid: options.overpaid,
        settlementStatus: options.settlement
          ? parseSettlementStatus(options.settlement)
          : undefined,
        environment: options.env === 'live' ? 'live' : 'test',
      })
      console.log(JSON.stringify(charge, null, 2))
    })
}
