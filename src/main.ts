import * as core from '@actions/core'
import * as github from '@actions/github'
import {getState} from './state'
import {createOrUpdateComment, formatComment} from './comment'
import {fetchMainState, saveState} from './artifact'

export const ALLOWED_EVENTS = ['pull_request', 'push']
export const TITLE = 'Number of dependencies and binary size impact report'
export const STATE_NAME = 'dependencies-state'
export const TMP_DIR = 'tmp'

async function run(): Promise<void> {
  try {
    if (!ALLOWED_EVENTS.includes(github.context.eventName)) {
      core.warning('This can only be used with on a pull_request and pushes')
      return
    }

    const workingDirectory = core.getInput('workingDirectory')

    if (workingDirectory !== '.') {
      process.chdir(workingDirectory)
    }

    const state = await getState()

    const mainBranchName = core.getInput('mainBranchName')
    const branchName = github.context.ref.replace('refs/heads/', '')

    if (branchName === mainBranchName) {
      await saveState(state)
    }

    if (github.context.eventName !== 'pull_request') {
      core.info('A diff will only be generated on pull requests.')
      return
    }

    const token = core.getInput('token')
    const octokit = github.getOctokit(token)

    const mainState = await fetchMainState(octokit, mainBranchName)

    if (!mainState) {
      return
    }

    core.info('Main branch data fetched from artifacts')

    const message = formatComment(state, mainState, mainBranchName)

    core.info(message)

    if (github.context.issue.number) {
      try {
        await createOrUpdateComment(octokit, TITLE, message)
      } catch (e) {
        core.warning((e as Error).message)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
