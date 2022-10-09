import * as fs from 'fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import * as YAML from 'yaml'

import { ListItem } from 'mdast';
import { Cmd, Code, Node, Op, Project, Room } from './types.js';
import { removeDiacritics } from './utils.js';
import { Root } from 'remark-parse/lib/index.js';
import path from 'path';

async function parse(ast: Root, project: Project, basePath: string) {
  let inMeta = false
  let childIndex = 0
  let node: Node = project
  if (ast.type !== 'root') throw new Error('expected root node as parameter')
  for (const child of ast.children) {
    ++childIndex
    if (child.type === 'thematicBreak' && childIndex === 1) {
      inMeta = true
      continue
    }
    if (child.type === 'heading' && child.depth === 1) {
      // intro block
      const { id, name } = parseTitle((child.children[0] as any).value)
      project.id = id
      project.name = name
    }
    if (child.type === 'heading' && child.depth === 2) {
      if (inMeta) {
        inMeta = false
        project.meta = parseMeta((child.children[0] as any).value)
        continue
      }
      // location block
      const { id, name } = parseTitle((child.children[0] as any).value)
      const newRoom = project.findRoomById(id) ?? new Room()
      newRoom.id = id
      newRoom.name = name
      project.rooms.push(newRoom)
      node = newRoom
    }
    if (child.type === 'paragraph') {
      if (child.children[0]?.type === 'link') {
        const linkType = (child.children[0]?.children[0] as any).value
        switch (linkType) {
          case 'extends':
            const url: string = child.children[0]?.url
            const newPath = path.join(basePath, url)
            await parseFile(newPath, project)
            break
          default:
            throw new Error(`Invalid link type "${linkType}"`)
        }
      }

      // otherwise, read as text
      const text = (child.children[0] as any).value
      node.intro.push(text)
    }
    if (child.type === 'list') {
      const codes = child.children.map((item) => parseCode(item))
      node.postInput.push(...codes)
    }
  }

  const errors = validate(project)
  if (errors.length > 0) {
    throw new Error(`Error(s): ${errors.join("\n")}`)
  }

  return project
}

function parseCode(item: ListItem) {
  const paragraph = item.children[0]
  if (paragraph.type !== 'paragraph') throw new Error('expected paragraph type')
  if (paragraph.children[0].type !== 'text') throw new Error('expected text type')
  const itemText = paragraph.children[0].value
  const codesList = item.children[1]
  if (codesList.type !== 'list') throw new Error('expected list type')
  const ops: Op[] = []
  for (const codesListItem of codesList.children) {
    const codeItemParagraph = codesListItem.children[0]
    if (codeItemParagraph.type !== 'paragraph') throw new Error('expected paragraph type')
    if (codeItemParagraph.children[0].type !== 'text') throw new Error('expected text type')
    const codesListItemText = codeItemParagraph.children[0].value.replace(/""/g, '\\"').trim()
    try {
      ops.push(parseOp(codesListItemText))
    } catch (ex) {
      console.error(`Error parsing codes: ${codesListItemText}`)
      throw ex
    }
  }
  return {
    on: itemText,
    ops,
    done: true // TODO: find a way to express "not done" on the markdown
  }
}

function parseTitle(title: string) {
  title = title.trim()
  let m
  if (m = title.match(/^([^\[]+)\[([^\]]+)\]$/)) {
    return {
      name: m[1],
      id: m[2],
    }
  }
  return {
    name: title,
    id: removeDiacritics(title).toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
}

function parseOp(text: string): Op {
  try {
    const jsonParsed = JSON.parse(text)
    if (typeof(jsonParsed) === 'string') {
      return {
        cmd: 'print',
        params: [jsonParsed]
      }
    }
  } catch (err) {
    // fallthrough
  }
  const [cmd, ...params] = text.split(/ +/g)
  if (!["print", "goto", "set", "clear", "zero", "notzero", "continue", "check-room"].includes(cmd)) {
    throw new Error(`Invalid command "${cmd}"`)
  }
  return {
    cmd: cmd as Cmd,
    params,
  }
}

function validate(project: Project) {
  const errors: string[] = []

  const rooms = project.getRooms()

  function validateCodes(codes: Code[]) {
    for (const code of codes) {
      for (const op of code.ops) {
        if (typeof(op) === 'string') continue
        if (op.cmd === 'goto') {
          if (!rooms[op.params[0]]) {
            errors.push(`Room "${op.params[0]}" not found`)
          }
        }
      }
    }
  }

  validateCodes(project.preInput)
  validateCodes(project.postInput)
  for (const room of project.rooms) {
    validateCodes(room.preInput)
    validateCodes(room.postInput)
  }

  return errors
}

async function parseMD(path: string) {
  const src = fs.readFileSync(path, 'utf8')
  const mdAST = unified()
    .use(remarkParse)
    .parse(src);
  return mdAST
}

export async function parseFile(filePath: string, project?: Project) {
  const basePath = path.dirname(filePath)
  const mdAST = await parseMD(filePath)
  return {
    project: await parse(mdAST, project ?? new Project(), basePath),
    mdAST
  }
}

function parseMeta(value: string): any {
  return YAML.parse(value)  
}
