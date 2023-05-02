import * as core from '@actions/core'
import * as artifact from '@actions/artifact'
import * as fs from 'fs/promises'
import * as github from '@actions/github'
import {TMP_DIR, STATE_NAME} from './main'
import {State} from './state'
import {GitHub} from '@actions/github/lib/utils'
import {exec} from './util'

export async function saveState(state: State): Promise<void> {
  await fs.mkdir(TMP_DIR, {recursive: true})

  // write state to file
  await fs.writeFile(
    `${TMP_DIR}/${STATE_NAME}.json`,
    JSON.stringify(state, null, 2)
  )

  if (process.env.ACTIONS_RUNTIME_TOKEN) {
    // upload file as artifact
    const artifactClient = artifact.create()
    await artifactClient.uploadArtifact(
      STATE_NAME,
      [`${TMP_DIR}/${STATE_NAME}.json`],
      TMP_DIR
    )
  }

  core.info('State saved and uploaded as artifact')
}

export async function fetchMainState(
  octokit: InstanceType<typeof GitHub>,
  mainBranchName: string
): Promise<State | null> {
  const {data: artifacts} = await octokit.rest.actions.listArtifactsForRepo({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    name: STATE_NAME
  })

  core.info(`${artifacts.artifacts.length} artifacts found for repository`)

  if (artifacts.artifacts.length === 0) {
    core.warning(
      'No artifacts found. This actions should be executed on a main branch before it can generate a diff.'
    )
    return null
  }

  const last = artifacts.artifacts[0]

  const {data: zip} = (await octokit.rest.actions.downloadArtifact({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    artifact_id: last.id,
    archive_format: 'zip'
  })) as {data: ArrayBuffer}

  core.info(`Retrieved artifact ${last.id}, size: ${zip.byteLength} bytes`)

  await fs.mkdir(TMP_DIR, {recursive: true})

  await fs.writeFile(`${TMP_DIR}/${mainBranchName}.zip`, Buffer.from(zip))

  core.info(`Written ${TMP_DIR}/${mainBranchName}.zip`)

  await exec('unzip', [
    '-d',
    TMP_DIR,
    '-q',
    '-o',
    `${TMP_DIR}/${mainBranchName}.zip`
  ])

  core.info(`Extracted ${TMP_DIR}/${STATE_NAME}.json`)

  const mainStateText = await fs.readFile(
    `${TMP_DIR}/${STATE_NAME}.json`,
    'utf8'
  )
  const mainState = JSON.parse(mainStateText)

  return mainState
}
