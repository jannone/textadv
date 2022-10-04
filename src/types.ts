export type Cmd =
  "goto"|"print"|"set"|"clear"|"zero"|"notzero"|"continue"|"check-room"

export interface Op {
  cmd: Cmd,
  params: (string|number)[]
}

export interface Code {
  on: string,
  ops: Op[],
  done: boolean,
}

export interface Node {
  id: string,
  name: string,
  preInput: Code[], // TODO: find a way to express "preInput" on the markdown
  postInput: Code[],
  aliases: {[key: string]: string[]}, // TODO: find a way to express "aliases" on the markdown
  intro: string[],
}

export class Room implements Node {
  id = ''
  name = ''
  preInput = []
  postInput: Code[] = []
  aliases = {}
  intro = []
}

export class Project extends Room {
  rooms: Room[] = []
  initialRoomIndex: number = 0 // TODO: find a way to express "initialRoomIndex" on the markdown
  meta: any

  findRoomById(id: string) {
    for (const room of this.rooms) {
      if (room.id === id) {
        return room
      }
    }
  }

  getRooms() {
    return this.rooms.reduce((prev, cur) => {
      prev[cur.id] = cur
      return prev
    }, {} as { [key: string]: Room; })
  }

  getRoom(index: number): Room {
    return this.rooms[index]
  }
}

export type Generator = (project: Project) => string
