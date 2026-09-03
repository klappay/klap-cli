import { Command } from 'commander'
import { version } from '../package.json'
import { registerCharges } from './commands/charges'
import { registerFixtures } from './commands/fixtures'
import { registerListen } from './commands/listen'
import { registerLogin } from './commands/login'
import { registerLogout } from './commands/logout'
import { registerLogs } from './commands/logs'
import { registerSandbox } from './commands/sandbox'
import { registerWebhooks } from './commands/webhooks'

const program = new Command()

program.name('klap').description('Official CLI for the Klap Core API').version(version)

registerLogin(program)
registerLogout(program)
registerCharges(program)
registerSandbox(program)
registerListen(program)
registerLogs(program)
registerWebhooks(program)
registerFixtures(program)

program.parse()
