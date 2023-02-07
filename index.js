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
            const href = github.context.ref.split('/')[3]

            const branchDefault = await getDefaultBranch(github.context.payload.repository.owner.login, github.context.payload.repository.name)
            const branchBase = await getBaseBranch(github.context.payload.repository.owner.login, github.context.payload.repository.name, href)
            const getDateDefaultBranch = await getLastCommitDefaultBranch(github.context.payload.repository.owner.login, github.context.payload.repository.name)
            const getDateBranchEvent = await getLastCommitBranchBase(github.context.payload.repository.owner.login, github.context.payload.repository.name, branchBase)

            const interval = compareDate(getDateDefaultBranch.date, getDateBranchEvent.date)

            core.setOutput(`This implementation has an interval of ${interval} days compared to branch ${branchDefault}.`)
        } else {
            core.setFailed(`"githubToken" is required!`)
        }

    } catch (error) {
        core.setFailed(`Error at Action: ${error}`)
    }
}

async function getDefaultBranch(repoOwner, repoName) {
    console.log('getDefaultBranch - ENTER')

    const defaultBranch = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: repoOwner,
        repo: repoName
    })

    console.log(`Return at "getDefaultBranch": ${defaultBranch.data.default_branch}`)

    return defaultBranch.data.default_branch
}

async function getBaseBranch(repoOwner, repoName, pullRequestNumber) {
    console.log('getBaseBranch - ENTER')
    const baseBranch = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner: repoOwner,
        repo: repoName,
        pull_number: pullRequestNumber
    })

    console.log(`Return at "getBaseBranch": ${baseBranch.data.head.ref}`)

    return baseBranch.data.head.ref
}

async function getLastCommitDefaultBranch(repoOwner, repoName) {
    console.log('getLastCommitDefaultBranch - ENTER')

    const commits = await octokit.request('GET /repos/{owner}/{repo}/commits', {
        owner: repoOwner,
        repo: repoName
    })

    const lastCommit = commits.data[0]

    if(!lastCommit) {
        core.setFailed('Failure at "getLastCommitBranchDefault".')
    }

    console.log(`Return at "getLastCommitBranchDefault": ${lastCommit.commit.author.date}`)
    
    return lastCommit.commit.author.date
}

async function getLastCommitBranchBase(repoOwner, repoName, branchRef) { 
    console.log('getLastCommitBranchBase - ENTER')

    const commits = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: repoOwner,
        repo: repoName,
        ref: branchRef
    })
    
    const lastCommit = commits.data
    
    if(!lastCommit) {
        core.setFailed('Failure at "getLastCommitBranchBase".')
    }

    console.log(`Return at "getLastCommitBranchBase": ${lastCommit.commit.author.date}`)

    return lastCommit.commit.author.date
}

function compareDate(baseDate, lastDate) {
    console.log('compareDate - ENTER')

    const base = new Date(baseDate)
    const last = new Date(lastDate)

    const difference = last.getTime() - base.getTime()

    console.log(`Return at "compareDate": ${Math.ceil(difference / (1000 * 3600 * 24))}`)

    return Math.ceil(difference / (1000 * 3600 * 24))
}

run()