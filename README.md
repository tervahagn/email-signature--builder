# Email Signature Builder

A two-column web app to design, preview, and export professional, Outlook-friendly email signatures.

## Features
- **Layouts**: logo **top/left** or **no logo**; headshot optional
- **Separators**: `• | / –` or **custom**
- **Typography**: system-safe fonts, size, colors (text, accent, links)
- **Content**: name/title/company, phone/mobile, email, website, address
- **Social**: text links (icon-style optional)
- **Advanced**: RTL, UTM tagging, legal/disclaimer block
- **Editor**: freeform rich-text editing (bold/italic/underline, align, links)
- **Export**: Copy HTML (rich), Copy Rendered, **Download .html**, **Export PNG**
- **Compatibility**: table + inline CSS for Outlook/Apple Mail/Gmail

## Tech Stack
- Next.js (React, TypeScript), Tailwind CSS
- shadcn/ui + lucide-react
- framer-motion, html-to-image

## Quick Start
```bash
# 1) Scaffold
npx create-next-app@latest email-signature-builder --ts --tailwind
cd email-signature-builder

# 2) Install deps
npm i framer-motion lucide-react html-to-image

# 3) Add shadcn/ui components
npx shadcn@latest init
npx shadcn@latest add card button input label separator tabs accordion dialog switch textarea
```
