import React from "react";

export function Section(props: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-lg font-semibold text-white">{props.title}</h2>
        {props.note && <span className="text-xs text-white/60">{props.note}</span>}
      </div>
      {props.children}
    </section>
  );
}
