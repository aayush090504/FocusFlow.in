import React from 'react';

interface SpaLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  onNavigate?: (path: string) => void;
  children: React.ReactNode;
}

/**
 * Semantic <a href="..."> navigation link that enables search engine crawlers
 * and right-click/middle-click browser actions while performing instant SPA
 * history navigation on normal left clicks.
 */
export const SpaLink: React.FC<SpaLinkProps> = ({
  to,
  onNavigate,
  onClick,
  children,
  ...rest
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (
      onNavigate &&
      !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey &&
      (!rest.target || rest.target === '_self')
    ) {
      e.preventDefault();
      onNavigate(to);
    }
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
