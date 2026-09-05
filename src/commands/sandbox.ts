import { type TriggerableChargeEvent, TriggerableChargeEventSchema } from '@klappay/types'
import type { Command } from 'commander'
import { requireEnvClient } from '../client'
import { ENV_FLAG_DESCRIPTION_SANDBOX } from '../config'
import { printCharge, runCommand } from '../print'

export function parseTriggerableEvent(value: string): TriggerableChargeEvent {
  const parsed = TriggerableChargeEventSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error(
      `event must be one of ${TriggerableChargeEventSchema.options.join(', ')}, got "${value}"`,
    )
  }
  return parsed.data
}

export function registerSandbox(program: Command): void {
  const sandbox = program
    .command('sandbox')
    .description('Simulate charge events (test API key only)')

  sandbox
    .command('trigger <chargeId> <event>')
    .description(
      'Simulate a charge event: charge.confirmed, charge.partially_paid, charge.overpaid, charge.expired, charge.underpaid, charge.settled, charge.settlement_failed',
    )
    .option('--amount <amount>', 'Used with charge.partially_paid/charge.overpaid')
    .option('--env <environment>', ENV_FLAG_DESCRIPTION_SANDBOX)
    .action((chargeId: string, event: string, options: { amount?: string; env?: string }) =>
      runCommand(async () => {
        const klap = await requireEnvClient(options.env)
        const charge = await klap.sandbox.trigger(
          chargeId,
          parseTriggerableEvent(event),
          options.amount ? Number(options.amount) : undefined,
        )
        printCharge(charge)
      }),
    )
}
