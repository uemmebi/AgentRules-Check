const paths = {
  external: 'M7 5h12v12M19 5 5 19',
  down: 'M12 3v18m-7-7 7 7 7-7',
  right: 'M3 12h18m-7-7 7 7-7 7',
};
export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      aria-hidden="true"
      className="inline-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
