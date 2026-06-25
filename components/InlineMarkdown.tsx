import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Inline Markdown renderer for short text (card blurbs, list items). Renders
// emphasis, links, code and strikethrough WITHOUT block wrappers, so it can sit
// inside an existing <p>/<span> without breaking compact layouts. Block-level
// Markdown (headings, lists, quotes) is unwrapped to its text content. Colours
// are intentionally not set on strong/em so they inherit the surrounding text.
const components: Components = {
  p: ({ children }) => <>{children}</>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-700 font-semibold underline decoration-green-300 underline-offset-2 hover:decoration-green-600 transition-colors">{children}</a>
  ),
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
  code: ({ children }) => (
    <code className="bg-black/5 text-[0.95em] font-mono px-1 py-0.5 rounded">{children}</code>
  ),
};

export default function InlineMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      disallowedElements={["h1", "h2", "h3", "h4", "h5", "h6", "hr", "img", "ul", "ol", "li", "blockquote", "pre", "table"]}
      unwrapDisallowed
    >
      {content}
    </ReactMarkdown>
  );
}
