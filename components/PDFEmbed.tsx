type Props = {
  src: string;
};

export function PDFEmbed({ src }: Props) {
  return (
    <iframe
      src={src}
      title="PDF document"
      className="mt-4 w-full min-h-[450px] rounded-xl border border-[var(--border)]"
    />
  );
}
