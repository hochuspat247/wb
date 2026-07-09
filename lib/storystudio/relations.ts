import type { CharacterRelation, CharacterRelationType, StoryProject } from "@/types/storystudio";

export const RELATION_TYPE_OPTIONS: { value: CharacterRelationType; label: string }[] = [
  { value: "ally", label: "Союзник" },
  { value: "enemy", label: "Враг" },
  { value: "lover", label: "Любовь" },
  { value: "family", label: "Семья" },
  { value: "mentor", label: "Наставник" },
  { value: "rival", label: "Соперник" },
  { value: "neutral", label: "Нейтрально" }
];

export const RELATION_COLORS: Record<CharacterRelationType, string> = {
  ally: "#6EDCFF",
  enemy: "#ff6b8a",
  lover: "#ff8fd4",
  family: "#7CFF6B",
  mentor: "#ffd56e",
  rival: "#ff9f43",
  neutral: "#96A0B5"
};

export function getRelationTypeLabel(type: CharacterRelationType) {
  return RELATION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function defaultRelationLabel(type: CharacterRelationType) {
  return getRelationTypeLabel(type);
}

export function findRelationBetween(
  relations: CharacterRelation[],
  fromId: string,
  toId: string
) {
  return relations.find(
    (relation) =>
      (relation.fromId === fromId && relation.toId === toId) ||
      (relation.fromId === toId && relation.toId === fromId)
  );
}

export function formatRelationsForPrompt(story: StoryProject) {
  if (!story.relations.length) {
    return "Автор пока не задал связи на карте — опирайся на синопсис и характеры.";
  }

  const byId = new Map(story.characters.map((character) => [character.id, character.name]));

  return story.relations
    .map((relation) => {
      const from = byId.get(relation.fromId) ?? "неизвестный";
      const to = byId.get(relation.toId) ?? "неизвестный";
      const typeLabel = getRelationTypeLabel(relation.type);
      const detail = relation.label?.trim() ? ` — ${relation.label.trim()}` : "";
      return `• ${from} → ${to}: ${typeLabel}${detail} (напряжение ${relation.intensity}/10)`;
    })
    .join("\n");
}

export function formatCharactersForPrompt(story: StoryProject) {
  if (!story.characters.length) return "Персонажи не заданы.";

  return story.characters
    .map(
      (character) =>
        `• ${character.name} (${character.role}): ${character.personality}. Мотивация: ${character.motivation}`
    )
    .join("\n");
}
