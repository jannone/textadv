import { parseFile, validateProject } from "./parser.js"
import index from './__test__/index.json' assert {type: 'json'}

describe('Parser', () => {
  it('parses a simple project', async () => {
    const { project } = await parseFile('src/__test__/index.md')
    const errors = validateProject(project)
    expect(errors.length).toEqual(0)
    expect(JSON.parse(JSON.stringify(project))).toEqual(index)
  })
})
