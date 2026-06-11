import React from 'react';

interface CitationTextProps {
  text: string;
}

export const CitationText: React.FC<CitationTextProps> = ({ text }) => {
  if (!text) return null;

  const regex = /\[Ишлэл:\s*([^\]]+)\]/g;

  const parts = text.split(regex);

  if (parts.length === 1) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const fileWithPage = part;

          const [fileName, pageQuery] = fileWithPage.split('#');
          const pageNumber = pageQuery ? pageQuery.replace('page=', '') : '';

          const fileUrl = `http://localhost:4000/uploads/${fileWithPage}`;

          return (
            <a
              key={index}
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 underline font-medium mx-1 cursor-pointer transition-colors"
              title={`${fileName} - Хуудас ${pageNumber}`}
            >
              📄 {fileName.replace('.pdf', '')} (Хуудас {pageNumber})
            </a>
          );
        }

        return part;
      })}
    </span>
  );
};
