import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Styled Markdown renderer for gist article bodies. Keeps the same typography
// as the original plain-paragraph layout while adding headings, lists, links,
// emphasis, quotes and code. Raw HTML is intentionally NOT enabled, so admin
// content stays safe from injection.
const components: Components = {
  p: ({ children }) => (
    <p className="text-[17px] text-[#1a2e1d] leading-[1.8] mb-5 last:mb-0">{children}</p>
  ),
  h1: ({ children }) => (
    <h2 className="text-[26px] text-[#0d1a0f] tracking-[-0.5px] leading-tight mt-8 mb-4 first:mt-0" style={{ fontFamily: "'Lora', Georgia, serif" }}>{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="text-[24px] text-[#0d1a0f] tracking-[-0.5px] leading-tight mt-8 mb-4 first:mt-0" style={{ fontFamily: "'Lora', Georgia, serif" }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[20px] font-bold text-[#0d1a0f] leading-tight mt-6 mb-3 first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-5 space-y-2 text-[17px] text-[#1a2e1d] leading-[1.7] marker:text-green-600">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-5 space-y-2 text-[17px] text-[#1a2e1d] leading-[1.7] marker:text-green-600 marker:font-bold">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-700 font-semibold underline decoration-green-300 underline-offset-2 hover:decoration-green-600 transition-colors">{children}</a>
  ),
  strong: ({ children }) => <strong className="font-bold text-[#0d1a0f]">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-green-300 pl-4 my-5 text-[#3a4e3d] italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-8 border-gray-200" />,
  code: ({ children }) => (
    <code className="bg-gray-100 text-[#0d1a0f] text-[15px] font-mono px-1.5 py-0.5 rounded">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="bg-[#0d1a0f] text-green-50 text-[14px] font-mono p-4 rounded-xl overflow-x-auto mb-5">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-5">
      <table className="w-full text-[15px] border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-bold text-[#0d1a0f]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-3 py-2 text-[#1a2e1d]">{children}</td>
  ),
};

export default function GistMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
