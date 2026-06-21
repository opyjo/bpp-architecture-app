import { allServiceDeepDives, getServiceById } from "@/data/service-deep-dives";
import type { ServiceDeepDive } from "@/data/service-deep-dives";

export type ChangeType =
  | "api_change"
  | "schema_change"
  | "kafka_event_change"
  | "new_dependency"
  | "endpoint_removal";

export const changeTypeLabels: Record<ChangeType, string> = {
  api_change: "API Change",
  schema_change: "Schema Change",
  kafka_event_change: "Kafka Event Change",
  new_dependency: "New Dependency",
  endpoint_removal: "Endpoint Removal",
};

export interface ImpactNode {
  service: ServiceDeepDive;
  depth: number; // 0 = selected, 1 = direct, 2 = transitive
  relationship: string;
}

/**
 * Get direct + transitive (2-hop) dependency nodes for a given service.
 */
export function getServiceDependencies(serviceId: string): ImpactNode[] {
  const source = getServiceById(serviceId);
  if (!source) return [];

  const visited = new Set<string>([serviceId]);
  const nodes: ImpactNode[] = [];

  // Direct dependencies (depth 1)
  const directIds: string[] = [];
  for (const dep of source.technical.dependencies) {
    const match = allServiceDeepDives.find(
      (s) =>
        s.name === dep.service ||
        s.displayName === dep.service ||
        s.id === dep.service
    );
    if (match && !visited.has(match.id)) {
      visited.add(match.id);
      directIds.push(match.id);
      nodes.push({
        service: match,
        depth: 1,
        relationship: `${dep.direction} via ${dep.protocol}: ${dep.description}`,
      });
    }
  }

  // Also check reverse: services that depend ON this service
  for (const s of allServiceDeepDives) {
    if (visited.has(s.id)) continue;
    const reverseMatch = s.technical.dependencies.find(
      (d) =>
        d.service === source.name ||
        d.service === source.displayName ||
        d.service === source.id
    );
    if (reverseMatch) {
      visited.add(s.id);
      directIds.push(s.id);
      nodes.push({
        service: s,
        depth: 1,
        relationship: `depends on ${source.displayName} via ${reverseMatch.protocol}`,
      });
    }
  }

  // Transitive dependencies (depth 2)
  for (const directId of directIds) {
    const direct = getServiceById(directId);
    if (!direct) continue;
    for (const dep of direct.technical.dependencies) {
      const match = allServiceDeepDives.find(
        (s) =>
          s.name === dep.service ||
          s.displayName === dep.service ||
          s.id === dep.service
      );
      if (match && !visited.has(match.id)) {
        visited.add(match.id);
        nodes.push({
          service: match,
          depth: 2,
          relationship: `transitive via ${direct.displayName} → ${dep.protocol}`,
        });
      }
    }
  }

  return nodes;
}

/**
 * Generate a color-coded Mermaid flowchart for impact analysis.
 * Blue = selected service, Red = direct impact, Amber = transitive impact.
 */
