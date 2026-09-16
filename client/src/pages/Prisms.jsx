import { useEffect, useState } from "react";
import { apiFetch, apiJson } from "../lib/api";
import PrismLoader from "../components/PrismLoader";
import PrismFolder from "../components/PrismFolder";

export default function Prisms({ session }) {
  const [bundles, setBundles] = useState(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiFetch("/api/bundles", { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error("Unable to load Prisms");
        return response.json();
      }),
      session ? apiJson("/api/bundles/recommended", [], { signal: controller.signal }) : Promise.resolve([]),
    ]).then(([data, recommended]) => {
      if (controller.signal.aborted) return;
      const all = Array.isArray(data) ? data : [];
      const top = new Set((recommended || []).map(bundle => bundle.id));
      setBundles([...all.filter(bundle => top.has(bundle.id)), ...all.filter(bundle => !top.has(bundle.id))]);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [retry, session]);
  if (failed) return <main className="page page-wide"><p>We couldn’t load the collection.</p><button onClick={() => {setFailed(false);setRetry(value => value + 1);}}>Try again</button></main>;
  if (!bundles) return <PrismLoader/>;
  return <PrismFolder bundles={bundles}/>;
}
