export interface VulcanCatalogCommand {
    name: string;
    command: string;
    group: string;
    description: string;
    auth_required: boolean;
    dangerous: boolean;
    parameters: Array<Record<string, unknown>>;
    example?: string;
}
export interface VulcanToolCatalog {
    schema_version: string;
    cli_version: string;
    description: string;
    groups: Record<string, string>;
    commands: VulcanCatalogCommand[];
}
export interface VulcanMcpConfig {
    mcpServers?: Record<string, {
        command: string;
        args?: string[];
    }>;
}
export interface VulcanSkillEntry {
    name: string;
    path: string;
    category: "vulcan" | "clawd" | "other";
}
export interface VulcanCatalogSummary {
    cliVersion: string;
    groupCount: number;
    commandCount: number;
    dangerousCommands: number;
    groups: Array<{
        name: string;
        description: string;
        commandCount: number;
    }>;
    mcpServer?: {
        command: string;
        args: string[];
    };
    skills: VulcanSkillEntry[];
}
export declare function loadVulcanToolCatalog(repoRoot: string): Promise<VulcanToolCatalog>;
export declare function loadVulcanMcpConfig(repoRoot: string): Promise<VulcanMcpConfig>;
export declare function summarizeVulcanCatalog(repoRoot: string): Promise<VulcanCatalogSummary>;
