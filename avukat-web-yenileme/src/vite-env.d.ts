/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLOG_API_URL?: string;
  readonly VITE_BLOG_API_TOKEN?: string;
  readonly VITE_BLOG_ITEMS_PATH?: string;
  readonly VITE_BLOG_FIELD_SLUG?: string;
  readonly VITE_BLOG_FIELD_TITLE?: string;
  readonly VITE_BLOG_FIELD_EXCERPT?: string;
  readonly VITE_BLOG_FIELD_CONTENT?: string;
  readonly VITE_BLOG_FIELD_CATEGORY?: string;
  readonly VITE_BLOG_FIELD_AUTHOR?: string;
  readonly VITE_BLOG_FIELD_PUBLISHED_AT?: string;
  readonly VITE_BLOG_FIELD_UPDATED_AT?: string;
  readonly VITE_BLOG_FIELD_SEO_TITLE?: string;
  readonly VITE_BLOG_FIELD_SEO_DESCRIPTION?: string;
  readonly VITE_BLOG_FIELD_COVER_CLASS?: string;
  readonly VITE_BLOG_FIELD_COVER_IMAGE?: string;
  readonly VITE_CONTACT_FORM_ENDPOINT?: string;
  readonly VITE_CONTACT_FORM_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
