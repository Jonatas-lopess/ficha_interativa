import React from "react";

// Parses a single line and returns inline JSX nodes (bold, italic, plain text).
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last)
      nodes.push(<span key={`t-${last}`}>{text.slice(last, match.index)}</span>);

    if (match[2] !== undefined) {
      nodes.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={match.index}>{match[3]}</em>);
    }

    last = match.index + match[0].length;
  }

  if (last < text.length)
    nodes.push(<span key={`t-${last}`}>{text.slice(last)}</span>);

  return nodes;
}


interface Props {
  children: string;
  className?: string;
}

/**
 * Renders a markdown-like string into formatted JSX.
 * Supported: **bold**, *italic*, \n line breaks, and `- ` unordered lists.
 */
export function MarkdownText({ children, className }: Props) {
  const lines = children.split("\n");

  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = (key: number) => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`ul-${key}`} className="list-disc pl-4 space-y-0.5 mt-1">
        {listItems}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, i) => {
    const isBullet = /^[-•]\s+/.test(line);

    if (isBullet) {
      const content = line.replace(/^[-•]\s+/, "");
      listItems.push(<li key={i}>{parseInline(content)}</li>);
    } else {
      flushList(i);
      if (line.trim() === "") {
        // blank line → small vertical gap
        elements.push(<span key={i} className="block mt-1" />);
      } else {
        elements.push(<span key={i} className="block">{parseInline(line)}</span>);
      }
    }
  });

  // flush any trailing list
  flushList(lines.length);

  return <div className={className}>{elements}</div>;
}
