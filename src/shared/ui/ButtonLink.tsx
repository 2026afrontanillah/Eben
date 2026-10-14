import type { ReactNode } from 'react';
import { buttonClassName, type ButtonStyleOptions } from './button-styles';

interface ButtonLinkProps extends ButtonStyleOptions {
  href: string;
  children: ReactNode;
  prefetch?: boolean;
  download?: boolean | string;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function ButtonLink({ href, children, download, target, rel, onClick, ...styleOptions }: ButtonLinkProps) {
  return (
    <a
      href={href}
      download={download}
      target={target}
      rel={rel}
      onClick={onClick}
      className={buttonClassName(styleOptions)}
    >
      {children}
    </a>
  );
}
