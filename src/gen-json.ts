import { Project } from "./types.js";

export function generateJson(project: Project) {
  return JSON.stringify(project)
}
