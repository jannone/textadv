import { Op, Project } from "./types.js";
import { generateInputVariations, removeDiacritics } from "./utils.js";

export interface EngineState {
  roomIndex: number,
  output: string[],
  flags: {[key: string]: number},
  gameover: boolean,
}

export class Engine {
  constructor(private project: Project) {
  }

  start(): EngineState {
    return {
      roomIndex: this.project.initialRoomIndex,
      output: [],
      flags: {},
      gameover: false
    }
  }

  getRoomIntro(roomIndex: number): string[] {
    const room = this.project.getRoom(roomIndex)
    return [`[${room.name.trim()}]`, ...room.intro]
  }

  input(str: string, state: EngineState): EngineState {
    const newState = {...state}
    newState.output = []
    const room = this.project.getRoom(state.roomIndex)
    if (!room) {
      throw new Error(`invalid room ${state.roomIndex}`)
    }
    const codes = room.postInput.concat(this.project.postInput)
    for (const code of codes) {
      if (this.matchesOn(str, code.on)) {
        let done = true
        for (const op of code.ops) {
          const success = this.runOp(op, newState)
          if (!success) {
            done = false
            break
          }
        }
        if (done) {
          break
        }
      }
    }
    return newState
  }

  private matchesOn(str: string, on: string) {
    str = removeDiacritics(str).trim().replace(/ +/g, ' ').toLocaleLowerCase()
    on = removeDiacritics(on).trim().replace(/ +/g, ' ').toLocaleLowerCase()
    const variations = generateInputVariations(on)
    for (const variation of variations) {
      if (variation.endsWith('*')) {
        if (variation === '*') {
          return true
        }
        const codeOnStart = variation.replace('*', '').trim()
        if (str.substring(0, codeOnStart.length) === codeOnStart) {
          return true
        }
      }
      if (str === variation) {
        return true
      }
    }
    return false
  }

  private runOp(op: Op, state: EngineState): boolean {
    switch (op.cmd) {
      case "print":
        state.output.push(String(op.params[0]));
        break
      case "check-room":
        state.output.push(...this.getRoomIntro(state.roomIndex));
        break
      case "goto":
        const roomIndex = this.project.rooms.findIndex((room) => room.id === op.params[0]);
        if (roomIndex === -1) {
          throw new Error(`could not find room "${op.params[0]}"`);
        }
        state.roomIndex = roomIndex
        break
      case "set":
        state.flags[op.params[0] as string] = 1
        break
      case "clear":
        state.flags[op.params[0] as string] = 0
        break
      case "zero":
        return !state.flags[op.params[0] as string]
      case "notzero":
        return !!state.flags[op.params[0] as string]
      case "continue":
        return false
      default:
        throw new Error(`invalid op ${op.cmd}`)
    }
    return true
  }
}
