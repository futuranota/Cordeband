type ClassicLoaderProps = {
  size?: 'sm' | 'md';
  tone?: 'default' | 'onPrimary';
  className?: string;
};

export function ClassicLoader({ size = 'md', tone = 'default', className }: ClassicLoaderProps) {
  return (
    <div
      className={[
        'classic-loader',
        `classic-loader--${size}`,
        tone === 'onPrimary' ? 'classic-loader--on-primary' : '',
        className,
      ].filter(Boolean).join(' ')}
      role="status"
      aria-label="Loading"
    />
  );
}