export function generateImpactMermaid(
  serviceId: string,
  changeType: ChangeType
): string {
  const source = getServiceById(serviceId);
  if (!source) return "graph TD\n  A[Service not found]";

  const nodes = getServiceDependencies(serviceId);
  const lines: string[] = ["graph TD"];

  // Add style classes
  lines.push("  classDef selected fill:#4a8fe8,stroke:#4a8fe8,color:#fff");
  lines.push("  classDef direct fill:#e85a5a,stroke:#e85a5a,color:#fff");
  lines.push("  classDef transitive fill:#e8a83a,stroke:#e8a83a,color:#fff");

  // Sanitize node id
  const nodeId = (s: ServiceDeepDive) =>
    s.id.replace(/[^a-zA-Z0-9]/g, "_");

  // Source node
  const srcId = nodeId(source);
  lines.push(
    `  ${srcId}["${source.displayName}\\n(${changeTypeLabels[changeType]})"]`
  );
  lines.push(`  class ${srcId} selected`);

  // Impact nodes
  for (const node of nodes) {
    const nId = nodeId(node.service);
    const label = node.service.displayName;
    lines.push(`  ${nId}["${label}"]`);
    lines.push(
      `  class ${nId} ${node.depth === 1 ? "direct" : "transitive"}`
    );

    if (node.depth === 1) {
      lines.push(`  ${srcId} --> ${nId}`);
    }
  }

  // Transitive edges: connect depth-2 nodes to their depth-1 parent
  for (const node of nodes) {
    if (node.depth !== 2) continue;
    const nId = nodeId(node.service);
    // Find which direct dep connects to this transitive dep
    for (const directNode of nodes.filter((n) => n.depth === 1)) {
      const directDeps = directNode.service.technical.dependencies;
      const connects = directDeps.some(
        (d) =>
          d.service === node.service.name ||
          d.service === node.service.displayName ||
          d.service === node.service.id
      );
      if (connects) {
        lines.push(`  ${nodeId(directNode.service)} -.-> ${nId}`);
        break;
      }
    }
  }

  return lines.join("\n");
}

/**
 * Build AI system context with relevant service data for impact analysis.
 */
export function buildImpactAnalysisContext(
  serviceId: string,
  changeType: ChangeType,
  description?: string
): string {
  const source = getServiceById(serviceId);
  if (!source) return "";

  const nodes = getServiceDependencies(serviceId);

  const parts: string[] = [
    `You are a senior platform architect analyzing the impact of a change.`,
    ``,
    `## Change Details`,
    `- **Service**: ${source.displayName} (${source.name})`,
    `- **Change Type**: ${changeTypeLabels[changeType]}`,
    description ? `- **Description**: ${description}` : "",
    ``,
    `## Source Service`,
    `- Purpose: ${source.business.purpose}`,
    `- Domain: ${source.business.domainContext}`,
    `- SLA: ${source.business.sla.availability} availability, ${source.business.sla.latencyP99} p99`,
    ``,
    `### Endpoints`,
    ...source.technical.endpoints.map(
      (e) => `- ${e.method} ${e.path}: ${e.description}`
    ),
    ``,
    `### Dependencies`,
    ...source.technical.dependencies.map(
      (d) => `- ${d.direction} → ${d.service} (${d.protocol}): ${d.description}`
    ),
    ``,
    `### Kafka Events`,
    ...source.technical.kafkaEvents.map(
      (e) => `- ${e.direction} ${e.topic}.${e.event}: ${e.description}`
    ),
    ``,
    `### Error Patterns`,
    ...source.technical.errorPatterns.map(
      (e) => `- ${e.scenario}: ${e.handling}`
    ),
    ``,
    `## Impacted Services (${nodes.length} total)`,
  ];

  for (const node of nodes) {
    parts.push(
      ``,
      `### ${node.service.displayName} (${node.depth === 1 ? "DIRECT" : "TRANSITIVE"})`,
      `- Relationship: ${node.relationship}`,
      `- Purpose: ${node.service.business.purpose}`,
      `- Endpoints: ${node.service.technical.endpoints.length}`,
      `- Kafka events: ${node.service.technical.kafkaEvents.length}`
    );
  }

  parts.push(
    ``,
    `## Instructions`,
    `Analyze this change and provide:`,
    `1. **Risk Level** (Critical/High/Medium/Low) with justification`,
    `2. **Affected Components** — which services, endpoints, and data flows are impacted`,
    `3. **Required Testing** — specific tests that should be run or written`,
    `4. **Teams to Notify** — based on service ownership and stakeholders`,
    `5. **Rollback Plan** — steps to revert if the change causes issues`,
    `6. **Migration Steps** — if the change requires coordinated deployment`,
    ``,
    `Be specific to this platform's architecture. Reference actual service names, endpoints, and Kafka topics.`
  );

  return parts.filter(Boolean).join("\n");
}
