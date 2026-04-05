# ootob.ai

歐兜邁 / オートバイ / autobike

Personal site by Jack Tsai. Essays, projects, and whatever doesn't fit anywhere else.

## Deploy

Connected to Cloudflare Pages. Push to `main` to deploy.

## Structure

```
site/
├── index.html      # Homepage (品味不可說 essay)
├── _headers        # Cloudflare security headers
├── _redirects      # Redirect rules
└── .github/
    └── workflows/
        └── deploy.yml  # Auto-deploy on push
```

## Local preview

```bash
npx serve .
```
