"use client";

import { allEdges, allNodes, steps } from "@/data/architecture";

interface ArchitectureSvgProps {
  activeStep: string;
  onNodeClick: (nodeKey: string) => void;
}

export default function ArchitectureSvg({ activeStep, onNodeClick }: ArchitectureSvgProps) {
  const step = steps[activeStep];
  const isAll = activeStep === "all";

  function edgeStyle(id: string) {
    const active = isAll || step.edges.includes(id);
    const isDashed = id.startsWith("e-res") || id === "e-as-clone";
    return {
      opacity: active ? 1 : 0.06,
      stroke: active ? "var(--arch-blue)" : "var(--arch-bg3)",
      strokeWidth: active && !isAll ? 2 : isDashed ? 1 : 1.5,
      markerEnd: active ? "url(#aa)" : "url(#ad)",
      className: active && !isAll ? "fe-anim" : undefined,
    };
  }

  function nodeOpacity(id: string) {
    return isAll || step.nodes.includes(id) ? 1 : 0.1;
  }

  return (
    <svg
      viewBox="0 0 820 710"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[820px] h-auto"
      style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}
    >
      <defs>
        <marker id="ad" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--arch-text3)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id="aa" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--arch-blue)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {/* Browser box */}
      <rect x={20} y={10} width={780} height={80} rx={10} fill="none" stroke="var(--arch-bg3)" strokeWidth={1} strokeDasharray="4 3" />
      <text x={34} y={26} fontSize={10} fill="var(--arch-text3)" fontWeight={500} letterSpacing="0.09em">CUSTOMER BROWSER / HOST SHELL APP</text>

      {/* UI Node */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-ui") }} onClick={() => onNodeClick("ui")}>
        <rect x={220} y={28} width={380} height={52} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-purple)" strokeWidth={1} />
        <rect x={220} y={28} width={380} height={52} rx={8} fill="rgba(124,111,205,0.08)" />
        <text x={410} y={50} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--arch-purple)">Subscription Manager UI</text>
        <text x={410} y={67} textAnchor="middle" fontSize={8.5} fill="var(--arch-purple)">Next.js 14 · React 18 · Module Federation · /customer/* /agent</text>
      </g>

      {/* BFF Node */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-bff") }} onClick={() => onNodeClick("bff")}>
        <rect x={220} y={134} width={380} height={52} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-teal)" strokeWidth={1} />
        <rect x={220} y={134} width={380} height={52} rx={8} fill="rgba(62,184,154,0.07)" />
        <text x={410} y={156} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--arch-teal)">Next.js BFF — /api/protected/*</text>
        <text x={410} y={172} textAnchor="middle" fontSize={8.5} fill="var(--arch-teal)">Validates session · obtains OAuth2 token · proxies calls</text>
      </g>

      {/* Auth Node */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-auth") }} onClick={() => onNodeClick("auth")}>
        <rect x={634} y={134} width={160} height={52} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-coral)" strokeWidth={1} />
        <rect x={634} y={134} width={160} height={52} rx={8} fill="rgba(232,112,90,0.07)" />
        <text x={714} y={156} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--arch-coral)">auth-api</text>
        <text x={714} y={172} textAnchor="middle" fontSize={8.5} fill="var(--arch-coral)">OAuth2 / Cognito / Auth0</text>
      </g>

      {/* AppSync Node */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-appsync") }} onClick={() => onNodeClick("appsync")}>
        <rect x={40} y={236} width={310} height={52} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-blue)" strokeWidth={1} />
        <rect x={40} y={236} width={310} height={52} rx={8} fill="rgba(74,143,232,0.07)" />
        <text x={195} y={258} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--arch-blue)">AWS AppSync</text>
        <text x={195} y={274} textAnchor="middle" fontSize={8.5} fill="var(--arch-blue)">GraphQL gateway · all mutations</text>
      </g>

      {/* Aggregator Node */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-agg") }} onClick={() => onNodeClick("agg")}>
        <rect x={470} y={236} width={330} height={52} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-blue)" strokeWidth={1} />
        <rect x={470} y={236} width={330} height={52} rx={8} fill="rgba(74,143,232,0.07)" />
        <text x={635} y={258} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--arch-blue)">subscriptions-aggregator-api</text>
        <text x={635} y={274} textAnchor="middle" fontSize={8.5} fill="var(--arch-blue)">{"REST read-only · active & past subs"}</text>
      </g>

      {/* Go microservices box */}
      <rect x={20} y={334} width={780} height={336} rx={12} fill="none" stroke="var(--arch-bg3)" strokeWidth={1} strokeDasharray="4 3" />
      <text x={34} y={350} fontSize={10} fill="var(--arch-text3)" fontWeight={500} letterSpacing="0.09em">GO MICROSERVICES — go-repo-new</text>

      {/* reseller-service */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-reseller") }} onClick={() => onNodeClick("reseller")}>
        <rect x={38} y={358} width={220} height={60} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-amber)" strokeWidth={1} />
        <rect x={38} y={358} width={220} height={60} rx={8} fill="rgba(232,168,58,0.07)" />
        <text x={148} y={380} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--arch-amber)">reseller-service</text>
        <text x={148} y={396} textAnchor="middle" fontSize={10.5} fill="var(--arch-amber)">Subscription CRUD · PostgreSQL</text>
        <text x={148} y={410} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">Gin + OpenAPI · Kafka publisher</text>
      </g>

      {/* catalog-api */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-catalog") }} onClick={() => onNodeClick("catalog")}>
        <rect x={300} y={358} width={220} height={60} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-amber)" strokeWidth={1} />
        <rect x={300} y={358} width={220} height={60} rx={8} fill="rgba(232,168,58,0.07)" />
        <text x={410} y={380} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--arch-amber)">catalog-api</text>
        <text x={410} y={396} textAnchor="middle" fontSize={10.5} fill="var(--arch-amber)">{"Offers & plans · Redis cache"}</text>
        <text x={410} y={410} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">GraphQL (gqlgen)</text>
      </g>

      {/* session-api */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-session") }} onClick={() => onNodeClick("session")}>
        <rect x={562} y={358} width={220} height={60} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-amber)" strokeWidth={1} />
        <rect x={562} y={358} width={220} height={60} rx={8} fill="rgba(232,168,58,0.07)" />
        <text x={672} y={380} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--arch-amber)">session-api</text>
        <text x={672} y={396} textAnchor="middle" fontSize={10.5} fill="var(--arch-amber)">Session lifecycle · DynamoDB</text>
        <text x={672} y={410} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">generateSession · cloneSession</text>
      </g>

      {/* household-api */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-household") }} onClick={() => onNodeClick("household")}>
        <rect x={38} y={460} width={220} height={60} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-green)" strokeWidth={1} />
        <rect x={38} y={460} width={220} height={60} rx={8} fill="rgba(88,184,122,0.07)" />
        <text x={148} y={482} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--arch-green)">household-api</text>
        <text x={148} y={498} textAnchor="middle" fontSize={10.5} fill="var(--arch-green)">{"Account & equipment · CPM"}</text>
        <text x={148} y={512} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">GraphQL (gqlgen)</text>
      </g>

      {/* token-api */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-token") }} onClick={() => onNodeClick("token")}>
        <rect x={300} y={460} width={220} height={60} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-green)" strokeWidth={1} />
        <rect x={300} y={460} width={220} height={60} rx={8} fill="rgba(88,184,122,0.07)" />
        <text x={410} y={482} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--arch-green)">token-api</text>
        <text x={410} y={498} textAnchor="middle" fontSize={10.5} fill="var(--arch-green)">Payload tokenization · Redis</text>
        <text x={410} y={512} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">24h TTL · mid-flow state</text>
      </g>

      {/* audit-api */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-audit") }} onClick={() => onNodeClick("audit")}>
        <rect x={562} y={460} width={220} height={60} rx={8} fill="var(--arch-bg3)" stroke="var(--arch-green)" strokeWidth={1} />
        <rect x={562} y={460} width={220} height={60} rx={8} fill="rgba(88,184,122,0.07)" />
        <text x={672} y={482} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--arch-green)">audit-api</text>
        <text x={672} y={498} textAnchor="middle" fontSize={10.5} fill="var(--arch-green)">Event logging · PostgreSQL</text>
        <text x={672} y={512} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">Orders · activations · recovery</text>
      </g>

      {/* Merchant APIs box */}
      <rect x={38} y={556} width={764} height={96} rx={8} fill="none" stroke="var(--arch-border2)" strokeWidth={0.5} strokeDasharray="3 3" />
      <text x={50} y={570} fontSize={10} fill="var(--arch-text3)" fontWeight={500} letterSpacing="0.06em">MERCHANT APIs — transparent to UI · invoked by reseller-service only</text>

      {/* Merchant nodes */}
      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-bango") }} onClick={() => onNodeClick("bango")}>
        <rect x={48} y={578} width={130} height={62} rx={6} fill="var(--arch-bg3)" stroke="var(--arch-gray)" strokeWidth={0.5} />
        <text x={113} y={601} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="var(--arch-gray)">merchant-api</text>
        <text x={113} y={615} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--arch-gray)">bango-v1</text>
        <text x={113} y={629} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">platform aggregator</text>
      </g>

      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-netflix") }} onClick={() => onNodeClick("netflix")}>
        <rect x={196} y={578} width={130} height={62} rx={6} fill="var(--arch-bg3)" stroke="var(--arch-gray)" strokeWidth={0.5} />
        <text x={261} y={601} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="var(--arch-gray)">merchant-api</text>
        <text x={261} y={615} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--arch-gray)">netflix</text>
        <text x={261} y={629} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">streaming</text>
      </g>

      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-disney") }} onClick={() => onNodeClick("disney")}>
        <rect x={344} y={578} width={130} height={62} rx={6} fill="var(--arch-bg3)" stroke="var(--arch-gray)" strokeWidth={0.5} />
        <text x={409} y={601} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="var(--arch-gray)">merchant-api</text>
        <text x={409} y={615} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--arch-gray)">disney</text>
        <text x={409} y={629} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">streaming</text>
      </g>

      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-bellmedia") }} onClick={() => onNodeClick("bellmedia")}>
        <rect x={492} y={578} width={146} height={62} rx={6} fill="var(--arch-bg3)" stroke="var(--arch-gray)" strokeWidth={0.5} />
        <text x={565} y={601} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="var(--arch-gray)">merchant-api</text>
        <text x={565} y={615} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--arch-gray)">bellmedia</text>
        <text x={565} y={629} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">content</text>
      </g>

      <g style={{ cursor: "pointer", opacity: nodeOpacity("n-radiocan") }} onClick={() => onNodeClick("radiocan")}>
        <rect x={656} y={578} width={138} height={62} rx={6} fill="var(--arch-bg3)" stroke="var(--arch-gray)" strokeWidth={0.5} />
        <text x={725} y={601} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="var(--arch-gray)">merchant-api</text>
        <text x={725} y={615} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--arch-gray)">radiocanada</text>
        <text x={725} y={629} textAnchor="middle" fontSize={10} fill="var(--arch-text3)">content</text>
      </g>

      {/* Edges */}
      {(() => {
        const e1 = edgeStyle("e-ui-bff");
        return <line x1={410} y1={80} x2={410} y2={132} stroke={e1.stroke} strokeWidth={e1.strokeWidth} markerEnd={e1.markerEnd} opacity={e1.opacity} className={e1.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-bff-appsync");
        return <path d="M310 160 L195 234" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-bff-agg");
        return <path d="M510 160 L635 234" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-bff-auth");
        return <line x1={602} y1={160} x2={632} y2={160} stroke={e.stroke} strokeWidth={e.strokeWidth} markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-as-reseller");
        return <path d="M130 288 L148 356" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-as-catalog");
        return <path d="M220 288 L390 356" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-as-session");
        return <path d="M280 288 L640 356" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-as-household");
        return <path d="M80 288 L110 458" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-agg-read");
        return <path d="M635 288 L672 356" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-res-merchant");
        return <line x1={148} y1={418} x2={148} y2={574} stroke={e.stroke} strokeWidth={e.strokeWidth} strokeDasharray="3 2" markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-res-audit");
        return <path d="M258 406 L600 458" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} strokeDasharray="3 2" markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-res-catalog");
        return <path d="M258 380 L300 380" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} strokeDasharray="3 2" markerEnd={e.markerEnd} opacity={e.opacity} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
      {(() => {
        const e = edgeStyle("e-as-clone");
        return <path d="M170 288 L610 356" fill="none" stroke={e.stroke} strokeWidth={e.strokeWidth} strokeDasharray="3 2" markerEnd={e.markerEnd} opacity={activeStep === "agent" ? e.opacity : 0} className={e.className} style={{ transition: "opacity .2s, stroke .2s" }} />;
      })()}
    </svg>
  );
}
