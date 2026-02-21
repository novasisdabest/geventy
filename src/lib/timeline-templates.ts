export type BlockType = "game" | "custom" | "slideshow" | "message_wall";
export type EventType = "silvestr" | "birthday" | "company" | "reunion" | "custom";

export interface TemplateBlock {
  block_type: BlockType;
  title: string;
  duration_minutes: number;
  /** Slug from games_library — resolved to game_id at insert time */
  game_slug?: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  silvestr: "Silvestr",
  birthday: "Narozeniny",
  company: "Firemni akce",
  reunion: "Sraz / Reunion",
  custom: "Vlastni",
};

export const SERIOUSNESS_LABELS: Record<number, { label: string; description: string; color: string }> = {
  1: { label: "Totalni chaos", description: "Vse je dovoleno, zadna pravidla", color: "text-pink-400" },
  2: { label: "Party hard", description: "Volnejsi pravidla, hodne zabavy", color: "text-orange-400" },
  3: { label: "Vybalancovane", description: "Mix zabavy a slusnosti", color: "text-yellow-400" },
  4: { label: "Slusna akce", description: "Kultivorany humor, firemni-friendly", color: "text-blue-400" },
  5: { label: "Ultra seriozni", description: "Formalni ton, zadne excesy", color: "text-cyan-400" },
};

export const TIMELINE_TEMPLATES: Record<EventType, TemplateBlock[]> = {
  silvestr: [
    { block_type: "custom", title: "Privitani hostu", duration_minutes: 15 },
    { block_type: "game", title: "Party Bingo", duration_minutes: 15, game_slug: "bingo" },
    { block_type: "game", title: "Hot Take", duration_minutes: 20, game_slug: "hot-take" },
    { block_type: "custom", title: "Odpocitavani pulnoci", duration_minutes: 10 },
    { block_type: "message_wall", title: "Novorocni prani", duration_minutes: 15 },
  ],
  birthday: [
    { block_type: "custom", title: "Privitani hostu", duration_minutes: 15 },
    { block_type: "game", title: "Kdo jsem ted?", duration_minutes: 20, game_slug: "who-am-i" },
    { block_type: "game", title: "Dve pravdy, jedna lez", duration_minutes: 20, game_slug: "two-truths" },
    { block_type: "game", title: "Kviz o oslavenci", duration_minutes: 15, game_slug: "quiz" },
    { block_type: "slideshow", title: "Fotky z minulosti", duration_minutes: 10 },
  ],
  company: [
    { block_type: "custom", title: "Uvod a agenda", duration_minutes: 10 },
    { block_type: "game", title: "Team Bingo", duration_minutes: 15, game_slug: "bingo" },
    { block_type: "game", title: "Kdo jsem ted?", duration_minutes: 20, game_slug: "who-am-i" },
    { block_type: "game", title: "Kreslici souboj", duration_minutes: 20, game_slug: "drawing-battle" },
    { block_type: "message_wall", title: "Zpetna vazba", duration_minutes: 10 },
  ],
  reunion: [
    { block_type: "custom", title: "Privitani a predstaveni", duration_minutes: 15 },
    { block_type: "game", title: "Dve pravdy, jedna lez", duration_minutes: 20, game_slug: "two-truths" },
    { block_type: "game", title: "Kdo jsem ted?", duration_minutes: 20, game_slug: "who-am-i" },
    { block_type: "slideshow", title: "Spolecne vzpominky", duration_minutes: 15 },
    { block_type: "message_wall", title: "Vzkazy a postrehy", duration_minutes: 10 },
  ],
  custom: [],
};
