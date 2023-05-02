import {expect, test} from '@jest/globals'
import {parseTree, renderTree} from '../src/util'

const EXPECTED_TREE = [
  {
    name: 'cargo-dependencies-action-test',
    version: 'v0.1.0',
    dependencies: [
      {
        name: 'rand',
        version: 'v0.8.5',
        dependencies: [
          {name: 'libc', version: 'v0.2.142', dependencies: []},
          {
            name: 'rand_chacha',
            version: 'v0.3.1',
            dependencies: [
              {name: 'ppv-lite86', version: 'v0.2.17', dependencies: []},
              {
                name: 'rand_core',
                version: 'v0.6.4',
                dependencies: [
                  {
                    name: 'getrandom',
                    version: 'v0.2.9',
                    dependencies: [
                      {name: 'cfg-if', version: 'v1.0.0', dependencies: []},
                      {name: 'libc', version: 'v0.2.142', dependencies: []}
                    ]
                  }
                ]
              }
            ]
          },
          {name: 'rand_core', version: 'v0.6.4', dependencies: []}
        ]
      }
    ]
  }
]

test('parse tree output', async () => {
  const input = `0cargo-dependencies-action-test v0.1.0 (/home/marlon/tg/cargo-dependencies-action)
1rand v0.8.5
2libc v0.2.142
2rand_chacha v0.3.1
3ppv-lite86 v0.2.17
3rand_core v0.6.4
4getrandom v0.2.9
5cfg-if v1.0.0
5libc v0.2.142
2rand_core v0.6.4 (*)`

  let result = parseTree(input)

  await expect(result).toMatchObject(EXPECTED_TREE)
})

test('format tree', async () => {
  const output = renderTree(EXPECTED_TREE)

  const expected = `└─ cargo-dependencies-action-test [v0.1.0]
   └─ rand [v0.8.5]
      ├─ libc [v0.2.142]
      ├─ rand_chacha [v0.3.1]
      |  ├─ ppv-lite86 [v0.2.17]
      |  └─ rand_core [v0.6.4]
      |     └─ getrandom [v0.2.9]
      |        ├─ cfg-if [v1.0.0]
      |        └─ libc [v0.2.142]
      └─ rand_core [v0.6.4]`

  await expect(output).toMatch(expected)
})
