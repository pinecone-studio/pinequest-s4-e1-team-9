declare module 'pdf-parse' {
  type PdfParseOptions = {
    pagerender?: (pageData: unknown) => Promise<string> | string;
  };

  const parsePdf: (
    dataBuffer: Buffer,
    options?: PdfParseOptions,
  ) => Promise<unknown>;

  export = parsePdf;
}
