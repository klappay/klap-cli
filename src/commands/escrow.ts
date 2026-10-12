import { writeFile } from 'node:fs/promises'
import type { KlapCharge, KlapClient } from '@klappay/node'
import type { EscrowSafeTransaction } from '@klappay/types'
import { RefundEscrowRequestSchema, ReleaseEscrowRequestSchema } from '@klappay/types'
import type { Command } from 'commander'
import { requireEnvClient } from '../client'
import { ENV_FLAG_DESCRIPTION } from '../config'
import { formatEscrowSafeTransaction, printCharge, runCommand } from '../print'

const ESCROW_ACTION_NAMES = ['release', 'refund'] as const

type EscrowAction = (typeof ESCROW_ACTION_NAMES)[number]

type EscrowActionSpec = {
  schema: typeof ReleaseEscrowRequestSchema | typeof RefundEscrowRequestSchema
  prepare: (klap: KlapClient, id: string) => Promise<EscrowSafeTransaction>
  submit: (klap: KlapClient, id: string, signature: string) => Promise<KlapCharge>
  prepareDescription: string
  submitDescription: string
}

const ESCROW_ACTIONS: Record<EscrowAction, EscrowActionSpec> = {
  release: {
    schema: ReleaseEscrowRequestSchema,
    prepare: (klap, id) => klap.charges.prepareRelease(id),
    submit: (klap, id, signature) => klap.charges.release(id, { signature }),
    prepareDescription:
      'Show the exact Safe transaction `release` will execute, for the escrow releaser to sign',
    submitDescription:
      'Release an escrow charge’s full balance to its split address, with the releaser’s signature',
  },
  refund: {
    schema: RefundEscrowRequestSchema,
    prepare: (klap, id) => klap.charges.prepareRefund(id),
    submit: (klap, id, signature) => klap.charges.refund(id, { signature }),
    prepareDescription:
      'Show the exact Safe transaction `refund` will execute, for the escrow releaser to sign',
    submitDescription:
      'Refund an escrow charge’s full balance to the address that funded it, with the releaser’s signature',
  },
}

export function parseEscrowSignature(action: EscrowAction, value: string): string {
  const parsed = ESCROW_ACTIONS[action].schema.safeParse({ signature: value })
  if (!parsed.success) {
    throw new Error(
      `--signature ${parsed.error.issues[0]?.message ?? 'is invalid'}, got "${value}"`,
    )
  }
  return parsed.data.signature
}

export function registerChargesEscrow(charges: Command): void {
  for (const action of ESCROW_ACTION_NAMES) {
    const spec = ESCROW_ACTIONS[action]
    charges
      .command(`prepare-${action} <id>`)
      .description(spec.prepareDescription)
      .option(
        '--out <file>',
        'Also write the full transaction, typedData included, to this JSON file',
      )
      .option('--env <environment>', ENV_FLAG_DESCRIPTION)
      .action((id: string, options: { out?: string; env?: string }) =>
        runCommand(async () => {
          const klap = await requireEnvClient(options.env)
          const tx = await spec.prepare(klap, id)
          for (const line of formatEscrowSafeTransaction(tx)) console.log(line)
          if (options.out) {
            await writeFile(options.out, `${JSON.stringify(tx, null, 2)}\n`)
            console.log(`Wrote the transaction to ${options.out} — sign its typedData`)
          }
        }),
      )

    charges
      .command(`${action} <id>`)
      .description(spec.submitDescription)
      .requiredOption(
        '--signature <hex>',
        `The releaser's EIP-712 signature over prepare-${action}'s typedData`,
      )
      .option('--env <environment>', ENV_FLAG_DESCRIPTION)
      .action((id: string, options: { signature: string; env?: string }) =>
        runCommand(async () => {
          const signature = parseEscrowSignature(action, options.signature)
          const klap = await requireEnvClient(options.env)
          printCharge(await spec.submit(klap, id, signature))
        }),
      )
  }
}
