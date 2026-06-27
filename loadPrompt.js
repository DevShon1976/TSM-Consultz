import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");

export function loadPrompt(name) {
  const p = path.join(root, "ai/prompts", `${name}.md`);
  if (!fs.existsSync(p)) throw new Error(`Prompt not found: ${name}.md`);
  return fs.readFileSync(p, "utf8");
}

export function loadWorkflow(name) {
  const p = path.join(root, "ai/workflows", `${name}.json`);
  if (!fs.existsSync(p)) throw new Error(`Workflow not found: ${name}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function parseQueryString(raw) {
  const result = { command: null, label: null, factor: null, logic: null, cleanText: raw.trim() };

  const logicMatch = raw.match(/--logic=(\S+)/);
  if (logicMatch) {
    result.logic     = logicMatch[1];
    result.cleanText = result.cleanText.replace(logicMatch[0], "").trim();
  }

  const cmdMatch = result.cleanText.match(/^(\w+)\s+/);
  if (cmdMatch) {
    result.command   = cmdMatch[1];
    result.cleanText = result.cleanText.slice(cmdMatch[0].length).trim();
  }

  const quotedMatch = result.cleanText.match(/^["'](.+?)["']/);
  if (quotedMatch) {
    const inner       = quotedMatch[1];
    result.label      = inner;
    const factorMatch = inner.match(/Factor:\s*(.+)$/i);
    if (factorMatch) result.factor = factorMatch[1].trim();
    result.cleanText  = inner;
  }

  return result;
}

export function buildPrompt({ query, app }) {
  const parsed      = parseQueryString(query);
  const resolvedApp = parsed.logic || app || "strategist";
  const structuredQuery = parsed.factor
    ? `Analyze the following audit factor for ${parsed.label}:\n\nFactor: ${parsed.factor}\n\nProvide a detailed JSON analysis with keys: summary, risk_level, recommendations, compliance_flags.`
    : parsed.cleanText;
  return { query: structuredQuery, app: resolvedApp, parsed };
}

export const PLAYBOOKS = {
  medical:      { label: "Medical",      icon: "🏥", app: "healthcare", demoPrompt: `auditops "General Hospital Group - Factor: Patient Billing Compliance" --logic=healthcare` },
  legal:        { label: "Legal",        icon: "⚖️",  app: "strategist", demoPrompt: `auditops "Mesa Premier Legal - Factor: Municipal Residency" --logic=strategist` },
  construction: { label: "Construction", icon: "🏗️",  app: "finops",     demoPrompt: `auditops "SunState Builders - Factor: Contract Change Order Risk" --logic=finops` },
  insurance:    { label: "Insurance",    icon: "🛡️",  app: "insurance",  demoPrompt: `auditops "Southwest Coverage Group - Factor: Claims Denial Rate" --logic=insurance` },
};