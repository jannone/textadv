import { Project } from "./types";

export function generateJson(project: Project) {
  return JSON.stringify(project)
}
