export type StoryGenre =
  | "fantasy"
  | "romance"
  | "sci-fi"
  | "mystery"
  | "horror"
  | "drama"
  | "adventure"
  | "dark-academia"
  | "enemies-to-lovers"
  | "found-family";

export type StoryLanguage = "ru" | "en" | "de" | "fr" | "es";

export type StoryMediaKind = "character" | "world" | "chapter" | "fact";

export type StoryMediaAsset = {
  id: string;
  kind: StoryMediaKind;
  title: string;
  prompt: string;
  /** characterId / chapterId / custom fact key */
  entityId?: string;
  imageUrl?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
  showInReader?: boolean;
  createdAt: string;
};

export type StoryAnalysisSeverity = "critical" | "attention" | "good";

export type StoryAnalysisRemark = {
  id: string;
  severity: StoryAnalysisSeverity;
  title: string;
  detail: string;
  suggestion?: string;
  status: "pending" | "applied" | "dismissed";
};

export type StoryAnalysis = {
  id: string;
  focus?: string;
  summary: string;
  remarks: StoryAnalysisRemark[];
  createdAt: string;
};

export type CharacterRelationType =
  | "ally"
  | "enemy"
  | "lover"
  | "family"
  | "mentor"
  | "rival"
  | "neutral";

export type StoryCharacter = {
  id: string;
  name: string;
  role: string;
  age?: string;
  appearance: string;
  personality: string;
  backstory: string;
  motivation: string;
  secrets?: string;
  tags: string[];
  imageUrl?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
  position?: { x: number; y: number };
};

export type CharacterRelation = {
  id: string;
  fromId: string;
  toId: string;
  type: CharacterRelationType;
  label: string;
  intensity: number;
};

export type StoryChapter = {
  id: string;
  number: number;
  title: string;
  summary: string;
  content: string;
  wordCount: number;
  /** Optional media asset id shown in reader */
  mediaAssetId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoryWorld = {
  setting: string;
  era: string;
  tone: string;
  rules: string[];
  locations: string[];
};

export type StoryEpisode = {
  id: string;
  title: string;
  characterId: string;
  chapterId?: string;
  sceneDescription: string;
  videoOrderId?: string;
  videoUrl?: string | null;
  status: "draft" | "processing" | "done" | "error";
  createdAt: string;
  updatedAt: string;
};

export type StoryProject = {
  id: string;
  title: string;
  premise: string;
  charactersHint?: string;
  genres: StoryGenre[];
  language: StoryLanguage;
  targetWordCount: number;
  premiumMode: boolean;
  /** Пользователь изменил поля — ИИ нужно обновить основу */
  needsAiRefresh?: boolean;
  synopsis: string;
  hook: string;
  themes: string[];
  world: StoryWorld;
  characters: StoryCharacter[];
  relations: CharacterRelation[];
  chapters: StoryChapter[];
  episodes: StoryEpisode[];
  outline: string[];
  /** Public share slug — when set and isPublic, story is readable at /storystudio/s/[shareId] */
  shareId?: string | null;
  isPublic?: boolean;
  media?: StoryMediaAsset[];
  analysis?: StoryAnalysis | null;
  status: "draft" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
};

export type CreateStoryInput = {
  title: string;
  premise: string;
  charactersHint?: string;
  genres: StoryGenre[];
  language: StoryLanguage;
  targetWordCount: number;
  premiumMode?: boolean;
};

export type GenerateCharacterInput = {
  storyId: string;
  name?: string;
  role?: string;
  hint?: string;
};

export type GenerateChapterInput = {
  storyId: string;
  chapterNumber?: number;
  instructions?: string;
};

export type GenerateCharacterImageInput = {
  storyId: string;
  characterId: string;
};

export type CreateStoryVideoInput = {
  storyId: string;
  characterId: string;
  episodeTitle?: string;
  sceneDescription?: string;
  chapterId?: string;
  duration: "4" | "6" | "8";
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  quality: "standard" | "pro";
  motionStyle: "soft_zoom" | "premium_parallax" | "light_sweep" | "marketplace_motion";
  generateAudio?: boolean;
};
