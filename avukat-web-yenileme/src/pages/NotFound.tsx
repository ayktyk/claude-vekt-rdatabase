import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSeo } from "@/hooks/use-seo";

const NotFound = () => {
  const location = useLocation();

  useSeo({
    title: "Sayfa Bulunamadı | Vega Hukuk",
    description: "Aradığınız sayfa bulunamadı. Vega Hukuk ana sayfasına dönebilirsiniz.",
    canonicalPath: location.pathname,
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Sayfa bulunamadı</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Ana sayfaya dön
        </a>
      </div>
    </div>
  );
};

export default NotFound;
