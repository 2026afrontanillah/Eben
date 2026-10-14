import React, { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';

interface RouterContextType {
  pathname: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType>({
  pathname: window.location.pathname,
  navigate: () => {},
  params: {},
});

export function useRouter() {
  return useContext(RouterContext);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export function Link({ href, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !rest.target && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      navigate(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export function matchPath(pattern: string, pathname: string): { match: boolean; params: Record<string, string> } {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { match: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    const val = pathParts[i];
    if (p && p.startsWith(':')) {
      if (val !== undefined) {
        params[p.slice(1)] = decodeURIComponent(val);
      }
    } else if (p !== val) {
      return { match: false, params: {} };
    }
  }

  return { match: true, params };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string) => {
    if (to !== window.location.pathname) {
      window.history.pushState(null, '', to);
      setPathname(to);
      window.scrollTo(0, 0);
    }
  };

  const value = useMemo(() => ({ pathname, navigate, params: {} }), [pathname]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}
