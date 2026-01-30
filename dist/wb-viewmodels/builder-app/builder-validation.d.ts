export default BuilderValidation;
declare namespace BuilderValidation {
    let schemaCache: {};
    let testQueue: any[];
    let isProcessing: boolean;
    function getSchema(behavior: any): Promise<any>;
    function validateValue(value: any, propSchema: any, propName: any): {
        valid: boolean;
        errors: any[];
    };
    function runComplianceTest(behavior: any, element: any, propName: any, newValue: any): Promise<{
        id: string;
        behavior: any;
        property: any;
        value: any;
        timestamp: string;
        schemaValid: boolean;
        behaviorValid: boolean;
        errors: any[];
        warnings: any[];
    }>;
    function logTestFailure(testResult: any): Promise<void>;
    function saveToServer(): Promise<void>;
    function showTestError(testResult: any): void;
    function getPendingFailures(): any;
    function clearPendingFailures(): void;
    function logFix(fix: any): Promise<string>;
}
//# sourceMappingURL=builder-validation.d.ts.map