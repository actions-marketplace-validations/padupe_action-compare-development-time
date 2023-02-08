const { Octokit } = require('@octokit/core')
const core = require('@actions/core')
const github = require('@actions/github')

const githubToken = core.getInput('githubToken')

const octokit = new Octokit({
    auth: githubToken
})

async function run() {
    try {
        if (githubToken) {
            const href = github.context.ref.split('/')[2]

            const branchDefault = await getDefaultBranch(github.context.payload.repository.owner.login, github.context.payload.repository.name)
            const branchBase = await getBaseBranch(github.context.payload.repository.owner.login, github.context.payload.repository.name, href)
            const getDateDefaultBranch = await getLastCommitDefaultBranch(github.context.payload.repository.owner.login, github.context.payload.repository.name)
            const getDateBranchEvent = await getLastCommitBranchBase(github.context.payload.repository.owner.login, github.context.payload.repository.name, branchBase)

            const interval = compareDate(getDateDefaultBranch, getDateBranchEvent)

            core.info(`This implementation has an interval of ${interval} days compared to branch ${branchDefault}.`)
            core.setOutput(`${interval}`)
        } else {
            core.setFailed(`"githubToken" is required!`)
        }

    } catch (error) {
        console.log(error)
        core.setFailed(`Error at Action: ${error}`)
    }
}

async function getDefaultBranch(repoOwner, repoName) {
    const defaultBranch = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: repoOwner,
        repo: repoName
    })

    return defaultBranch.data.default_branch
}

async function getBaseBranch(repoOwner, repoName, pullRequestNumber) {
    const baseBranch = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner: repoOwner,
        repo: repoName,
        pull_number: pullRequestNumber
    })

    return baseBranch.data.head.ref
}

async function getLastCommitDefaultBranch(repoOwner, repoName) {
    const commits = await octokit.request('GET /repos/{owner}/{repo}/commits', {
        owner: repoOwner,
        repo: repoName
    })

    const lastCommit = commits.data[0]

    if(!lastCommit) {
        core.setFailed('Failure at "getLastCommitBranchDefault".')
    }

    return lastCommit.commit.author.date
}

async function getLastCommitBranchBase(repoOwner, repoName, branchRef) { 
    const commits = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: repoOwner,
        repo: repoName,
        ref: branchRef
    })
    
    const lastCommit = commits.data
    
    if(!lastCommit) {
        core.setFailed('Failure at "getLastCommitBranchBase".')
    }

    return lastCommit.commit.author.date
}

function compareDate(baseDate, lastDate) {
    const base = new Date(baseDate)
    const last = new Date(lastDate)

    const difference = last.getTime() - base.getTime()

    return Math.ceil(difference / (1000 * 3600 * 24))
}

run()