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

            console.log(href)

            console.log("github context: ", github.context)
            console.log("github ref: ", github.context.ref)
            console.log("github owner: ", github.context.payload.repository.owner)
            console.log("github pull request body: ", github.context.payload.pull_request.body)

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
    console.log('getDefaultBranch - ENTER')

    const defaultBranch = await ocktokit.request('GET /repos/{owner}/{repo}', {
        owner: repoOwner,
        repo: repoName
    })

    console.log(`Return at "getDefaultBranch": ${defaultBranch.data.default_branch}`)

    return defaultBranch.data.default_branch
}

async function getLastCommitDefaultBranch(repoOwner, repoName) {
    console.log('getLastCommitDefaultBranch - ENTER')

    const commits = await ocktokit.request('GET /repos/{owner}/{repo}/commits', {
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

    const commits = await ocktokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
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