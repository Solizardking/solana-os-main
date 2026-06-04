/**
 * SolanaOS — Claude Code Integration Layer
 *
 * Central export index for all patterns adapted from the leaked Claude Code source.
 *
 * Adapted subsystems:
 *  - Tool Engine     (tool-base, permission-engine, tool-executor)
 *  - Query Engine    (multi-model streaming LLM with tool loops)
 *  - Coordinator     (multi-agent fleet orchestration)
 *  - Task Manager    (OODA, scanner, dream, skill task types)
 *  - Skill Registry  (SKILL.md loader + NanoHub remote sync)
 *  - SSE Transport   (gateway ↔ client bridge)
 *  - Memory          (KNOWN/LEARNED/INFERRED extraction)
 */

// ── Tool Engine ─────────────────────────────────────────────────────────────
export type {
  SolanaOSTool,
  ToolContext,
  ToolResult,
  ToolResultStatus,
  PermissionLevel,
  PermissionAction,
  PermissionRule,
} from "./engine/tool-base.js";
export {
  ToolRegistry,
  getToolRegistry,
  setToolRegistry,
  createTool,
  ok,
  err,
  permissionDenied,
  validateInput,
} from "./engine/tool-base.js";

export {
  PermissionEngine,
  SAFE_DEFAULTS,
  TRUSTED_DEV_RULES,
  YOLO_RULES,
  resolvePermission,
  matchPattern,
  buildInvocationString,
  checkTradeThreshold,
} from "./engine/permission-engine.js";
export type {
  PermissionResolutionContext,
  TradeThresholds,
} from "./engine/permission-engine.js";

export { ToolExecutor } from "./engine/tool-executor.js";
export type {
  LLMToolCall,
  ToolCallResult,
  ToolExecutorConfig,
} from "./engine/tool-executor.js";

// ── Query Engine ─────────────────────────────────────────────────────────────
export { QueryEngine } from "./engine/query-engine.js";
export type {
  ChatMessage,
  ContentBlock,
  LLMProvider,
  ProviderConfig,
  QueryEngineConfig,
  QueryResult,
  RunQueryOptions,
  TurnUsage,
  SessionUsage,
} from "./engine/query-engine.js";

// ── Coordinator ──────────────────────────────────────────────────────────────
export {
  Coordinator,
  fanOutResearch,
  getSolanaOSCoordinatorPrompt,
  buildTaskNotification,
  parseTaskNotification,
  WORKER_TOOL_ALLOWLISTS,
} from "./coordinator/coordinator.js";
export type {
  Worker,
  WorkerSpawnConfig,
  WorkerType,
  WorkerStatus,
  TaskNotification,
  OODAPhase,
} from "./coordinator/coordinator.js";

// ── Task Manager ─────────────────────────────────────────────────────────────
export { TaskManager, getTaskToolDescriptions } from "./tasks/task-manager.js";
export type {
  Task,
  TaskType,
  TaskStatus,
  TaskHandler,
  OodaTaskInput,
  ScannerTaskInput,
  DreamTaskInput,
  SkillTaskInput,
  ShellTaskInput,
} from "./tasks/task-manager.js";

// ── Skill Registry ───────────────────────────────────────────────────────────
export {
  SkillRegistry,
  bootstrapSkillRegistry,
  loadSkillsDir,
  loadSkillFromFile,
  buildSkillFromNanoHub,
} from "./skills/skill-registry.js";
export type {
  Skill,
  SkillMeta,
  NanoHubSkillEntry,
} from "./skills/skill-registry.js";

// ── Gateway SSE Transport ────────────────────────────────────────────────────
export {
  GatewaySSETransport,
  SSEClient,
  BoundedUUIDSet,
  scheduleTokenRefresh,
} from "./gateway/sse-transport.js";
export type {
  SSEConnection,
  SSEClientOptions,
  InboundMessage,
  OutboundMessage,
  InboundMessageType,
  OutboundMessageType,
  ControlRequest,
  ControlRequestType,
  TransportState,
  DeviceToken,
} from "./gateway/sse-transport.js";

// ── Memory ───────────────────────────────────────────────────────────────────
export {
  extractFromTurn,
  formatMemoryContext,
  MemoryRouter,
} from "./memory/extract-memories.js";
export type {
  ExtractedMemory,
  MemoryTier,
  ConversationTurn,
  MemoryRouterConfig,
  MemoryScope,
} from "./memory/extract-memories.js";

// ── Gateway integration ───────────────────────────────────────────────────────
export {
  GatewayEventRouter,
  validateDeviceAuth,
  parseClientInfo,
  ConnectErrorDetailCodes,
  readConnectErrorDetailCode,
  readConnectErrorRecoveryAdvice,
  isGatewayEventName,
} from "./gateway/gateway-integration.js";
export type {
  GatewaySession,
  GatewayEventPayload,
  DeviceAuthPayload,
  ClientInfo,
  GatewayEventName,
} from "./gateway/gateway-integration.js";

// ── CLI layer ─────────────────────────────────────────────────────────────────
export {
  DEFAULT_AUTO_MODE_RULES,
  resolveAutoMode,
  ndjsonStringify,
  StructuredIO,
  CLIOutput,
  CLITransport,
  registerCleanup,
  gracefulExit,
} from "./cli/cli.js";
export type {
  AutoModeRules,
  StdinMessage,
  StdoutMessage,
  CLITransportOptions,
  CLIConnectionState,
} from "./cli/cli.js";

// ── Message types ─────────────────────────────────────────────────────────────
export {
  makeAssistantMessage,
  makeUserMessage,
  makeToolUseMessage,
  makeToolResultMessage,
  makeSystemMessage,
  makeAgentNotification,
  renderMessageAsText,
} from "./shared/message-types.js";
export type {
  SolanaOSMessage,
  SolanaOSMessageType,
  AssistantMessage,
  ToolUseMessage,
  ToolResultMessage,
  GroupedToolUseMessage,
  UserMessage,
  BashOutputMessage,
  AttachmentMessage,
  ChannelMessage,
  MemoryInputMessage,
  PlanApprovalMessage,
  SystemMessage,
  RateLimitMessage,
  ShutdownMessage,
  APIErrorMessage,
  AgentNotificationMessage,
  TaskAssignmentMessage,
  AdvisorMessage,
  HookProgressMessage,
} from "./shared/message-types.js";

// ── Re-export existing SolanaOS shared types (unchanged) ─────────────────────
export type { ModelCatalogEntry } from "./agents/model-catalog.js";
export { DEFAULT_MODEL_CATALOG, findModelCatalogEntry } from "./agents/model-catalog.js";

export type { ToolPolicy, ToolPolicies, ToolPolicyProfile } from "./agents/tool-policy-shared.js";
export {
  DEFAULT_TOOL_GROUPS,
  expandToolGroups,
  resolveToolProfilePolicy,
  normalizeToolName,
} from "./agents/tool-policy-shared.js";
