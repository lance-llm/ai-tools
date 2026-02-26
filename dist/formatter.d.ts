export interface AnalysisResult {
    error?: string;
    fix?: string;
    hint?: string;
    raw?: string;
}
export declare function formatResult(result: string): AnalysisResult;
export declare function printResult(result: AnalysisResult, _language?: string): void;
export declare function printLoading(text?: string): void;
export declare function printWelcome(): void;
export declare function printInputPrompt(): void;
export declare function printClipboardRead(): void;
export declare function printLanguageDetected(lang: string): void;
export declare function printError(message: string): void;
export declare function printInfo(message: string): void;
export declare function printSuccess(message: string): void;
//# sourceMappingURL=formatter.d.ts.map