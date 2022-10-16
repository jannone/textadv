export type Cmd =
  "goto"|"print"|"set"|"clear"|"zero"|"notzero"|"continue"|"check-room"

export interface Op {
  cmd: Cmd,
  params: (string|number)[]
}

export interface Code {
  on: string,
  ops: Op[],
}

export enum Type {
  project = 'project',
  location = 'location',
  object = 'object',
}

export interface Node {
  type: Type,
  id: string,
  name: string,
  onInput: Code[],
  intro: string[],
}

export class Project implements Node {
  type = Type.project
  id = ''
  name = ''
  onInput = []
  intro = []

  children: Node[] = []
  initialRoomIndex: number = 0 // TODO: find a way to express "initialRoomIndex" on the markdown
  meta: any

  static fromJSON(json: any) {
    const project = new Project()
    Object.assign(project, json)
    return project
  }

  addChild(type: Type, id: string): Node {
    let child = this.findChildById(id)
    if (child && child.type !== type) {
      throw new Error(`Duplicate node ${id} with different type`)
    }
    if (!child) {
      child = {
        type,
        id,
        name: id,
        onInput: [],
        intro: [],
      }
      this.children.push(child)
    }
    return child
  }

  findChildById(id: string) {
    for (const child of this.children) {
      if (child.id === id) {
        return child
      }
    }
  }

  getChildren() {
    return this.children
      .map((child, index) => ({...child, index }))
      .reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {} as { [key: string]: Node & {index: number}; })
  }

  getChildrenByType(type: Type) {
    return this.children
      .map((child, index) => ({...child, index }))
      .filter((child) => child.type === type)
      .reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {} as { [key: string]: Node & {index: number}; })
  }

  getChild(index: number): Node {
    return this.children[index]
  }

  getChildById(id: string): Node & {index: number} | undefined {
    return this.children
      .map((child, index) => ({...child, index }))
      .find((child) => child.id === id)
  }
}

export type Generator = (project: Project) => string
