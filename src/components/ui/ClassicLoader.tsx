type ClassicLoaderProps = {
  size?: 'sm' | 'md';
  className?: string;
};

export function ClassicLoader({ size = 'md', className }: ClassicLoaderProps) {
  return (
    <div
      className={`classic-loader classic-loader--${size}${className ? ` ${className}` : ''}`}
      role="status"
      aria-label="Loading"
    />
  );
}
