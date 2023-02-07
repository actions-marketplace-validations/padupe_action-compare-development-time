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

            let branchEvent

            if (href.length > 2) {
                branchEvent = `${href[1]}/${href[2]}`
            } else {
                branchEvent = href[1]
            }

            const branchDefault = github.context.payload.default_branch
            
            const getDateDefaultBranch = await getLastCommitBranchDefault(github.context.payload.repository.owner.login, github.context.payload.repository.name)
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

async function getLastCommitBranchDefault(repoOwner, repoName) {
    const commits = await ocktokit.request('GET /repos/{owner}/{repo}/commits', {
        owner: repoOwner,
        repo: repoName
    })

    const lastCommit = commits.data[0]

    return {
        sha: lastCommit.sha,
        author: lastCommit.commit.author.name,
        date: lastCommit.commit.author.date
    }
}

async function getLastCommitBranchBase(repoOwner, repoName, branchRef) {  
    const commits = await ocktokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner: repoOwner,
        repo: repoName,
        ref: branchRef
    })

    const lastCommit = commits.data

    return {
        sha: lastCommit.sha,
        author: lastCommit.commit.author.name,
        date: lastCommit.commit.author.date
    }
}

function compareDate(baseDate, lastDate) {
    const base = new Date(baseDate)
    const last = new Date(lastDate)

    const difference = last.getTime() - base.getTime()
    return Math.ceil(difference / (1000 * 3600 * 24))
}

run()