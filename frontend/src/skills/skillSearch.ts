// Searching skills by name and description (the Skills page and the member list of a skill group).

import type { Skill } from "../api/skills";

/** The skills whose name or description contains every word of the query. */
export function matchingSkills(skills: Skill[], query: string): Skill[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return skills.filter((skill) => {
    const text = `${skill.name} ${skill.description}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
