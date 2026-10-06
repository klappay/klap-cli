import type { Command } from 'commander'
import pc from 'picocolors'
import {
  CONFIG_DISPLAY_PATH,
  clearApiKey,
  deleteConfig,
  loadConfig,
  parseCliEnvironment,
  saveConfig,
} from '../config'
import { runCommand } from '../print'

export function registerLogout(program: Command): void {
  program
    .command('logout')
    .description('Remove stored credentials — both, or just one environment with --env')
    .option('--env <environment>', 'test or live — omit to remove everything')
    .action((options: { env?: string }) =>
      runCommand(async () => {
        const env = parseCliEnvironment(options.env)
        if (!env) {
          await deleteConfig()
          console.log(pc.green('Logged out.'), `Removed ${CONFIG_DISPLAY_PATH}`)
          return
        }

        const config = await loadConfig()
        if (!config || !config.apiKeys[env]) {
          console.log(pc.dim(`No ${env} key was configured.`))
          return
        }

        await saveConfig(clearApiKey(config, env))
        console.log(pc.green('Logged out.'), `Removed the ${env.toUpperCase()} key.`)
      }),
    )
}
