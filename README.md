# action-compare-development-time

## Description

Action that returns the interval (in days) between the start of development and the opening of the Pull Request.

## Requiremets

- Personal Access Token

## Usage for metrics through Git Flow

1. Create directory `.github/worfklows` in the root of your project;

2. Create file `compare.yaml` with content similar to the following:

```yaml
name: Compare
on:
  pull_request:
    types: [opened, reopened, synchronize]
    branches:
      - main
    
jobs:
  compare-time-development:
    runs-on: ubuntu-latest
    steps:
      - name: Compare Development Time
        uses: padupe/action-compare-development-time@1.0.0
        with:
          githubToken: ${{ secrets.PAT_TOKEN }}
```

## General use

```yaml
        uses: padupe/action-compare-development-time@1.1.0
        with:
          githubToken: ${{ secrets.PAT_TOKEN }}
```

## Output

`interval` in days.