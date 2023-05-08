import * as github from '@actions/github'
import * as core from '@actions/core'
import * as Diff from 'diff'
import {GitHub} from '@actions/github/lib/utils'
import {delta, humanFileSize, renderTree} from './util'
import {TITLE} from './main'
import {State} from './state'

export function formatComment(
  state: State,
  mainState: State,
  mainBranchName: string
): string {
  const name = `PR #${github.context.issue.number}`

  const tree = renderTree(state.dependencies)
  const treeL = tree.split('\n').length
  const mTree = renderTree(mainState.dependencies)
  const mTreeL = mTree.split('\n').length

  const deps = state.dependencies[0].dependencies
  const mDeps = mainState.dependencies[0].dependencies

  const h = humanFileSize
  const mState = mainState

  const binDelta = delta(state.size, mState.size)
  const textDelta = delta(state.textSize, mState.textSize)
  const dDelta = delta(deps.length, mDeps.length)
  const tDelta = delta(treeL, mTreeL)

  const lineDiffs = Diff.diffLines(mTree, tree, {
    ignoreWhitespace: false,
    newlineIsToken: false
  })
    .map(change => {
      const prefix = change.added ? '+' : change.removed ? '-' : ''

      return change.value
        .split('\n')
        .map(l => `${prefix} ${l}`)
        .join('\n')
    })
    .join('\n')

  const message = `
${TITLE}

| Metric | ${mainBranchName} | ${name} | Delta |
| --- | --- | --- | --- |
| Direct dependencies | ${mDeps.length} | ${deps.length} | ${dDelta} |
| Total dependencies | ${mTreeL} | ${treeL} | ${tDelta} |
| Binary size | ${h(mState.size)} | ${h(state.size)} | ${binDelta} |
| Text size | ${h(mState.textSize)} | ${h(state.textSize)} | ${textDelta} |

<details>
<summary>Dependencies diff</summary>

\`\`\`diff
${lineDiffs}
\`\`\`
</details>
`

  return message
}

export async function createOrUpdateComment(
  octokit: InstanceType<typeof GitHub>,
  title: string,
  message: string
): Promise<void> {
  core.info(`Find comments for ${github.context.issue.number}`)

  const comments = await octokit.rest.issues.listComments({
    owner: github.context.issue.owner,
    repo: github.context.issue.repo,
    issue_number: github.context.issue.number,
    per_page: 100
  })

  if (comments.status !== 200) {
    throw new Error(
      `Error fetching comments for ${github.context.issue.number}`
    )
  }

  core.info(
    `Found ${comments.data.length} comments. Searching for comments containing ${title}`
  )

  const ourComments = comments.data.filter(
    v => v.user?.login === 'github-actions[bot]' && v.body?.includes(title)
  )

  if (!ourComments.length) {
    core.info('No existing comment found, creating a new comment')
    await octokit.rest.issues.createComment({
      body: message,
      issue_number: github.context.issue.number,
      owner: github.context.issue.owner,
      repo: github.context.issue.repo
    })
  } else {
    core.info(`Updating comment ${ourComments[0].id}`)
    await octokit.rest.issues.updateComment({
      body: message,
      comment_id: ourComments[0].id,
      owner: github.context.issue.owner,
      repo: github.context.issue.repo
    })
  }
}
