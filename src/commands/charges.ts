import type { AcceptedPayment } from '@klappay/types'
import { NetworkSchema, TokenSchema } from '@klappay/types'
import type { Command } from 'commander'
import { requireClient } from '../client'
import { ENV_FLAG_DESCRIPTION, parseCliEnvironment } from '../config'
import { printCharge, printEnvironmentBanner, runCommand } from '../print'

type CreateOptions = {
  amount: string
  accept: string[]
  expiresIn: string
  env?: string
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
    .option('--env <environment>', ENV_FLAG_DESCRIPTION)
    .action((options: CreateOptions) =>
      runCommand(async () => {
        const { client: klap, env } = await requireClient(parseCliEnvironment(options.env))
        printEnvironmentBanner(env)
        const charge = await klap.charges.create({
          amount: Number(options.amount),
          currency: 'USD',
          acceptedPayments: options.accept.map(parseAcceptedPayment),
          expiresIn: Number(options.expiresIn),
        })
        printCharge(charge)
      }),
    )
}
