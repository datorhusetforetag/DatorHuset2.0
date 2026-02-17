import { useMemo } from "react";

type JsonLdPayload = Record<string, unknown> | Array<Record<string, unknown>>;

export function SeoJsonLd({ data }: { data: JsonLdPayload }) {
  const serialized = useMemo(() => JSON.stringify(data), [data]);

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialized }} />;
}
