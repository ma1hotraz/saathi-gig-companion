import type { ReactNode } from 'react';

/**
 * Small, safe renderer for the markdown subset the model uses: paragraphs, headings, bullet and
 * numbered lists, **bold**, *italic* and http(s) links. It builds React elements only (never HTML),
 * so model output cannot inject markup or scripts, and it replaces a 145 kB markdown library.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyBase}-${i++}`;
    if (match[1] !== undefined) nodes.push(<strong key={key}>{match[1]}</strong>);
    else if (match[2] !== undefined) nodes.push(<em key={key}>{match[2]}</em>);
    else if (match[3] !== undefined && match[4] !== undefined) {
      nodes.push(
        <a key={key} href={match[4]} target="_blank" rel="noopener noreferrer">
          {match[3]}
        </a>,
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block = { kind: 'p'; text: string } | { kind: 'h'; text: string } | { kind: 'ul' | 'ol'; items: string[] };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'p', text: paragraph.join(' ') });
    paragraph = [];
  };
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];
    if (!line) flush();
    else if (heading?.[1] !== undefined) {
      flush();
      blocks.push({ kind: 'h', text: heading[1] });
    } else if (bullet?.[1] !== undefined || numbered?.[1] !== undefined) {
      flush();
      const kind = bullet ? 'ul' : 'ol';
      const item = (bullet?.[1] ?? numbered?.[1]) as string;
      if (last && (last.kind === 'ul' || last.kind === 'ol') && last.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else paragraph.push(line);
  }
  flush();
  return blocks;
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
      {parse(children).map((b, i) => {
        const key = `b${i}`;
        if (b.kind === 'h') return <h3 key={key}>{inline(b.text, key)}</h3>;
        if (b.kind === 'p') return <p key={key}>{inline(b.text, key)}</p>;
        const List = b.kind === 'ul' ? 'ul' : 'ol';
        return (
          <List key={key}>
            {b.items.map((item, j) => (
              <li key={`${key}-${j}`}>{inline(item, `${key}-${j}`)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
