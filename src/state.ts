import * as io from '@actions/io'
import * as core from '@actions/core'
import {exec, parseTree, TreeItem} from './util'

export interface State {
  size: number
  textSize: number
  dependencies: TreeItem[]
}

export async function getState(bin: string): Promise<State> {
  const cargoPath: string = await io.which('cargo', true)

  core.info('Installing cargo-bloat and cargo-tree...')
  await exec(cargoPath, ['install', 'cargo-bloat', 'cargo-tree'])

  core.info('Running cargo bloat...')

  const args = [
    'bloat',
    '--release',
    '--all-features',
    '--message-format=json',
    '-n',
    '1'
  ]

  if (bin) {
    args.push('--bin')
    args.push(bin)
  }

  const bloatResult = await exec(cargoPath, args, true)

  const bloat = JSON.parse(bloatResult.stdout)

  core.info('Running cargo tree...')
  const tree = await exec(
    cargoPath,
    ['tree', '--all-features', '--prefix=depth', '-e=no-dev'],
    true
  )

  return {
    size: bloat['file-size'],
    textSize: bloat['text-section-size'],
    dependencies: parseTree(tree.stdout)
  } as State
}
