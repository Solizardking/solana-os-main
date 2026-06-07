import { readFile, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
async function readJsonFile(path) {
    const text = await readFile(path, "utf8");
    return JSON.parse(text);
}
export async function loadVulcanToolCatalog(repoRoot) {
    return readJsonFile(join(repoRoot, "vulcan-cli-master", "agents", "tool-catalog.json"));
}
export async function loadVulcanMcpConfig(repoRoot) {
    return readJsonFile(join(repoRoot, "vulcan-cli-master", ".mcp.json"));
}
async function enumerateSkills(repoRoot) {
    const skillsRoot = join(repoRoot, "skills");
    try {
        const entries = await readdir(skillsRoot, { withFileTypes: true });
        return entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => {
            const name = basename(entry.name);
            const category = name.startsWith("vulcan")
                ? "vulcan"
                : name.startsWith("clawd")
                    ? "clawd"
                    : "other";
            return { name, path: join(skillsRoot, name, "SKILL.md"), category };
        });
    }
    catch {
        return [];
    }
}
export async function summarizeVulcanCatalog(repoRoot) {
    const [catalog, mcp, skills] = await Promise.all([
        loadVulcanToolCatalog(repoRoot),
        loadVulcanMcpConfig(repoRoot),
        enumerateSkills(repoRoot),
    ]);
    const groups = Object.entries(catalog.groups).map(([name, description]) => ({
        name,
        description,
        commandCount: catalog.commands.filter((command) => command.group === name).length,
    }));
    const dangerousCommands = catalog.commands.filter((command) => command.dangerous).length;
    const mcpServer = mcp.mcpServers?.vulcan;
    return {
        cliVersion: catalog.cli_version,
        groupCount: groups.length,
        commandCount: catalog.commands.length,
        dangerousCommands,
        groups,
        skills,
        ...(mcpServer
            ? { mcpServer: { command: mcpServer.command, args: mcpServer.args ?? [] } }
            : {}),
    };
}
//# sourceMappingURL=vulcanCatalog.js.map