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

            const interval = compareDate(getDateDefaultBranch.date, getDateBranchEvent.date)

            console.info(`This implementation has an interval of ${Number(interval)} days compared to branch ${branchDefault}.`)
            core.setOutput(`This implementation has an interval of ${Number(interval)} days compared to branch ${branchDefault}.`)
        } else {
            core.setFailed(`"githubToken" is required!`)
        }

    } catch (error) {
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

    console.info(`Date - Default Branch: ${lastCommit.commit.author.date}`)

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

    console.info(`Date - Branch Base: ${lastCommit.commit.author.date}`)

    return lastCommit.commit.author.date
}

function compareDate(baseDate, lastDate) {
    const base = new Date(baseDate)
    console.log(`dateBase: ${base}`)
    console.log(`typeof: ${typeof(base)}`)
    console.log(`getTime: ${base.getTime()}`)
    const last = new Date(lastDate)
    console.log(`dateLast: ${last}`)
    console.log(`typeof: ${typeof(last)}`)
    console.log(`getTime: ${last.getTime()}`)

    const difference = last.getTime() - base.getTime()

    return Math.ceil(difference / (1000 * 3600 * 24))
}

run()