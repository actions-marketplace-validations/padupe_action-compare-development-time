const { Octokit } = require('@octokit/core')
const core = require('@actions/core')
const github = require('@actions/github')

const githubToken = core.getInput('githubToken')

const ocktokit = new Octokit({
    auth: githubToken
})

async function run() {
    try {
        if (githubToken) {
            const href = github.context.ref.split('/')

            core.setCommandEcho(`GITHUB CONTEXT: ${github.context}`)

            core.setOutput(`Branch trigger action: ${href}`)

            let branchEvent

            if (href.length > 2) {
                branchEvent = `${href[1]}/${href[2]}`
            } else {
                branchEvent = href[1]
            }

            const branchDefault = await getDefaultBranch(github.context.payload.repository.owner.login, github.context.payload.repository.name)
            const getDateDefaultBranch = await getLastCommitDefaultBranch(github.context.payload.repository.owner.login, github.context.payload.repository.name)
            const getDateBranchEvent = await getLastCommitBranchBase(github.context.payload.repository.owner.login, github.context.payload.repository.name, branchEvent)

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
    core.setCommandEcho('getDefaultBranch - ENTER')

    const defaultBranch = await ocktokit.request('GET /repos/{owner}/{repo}', {
        owner: repoOwner,
        repo: repoName
    })

    core.setCommandEcho(`Return at "getDefaultBranch": ${defaultBranch.data.default_branch}`)

    return defaultBranch.data.default_branch
}

async function getLastCommitDefaultBranch(repoOwner, repoName) {
    core.setCommandEcho('getLastCommitDefaultBranch - ENTER')

    const commits = await ocktokit.request('GET /repos/{owner}/{repo}/commits', {
        owner: repoOwner,
        repo: repoName
    })

    const lastCommit = commits.data[0]

    if(!lastCommit) {
        core.setFailed('Failure at "getLastCommitBranchDefault".')
    }

    core.setCommandEcho(`Return at "getLastCommitBranchDefault": ${lastCommit.commit.author.date}`)
    
    return lastCommit.commit.author.date
}

async function getLastCommitBranchBase(repoOwner, repoName, branchRef) { 
    core.setCommandEcho('getLastCommitBranchBase - ENTER')

    const commits = await ocktokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: repoOwner,
        repo: repoName,
        ref: branchRef
    })
    
    const lastCommit = commits.data
    
    if(!lastCommit) {
        core.setFailed('Failure at "getLastCommitBranchBase".')
    }

    core.setCommandEcho(`Return at "getLastCommitBranchBase": ${lastCommit.commit.author.date}`)

    return lastCommit.commit.author.date
}

function compareDate(baseDate, lastDate) {
    core.setCommandEcho('compareDate - ENTER')

    const base = new Date(baseDate)
    const last = new Date(lastDate)

    const difference = last.getTime() - base.getTime()

    core.setCommandEcho(`Return at "compareDate": ${Math.ceil(difference / (1000 * 3600 * 24))}`)

    return Math.ceil(difference / (1000 * 3600 * 24))
}

run()