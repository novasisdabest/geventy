export interface ModuleConfigField {
  id: string;
  label: string;
  type: "number" | "text" | "select" | "boolean";
  defaultValue: string | number | boolean;
  options?: string[];
}

export interface ModerationStep {
  id: number;
  label: string;
}

export interface GameModuleManifest {
  slug: string;
  configSchema: ModuleConfigField[];
  moderationSteps: ModerationStep[];
}
