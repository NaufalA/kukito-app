import { GeminiModel } from "../gemini"

export type ListGeminiModelsResponse = {
    models: GeminiModel[];
    nextPageToken: string;
}
