import ReactMarkdown from 'react-markdown';

/** Renders model output as markdown. Raw HTML is never rendered; links open safely. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-bold">
      <ReactMarkdown
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
