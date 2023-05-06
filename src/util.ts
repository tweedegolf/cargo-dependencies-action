import * as actions_exec from '@actions/exec'

export interface TreeItem {
  name: string
  version: string
  dependencies: TreeItem[]
}

export function parseTree(tree: string): TreeItem[] {
  const root: TreeItem[] = []
  const lastAtLevel: {[indent: string]: TreeItem} = {}

  for (const line of tree.trim().split('\n')) {
    const found = line.match(
      /(?<level>\d+)(?<name>.+?) (?<version>[^\s]+)( .*)?/
    ) as {
      groups: {
        level: string
        name: string
        version: string
      }
    } | null

    if (found !== null) {
      const {level, name, version} = found.groups
      const indentLevel = parseInt(level, 10)
      const item = {
        name,
        version,
        dependencies: []
      }

      if (indentLevel === 0) {
        root.push(item)
      } else {
        lastAtLevel[indentLevel - 1].dependencies.push(item)
      }

      lastAtLevel[indentLevel] = item
    }
  }

  return root
}

export function renderTree(tree: TreeItem[], prefix = ''): string {
  return tree
    .map((item, index) => {
      const last = index === tree.length - 1
      const start = last ? '└─ ' : '├─ '
      const result = `${prefix}${start}${item.name} [${item.version}]`

      if (item.dependencies.length === 0) {
        return `${result}`
      }

      const deps = renderTree(
        item.dependencies,
        `${prefix}${last ? ' ' : '|'}  `
      )

      return `${result}\n${deps}`
    })
    .join('\n')
}

export async function exec(
  cmd: string,
  args: string[],
  silent = false
): Promise<{stdout: string; stderr: string}> {
  let stdout = ''
  let stderr = ''

  const options = {
    silent,
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString()
      },
      stderr: (data: Buffer) => {
        stderr += data.toString()
      }
    }
  }

  await actions_exec.exec(cmd, args, options)

  return {
    stdout,
    stderr
  }
}

export function humanFileSize(size: number): string {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024))
  const num = Number((size / Math.pow(1024, i)).toFixed(1))
  const unit = ['B', 'KiB', 'MiB', 'GiB', 'TiB'][i]

  return `${num} ${unit}`
}

export function delta(a: number, b: number): string {
  if (a === 0 || b === 0) {
    return '-'
  }

  const sign = a === b ? 0 : a > b ? '+' : '-'
  const diff = Math.abs(100 - 100 * (a / b))

  if (diff < 0.1) {
    return '-'
  }

  return `${sign}${diff.toFixed(1)}%`
}
