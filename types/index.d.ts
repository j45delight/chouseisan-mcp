export interface ChouseiSanEventData {
    title: string;
    memo?: string;
    timeFormat?: string;
    dateCandidates?: string[];
}
export interface ChouseiSanResult {
    success: boolean;
    url?: string;
    message?: string;
    error?: string;
}
export interface DateCandidate {
    date: Date;
    formatted: string;
    dayOfWeek: number;
}
export interface DateParseOptions {
    startDate?: Date;
    endDate?: Date;
    timeFormat?: string;
    daysOfWeek?: number[];
}
export interface LLMSamplingRequest {
    messages: LLMMessage[];
    modelPreferences?: ModelPreferences;
    maxTokens?: number;
    systemPrompt?: string;
}
export interface LLMMessage {
    role: 'user' | 'assistant';
    content: LLMContent;
}
export interface LLMContent {
    type: 'text';
    text: string;
}
export interface ModelPreferences {
    intelligencePriority?: number;
    speedPriority?: number;
    costPriority?: number;
    hints?: ModelHint[];
}
export interface ModelHint {
    name?: string;
}
export interface LLMSamplingResponse {
    role: 'assistant';
    content: LLMContent;
    model: string;
    stopReason?: string;
}
//# sourceMappingURL=index.d.ts.map