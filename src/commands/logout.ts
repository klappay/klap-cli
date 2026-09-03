import type { Command } from 'commander'
import pc from 'picocolors'
import type { CliEnvironment } from '../config'
import { CONFIG_DISPLAY_PATH, clearApiKey, deleteConfig, loadConfig, saveConfig } from '../config'
import { runCommand } from '../print'

export function registerLogout(program: Command): void {
  program
    .command('logout')
    .description('Remove stored credentials — both, or just one environment with --env')
    .option('--env <environment>', 'test or live — omit to remove everything')
    .action((options: { env?: string }) =>
      runCommand(async () => {
        if (!options.env) {
          await deleteConfig()
          console.log(pc.green('Logged out.'), `Removed ${CONFIG_DISPLAY_PATH}`)
          return
        }

        if (options.env !== 'test' && options.env !== 'live') {
          throw new Error('--env must be "test" or "live"')
        }
        const env: CliEnvironment = options.env

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
