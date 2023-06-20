# Cargo dependencies action

Keep track of dependencies and binary size. Posts statistics on pull requests with the number of (direct/indirect) dependencies and the binary size change for Rust/cargo projects.

Internally uses `cargo-tree` and `cargo-bloat`.

Inspired by [orf/cargo-bloat-action](https://github.com/orf/cargo-bloat-action)

## Example workflow configuration

```yaml
name: cargo-dependencies
on:
  pull_request: ~
  push:
    branches:
      - main
jobs:
  cargo_dependencies:
    runs-on: ubuntu-latest
    # allow creating artifacts and comments on PR's
    permissions:
      actions: read
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v3
      - run: rustup toolchain install stable --profile minimal
      - uses: tweedegolf/cargo-dependencies-action
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          bin: app # optionally specify a binary
          mainBranchName: main
```

## Development

This typescript action is based on the [Typescript Action Template](https://github.com/actions/typescript-action). See this repository for the development setup.
