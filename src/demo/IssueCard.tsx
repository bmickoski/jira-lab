import type { Issue } from "./jiraStore";

export function IssueCard(props: { issue: Issue; onOpen: () => void }) {
  const { issue } = props;

  return (
    <button
      type="button"
      onClick={props.onOpen}
      className={[
        "w-full text-left rounded-xl border border-white/10 bg-black/30 p-3",
        "hover:bg-white/5 hover:border-white/15",
        "focus:outline-none focus:ring-2 focus:ring-white/20",
      ].join(" ")}
    >
      <div className="text-xs text-white/50">{issue.key}</div>
      <div className="mt-1 font-medium text-white leading-snug">
        {issue.title}
      </div>

      {/* Optional: later add badges (comments, watchers count etc) */}
      {/* <div className="mt-2 text-xs text-white/50">👀 {issue.watcherIds.length}</div> */}
    </button>
  );
}
