"use client";

let currentSection = "";
let lastAction = "";
let lastActionLabel = "";
let lastActionAt = 0;

export function setPresenceSection(section: string) {
  currentSection = section;
}

export function getPresenceSection() {
  return currentSection;
}

export function recordPresenceAction(action: string, label?: string) {
  lastAction = action;
  lastActionLabel = label || action;
  lastActionAt = Date.now();
}

export function getPresenceAction() {
  return {
    action: lastAction,
    label: lastActionLabel,
    at: lastActionAt
  };
}
