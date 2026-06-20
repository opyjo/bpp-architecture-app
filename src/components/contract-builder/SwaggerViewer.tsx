"use client";

import { useMemo } from "react";

interface SwaggerViewerProps {
  spec: object;
}

export default function SwaggerViewer({ spec }: SwaggerViewerProps) {
  const srcDoc = useMemo(() => {
    const specJson = JSON.stringify(spec);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    /* ── Base dark background ── */
    html, body {
      margin: 0; padding: 0;
      background: #252d3d !important;
      color: #e8eaf0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* ── Hide topbar ── */
    .swagger-ui .topbar { display: none !important; }

    /* ── Global wrapper backgrounds ── */
    .swagger-ui,
    .swagger-ui .wrapper,
    .swagger-ui .scheme-container,
    .swagger-ui .opblock-tag-section { background: #252d3d !important; }

    /* ── Text colors ── */
    .swagger-ui { color: #e8eaf0 !important; }
    .swagger-ui .info .title,
    .swagger-ui .info hgroup h2,
    .swagger-ui .opblock-tag,
    .swagger-ui .opblock .opblock-summary-path,
    .swagger-ui .opblock .opblock-summary-path span,
    .swagger-ui .opblock .opblock-summary-description,
    .swagger-ui .opblock .opblock-section-header h4,
    .swagger-ui .opblock .opblock-section-header label,
    .swagger-ui .responses-inner h4,
    .swagger-ui .responses-inner h5,
    .swagger-ui .response-col_status,
    .swagger-ui section.models h4,
    .swagger-ui .model-title,
    .swagger-ui .model,
    .swagger-ui .model span,
    .swagger-ui h4, .swagger-ui h5 { color: #e8eaf0 !important; }

    .swagger-ui .info .title small { background: #4a8fe8 !important; color: #fff !important; }

    .swagger-ui .info p, .swagger-ui .info li,
    .swagger-ui p, .swagger-ui label, .swagger-ui span,
    .swagger-ui .response-col_description__inner p,
    .swagger-ui table thead tr td, .swagger-ui table thead tr th,
    .swagger-ui .parameter__name, .swagger-ui .parameter__type,
    .swagger-ui .parameter__in, .swagger-ui .response-col_links,
    .swagger-ui .opblock-description-wrapper p,
    .swagger-ui .opblock-external-docs-wrapper p,
    .swagger-ui .markdown p, .swagger-ui .renderedMarkdown p,
    .swagger-ui .model .property,
    .swagger-ui .model .property.primitive { color: #9aa0b4 !important; }

    .swagger-ui .info a, .swagger-ui a { color: #4a8fe8 !important; }

    /* ── Opblock tag borders ── */
    .swagger-ui .opblock-tag { border-color: rgba(255,255,255,0.07) !important; }
    .swagger-ui .opblock-tag:hover { border-color: rgba(255,255,255,0.14) !important; }
    .swagger-ui .opblock-tag svg { fill: #9aa0b4 !important; }

    /* ── Method blocks ── */
    .swagger-ui .opblock.opblock-get { background: rgba(74,143,232,0.1) !important; border-color: rgba(74,143,232,0.3) !important; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #4a8fe8 !important; }
    .swagger-ui .opblock.opblock-get .opblock-summary { border-color: rgba(74,143,232,0.3) !important; }

    .swagger-ui .opblock.opblock-post { background: rgba(88,184,122,0.1) !important; border-color: rgba(88,184,122,0.3) !important; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3a9858 !important; }
    .swagger-ui .opblock.opblock-post .opblock-summary { border-color: rgba(88,184,122,0.3) !important; }

    .swagger-ui .opblock.opblock-put { background: rgba(232,168,58,0.1) !important; border-color: rgba(232,168,58,0.3) !important; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #c88a20 !important; }
    .swagger-ui .opblock.opblock-put .opblock-summary { border-color: rgba(232,168,58,0.3) !important; }

    .swagger-ui .opblock.opblock-delete { background: rgba(232,112,90,0.1) !important; border-color: rgba(232,112,90,0.3) !important; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #d06048 !important; }
    .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: rgba(232,112,90,0.3) !important; }

    .swagger-ui .opblock.opblock-patch { background: rgba(124,111,205,0.1) !important; border-color: rgba(124,111,205,0.3) !important; }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #6b5ebd !important; }
    .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: rgba(124,111,205,0.3) !important; }

    /* ── Expanded body & section headers ── */
    .swagger-ui .opblock .opblock-body,
    .swagger-ui .opblock .opblock-section-header {
      background: #2d3650 !important;
      border-color: rgba(255,255,255,0.1) !important;
    }

    /* ── Tables ── */
    .swagger-ui table tbody tr td { color: #9aa0b4 !important; border-color: rgba(255,255,255,0.07) !important; }
    .swagger-ui .parameters-col_description input,
    .swagger-ui .parameters-col_description textarea,
    .swagger-ui .parameters-col_description select {
      background: #354060 !important; color: #e8eaf0 !important; border-color: rgba(255,255,255,0.14) !important;
    }

    /* ── Models / Schemas section ── */
    .swagger-ui section.models { border-color: rgba(255,255,255,0.07) !important; background: #252d3d !important; }
    .swagger-ui section.models.is-open h4 { border-color: rgba(255,255,255,0.07) !important; }
    .swagger-ui .model-container { background: #2d3650 !important; border-color: rgba(255,255,255,0.1) !important; }
    .swagger-ui .model-box { background: #2d3650 !important; }
    .swagger-ui .prop-type { color: #3eb89a !important; }
    .swagger-ui .prop-format { color: #7c6fcd !important; }
    .swagger-ui .parameter__name.required::after { color: #e85a5a !important; }

    /* ── Inputs & buttons ── */
    .swagger-ui input[type="text"], .swagger-ui textarea, .swagger-ui select {
      background: #354060 !important; border-color: rgba(255,255,255,0.14) !important; color: #e8eaf0 !important;
    }
    .swagger-ui .btn { color: #e8eaf0 !important; border-color: rgba(255,255,255,0.14) !important; background: transparent !important; }
    .swagger-ui .try-out__btn { color: #4a8fe8 !important; border-color: #4a8fe8 !important; }
    .swagger-ui .btn.execute { background: #4a8fe8 !important; color: white !important; border-color: #4a8fe8 !important; }
    .swagger-ui .btn.cancel { border-color: #e85a5a !important; color: #e85a5a !important; }

    /* ── Code blocks & responses ── */
    .swagger-ui .highlight-code,
    .swagger-ui .example, .swagger-ui .microlight,
    .swagger-ui pre.example { background: #2d3650 !important; color: #e8eaf0 !important; }
    .swagger-ui .response .response-col_description .renderedMarkdown code { background: #2d3650 !important; color: #e8eaf0 !important; }
    .swagger-ui .responses-table .response-col_description { color: #9aa0b4 !important; }

    /* ── Copy button ── */
    .swagger-ui .copy-to-clipboard { bottom: auto; right: 10px; top: 10px; }
    .swagger-ui .copy-to-clipboard button { background: #354060 !important; border-color: rgba(255,255,255,0.14) !important; }

    /* ── Arrows & toggles ── */
    .swagger-ui svg.arrow { fill: #9aa0b4 !important; }
    .swagger-ui .model-toggle::after { background: none !important; }
    .swagger-ui .expand-operation svg { fill: #9aa0b4 !important; }

    /* ── Authorization ── */
    .swagger-ui .auth-wrapper, .swagger-ui .auth-container {
      background: #2d3650 !important; border-color: rgba(255,255,255,0.1) !important;
    }

    /* ── Response status codes ── */
    .swagger-ui .responses-table .response-col_status { color: #e8eaf0 !important; }
    .swagger-ui table.responses-table { border-color: rgba(255,255,255,0.07) !important; }
    .swagger-ui .responses-table thead td { color: #9aa0b4 !important; border-color: rgba(255,255,255,0.07) !important; }

    /* ── Scheme container (servers dropdown) ── */
    .swagger-ui .scheme-container { border-color: rgba(255,255,255,0.07) !important; box-shadow: none !important; }
    .swagger-ui .scheme-container select { background: #354060 !important; color: #e8eaf0 !important; }
    .swagger-ui .scheme-container label { color: #9aa0b4 !important; }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"><\/script>
  <script>
    SwaggerUIBundle({
      spec: ${specJson},
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout',
    });
  <\/script>
</body>
</html>`;
  }, [spec]);

  return (
    <iframe
      srcDoc={srcDoc}
      className="w-full border-0 min-h-[600px]"
      style={{ height: "calc(100vh - 160px)" }}
      sandbox="allow-scripts"
      title="Swagger UI"
    />
  );
}
