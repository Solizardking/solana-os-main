import { execFileSync } from "child_process";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/main/locale", () => ({
  getAppLocale: () => "en",
}));

import {
  buildRemoteClawdCmd,
  sshSetConfigValue,
  buildGatewayStartCommand,
  buildGatewayStopCommand,
  buildGatewayStatusCommand,
} from "../src/main/ssh-remote";
import type { SshConfig } from "../src/main/ssh-tunnel";

/** The `then` clause of the leading `if` — the systemd-managed branch. */
function systemdBranch(command: string): string {
  return command.slice(command.indexOf("then"), command.indexOf("else"));
}

const sshConfig: SshConfig = {
  host: "example.test",
  port: 22,
  username: "clawd",
  keyPath: "",
  remotePort: 8642,
  localPort: 18642,
};

function runWithClawdShim(command: string): Buffer {
  const home = mkdtempSync(join(tmpdir(), "clawd-ssh-cmd-home-"));
  const bin = join(home, "bin");
  mkdirSync(bin, { recursive: true });
  const clawd = join(bin, "clawd");
  writeFileSync(
    clawd,
    [
      "#!/usr/bin/env bash",
      'if [ "$1" = "doctor" ]; then',
      '  printf "doctor stderr preserved\\n" >&2',
      "  exit 0",
      "fi",
      'printf "%s\\0" "$@"',
      "",
    ].join("\n"),
  );
  chmodSync(clawd, 0o755);
  return execFileSync("bash", ["-lc", command], {
    env: {
      ...process.env,
      HOME: home,
      PATH: `${bin}:${process.env.PATH || ""}`,
    },
  });
}

function parseNulArgs(output: Buffer): string[] {
  const parts = output.toString("utf8").split("\0");
  if (parts.at(-1) === "") parts.pop();
  return parts;
}

describe("ssh remote config writes", () => {
  it.each([
    ["quote", 'bad"value'],
    ["backslash", "bad\\value"],
    ["newline", "bad\nvalue"],
    ["carriage return", "bad\rvalue"],
  ])(
    "rejects YAML-breaking %s values before remote writes",
    async (_name, value) => {
      await expect(
        sshSetConfigValue(sshConfig, "base_url", value),
      ).rejects.toThrow("Config value contains illegal characters");
    },
  );
});

describe("ssh Clawd command quoting", () => {
  it("shell-quotes the whole bash script without dropping per-argument quoting", () => {
    const command = buildRemoteClawdCmd([
      "kanban",
      "create",
      "My task title",
      "--triage",
      "--json",
    ]);

    expect(command).not.toContain(
      "bash -c '[ -x $HOME/clawd-agent/.venv/bin/clawd ] && exec $HOME/clawd-agent/.venv/bin/clawd 'kanban' 'create'",
    );
    expect(command).toContain(
      `bash -c '[ -x $HOME/clawd-agent/.venv/bin/clawd ] && exec $HOME/clawd-agent/.venv/bin/clawd '"'"'kanban'"'"'`,
    );
  });

  it.each([
    [
      "multi-word title",
      ["kanban", "create", "My task title", "--triage", "--json"],
    ],
    [
      "multiline markdown body",
      [
        "kanban",
        "create",
        "My task title",
        "--body",
        "first line\n- bullet one\n- bullet two",
        "--triage",
        "--json",
      ],
    ],
    [
      "single quote in user input",
      ["kanban", "create", "User's task", "--json"],
    ],
  ])("preserves %s", (_name, expectedArgs) => {
    const command = buildRemoteClawdCmd(expectedArgs);
    expect(parseNulArgs(runWithClawdShim(command))).toEqual(expectedArgs);
  });

  it("preserves existing extraShell redirects", () => {
    const output = runWithClawdShim(
      buildRemoteClawdCmd(["doctor"], " 2>&1"),
    ).toString("utf8");
    expect(output).toBe("doctor stderr preserved\n");
  });
});

describe("ssh gateway commands (issue #285)", () => {
  it("detects a systemd clawd.service unit before acting", () => {
    for (const cmd of [
      buildGatewayStartCommand(),
      buildGatewayStopCommand(),
      buildGatewayStatusCommand(),
    ]) {
      expect(cmd).toContain("systemctl list-unit-files clawd.service");
      expect(cmd.indexOf("if ")).toBeLessThan(cmd.indexOf("else"));
    }
  });

  it("start prefers systemd, falling back to nohup only without a unit", () => {
    const cmd = buildGatewayStartCommand();
    expect(cmd).toContain("systemctl start clawd.service");
    expect(cmd).toContain("sudo -n systemctl start clawd.service");
    // The nohup fallback must live in the else branch — never alongside
    // systemd, where it would strand the unit in a restart crash-loop.
    expect(cmd).toContain("nohup clawd gateway start");
    expect(systemdBranch(cmd)).not.toContain("nohup");
  });

  it("stop routes through systemd, else clawd gateway stop", () => {
    const cmd = buildGatewayStopCommand();
    expect(cmd).toContain("systemctl stop clawd.service");
    expect(cmd).toContain("clawd gateway stop");
    expect(systemdBranch(cmd)).not.toContain("clawd gateway stop");
    expect(systemdBranch(cmd)).not.toContain("kill");
  });

  it("status reports the systemd unit state when managed", () => {
    const cmd = buildGatewayStatusCommand();
    expect(cmd).toContain("systemctl is-active clawd.service");
    expect(cmd).toContain("gateway.pid");
    expect(systemdBranch(cmd)).not.toContain("gateway.pid");
  });
});

describe("buildRemoteClawdCmd venv probe (issue #284)", () => {
  const cmd = buildRemoteClawdCmd(["--version"]);

  it("probes both .venv and venv for every install base", () => {
    for (const base of [
      "$HOME/clawd-agent",
      "$HOME/.clawd/clawd-agent",
      "/optclawd/clawd-agent",
    ]) {
      expect(cmd).toContain(`${base}/.venv/bin/clawd`);
      expect(cmd).toContain(`${base}/venv/bin/clawd`);
    }
  });

  it("probes ~/.local/bin where pip --user installs a wrapper", () => {
    expect(cmd).toContain("$HOME/.local/bin/clawd");
  });

  it("does not probe the /usr/local/bin sudo-wrapper it deliberately bypasses", () => {
    expect(cmd).not.toContain("/usr/local/bin/clawd");
  });

  it("still falls back to bare clawd on PATH", () => {
    expect(cmd).toContain("command -v clawd");
  });
});
