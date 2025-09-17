"use client";
import React, { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Copy,
  Download,
  Eye,
  Cog,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
  Scissors,
  Image as ImageIcon,
  LayoutGrid,
  Type as TypeIcon,
} from "lucide-react";

// ---------- Utility helpers ----------
const fonts = [
  "Arial, Helvetica, sans-serif",
  "Calibri, 'Segoe UI', sans-serif",
  "Helvetica, Arial, sans-serif",
  "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  "Georgia, serif",
  "Times New Roman, Times, serif",
  "Verdana, Geneva, Tahoma, sans-serif",
];

function download(filename: string, content: string, type = "text/html") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copyHtml(html: string) {
  try {
    // Prefer rich HTML copy for better paste into Outlook/Apple Mail/Gmail
    if (navigator.clipboard && 'ClipboardItem' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ClipboardItem = (window as any).ClipboardItem;
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([html.replace(/<[^>]+>/g, "")], { type: "text/plain" }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await navigator.clipboard.write([item as any]);
    } else {
      await navigator.clipboard.writeText(html);
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------- Types ----------
interface SocialLink {
  label: string;
  href: string;
}

interface SignatureConfig {
  // Identity
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  company: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  address1: string;
  address2: string;
  logoUrl: string;
  headshotUrl: string;

  // Design
  fontFamily: string;
  fontSize: number; // px
  accent: string; // hex
  textColor: string; // hex
  linkColor: string; // hex
  nameBold: boolean;
  titleItalic: boolean;
  showDivider: boolean;
  dividerColor: string;
  spacing: number; // px between blocks

  // Layout
  showLogo: boolean;
  logoPosition: "left" | "top"; // choose where the logo renders (if showLogo)
  separatorStyle: "dot" | "pipe" | "slash" | "dash" | "none" | "custom";
  customSeparator: string;

  // Social
  showSocial: boolean;
  social: SocialLink[];
  socialUseIcons: boolean;

  // Advanced
  rtl: boolean;
  includeVcard: boolean;
  utmParams: string; // e.g. utm_source=email_signature
  disclaimerHtml: string; // Safe HTML from contenteditable
}

const defaultConfig: SignatureConfig = {
  firstName: "Alex",
  lastName: "Doe",
  title: "Senior Product Manager",
  department: "Product",
  company: "Acme, Inc.",
  email: "alex.doe@acme.com",
  phone: "+1 (555) 123-4567",
  mobile: "+1 (555) 987-6543",
  website: "https://acme.com",
  address1: "123 Market Street",
  address2: "San Francisco, CA 94103",
  logoUrl:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Generic_Logo.svg/240px-Generic_Logo.svg.png",
  headshotUrl: "",
  fontFamily: fonts[1],
  fontSize: 13,
  accent: "#2b6cb0",
  textColor: "#1f2937",
  linkColor: "#2b6cb0",
  nameBold: true,
  titleItalic: false,
  showDivider: true,
  dividerColor: "#e5e7eb",
  spacing: 8,
  showLogo: true,
  logoPosition: "top",
  separatorStyle: "dot",
  customSeparator: "•",
  showSocial: true,
  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/acme" },
    { label: "Twitter", href: "https://twitter.com/acme" },
  ],
  socialUseIcons: false,
  rtl: false,
  includeVcard: false,
  utmParams: "utm_source=email_signature",
  disclaimerHtml:
    "<span style=\"color:#6b7280\">This message may contain confidential information.</span>",
};

// ---------- HTML Signature Generator (Outlook-friendly) ----------
function resolveSeparator(cfg: SignatureConfig) {
  const map: Record<string, string> = {
    dot: "•",
    pipe: "|",
    slash: "/",
    dash: "–",
    none: "",
    custom: cfg.customSeparator || "•",
  };
  return map[cfg.separatorStyle] ?? "•";
}

function separatorHTML(cfg: SignatureConfig) {
  const sep = resolveSeparator(cfg);
  if (!sep) return "";
  return `<span style=\"color:${cfg.accent};margin:0 6px\">${escapeHtml(sep)}</span>`;
}

function generateSignatureHTML(cfg: SignatureConfig) {
  const font = cfg.fontFamily;
  const size = cfg.fontSize;
  const color = cfg.textColor;
  const link = cfg.linkColor;
  const spacing = cfg.spacing;
  const divider = cfg.showDivider
    ? `<tr><td colspan=\"2\" style=\"height:1px;line-height:1px;border-top:1px solid ${cfg.dividerColor};padding:${spacing}px 0\"></td></tr>`
    : "";

  const websiteWithUtm = cfg.utmParams
    ? `${cfg.website}${cfg.website.includes("?") ? "&" : "?"}${cfg.utmParams}`
    : cfg.website;

  const socialBlock = cfg.showSocial
    ? `<tr><td colspan=\"2\" style=\"padding-top:${spacing}px\">${
        cfg.social
          .filter((s) => s.href)
          .map((s) => {
            const href = cfg.utmParams
              ? `${s.href}${s.href.includes("?") ? "&" : "?"}${cfg.utmParams}`
              : s.href;
            if (!cfg.socialUseIcons) {
              return `<a href=\"${escapeHtml(href)}\" target=\"_blank\" rel=\"noreferrer\" style=\"font-family:${font};font-size:${size}px;color:${link};text-decoration:none;margin-right:12px\">${escapeHtml(
                s.label
              )}</a>`;
            }
            return `<span style=\"display:inline-block;margin-right:12px\">• <a href=\"${escapeHtml(
              href
            )}\" target=\"_blank\" rel=\"noreferrer\" style=\"font-family:${font};font-size:${size}px;color:${link};text-decoration:none\">${escapeHtml(
              s.label
            )}</a></span>`;
          })
          .join("")
      }</td></tr>`
    : "";

  const rightToLeft = cfg.rtl ? "direction:rtl;" : "";

  // Build left-side (logo/headshot) when logoPosition === 'left'
  const leftSidePieces: string[] = [];
  if (cfg.showLogo && cfg.logoUrl && cfg.logoPosition === "left") {
    leftSidePieces.push(
      `<img src=\"${escapeHtml(cfg.logoUrl)}\" alt=\"Logo\" style=\"display:block;max-width:120px;height:auto;margin-bottom:${spacing}px\"/>`
    );
  }
  if (cfg.headshotUrl) {
    leftSidePieces.push(
      `<img src=\"${escapeHtml(cfg.headshotUrl)}\" alt=\"Headshot\" width=\"64\" height=\"64\" style=\"border-radius:50%;display:block\"/>`
    );
  }
  const leftSideCell =
    leftSidePieces.length > 0
      ? `<td style=\"vertical-align:top;padding-right:${spacing}px\">${leftSidePieces.join(
          ""
        )}</td>`
      : "";

  const logoTopRow = cfg.showLogo && cfg.logoUrl && cfg.logoPosition === "top"
    ? `<tr><td colspan=\"2\" style=\"padding: ${spacing}px 0 ${spacing}px 0\"><img src=\"${escapeHtml(
        cfg.logoUrl
      )}\" alt=\"Logo\" style=\"display:block;max-width:200px;height:auto\"/></td></tr>`
    : "";

  const nameLine = `${escapeHtml(cfg.firstName)} ${escapeHtml(cfg.lastName)}`.trim();
  const titleDept = [cfg.title, cfg.department].filter(Boolean).join(" · ");
  const telBlock = [
    cfg.phone ? `Tel: ${escapeHtml(cfg.phone)}` : "",
    cfg.mobile ? `Mobile: ${escapeHtml(cfg.mobile)}` : "",
  ]
    .filter(Boolean)
    .join(` ${resolveSeparator(cfg)} `);

  const sep = separatorHTML(cfg);

  const html = `
<!--[ Start: Generated by Signature Builder ]-->
<table cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;font-family:${font};font-size:${size}px;color:${color};${rightToLeft}\">
  ${logoTopRow}
  <tr>
    ${leftSideCell}
    <td style=\"vertical-align:top\">
      <table cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;font-family:${font};font-size:${size}px;color:${color}\">
        <tr>
          <td style=\"padding-bottom:${spacing}px\">
            <span style=\"font-weight:${cfg.nameBold ? "700" : "400"};font-size:${
    size + 1
  }px;color:${color}\">${nameLine}</span><br/>
            ${
              titleDept
                ? `<span style=\"${cfg.titleItalic ? "font-style:italic;" : ""}color:${
                    color
                  }\">${escapeHtml(titleDept)}</span>`
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style=\"padding-bottom:${spacing}px\">
            ${cfg.email
              ? `<a href=\"mailto:${escapeHtml(
                  cfg.email
                )}\" style=\"color:${link};text-decoration:none\">${escapeHtml(
                  cfg.email
                )}</a>`
              : ""}
            ${cfg.website ? `${sep}<a href=\"${escapeHtml(
                  websiteWithUtm
                )}\" target=\"_blank\" rel=\"noreferrer\" style=\"color:${link};text-decoration:none\">Website</a>` : ""}
            ${telBlock ? `<br/><span>${telBlock}</span>` : ""}
            ${(cfg.address1 || cfg.address2)
              ? `<br/><span>${escapeHtml(
                  [cfg.address1, cfg.address2].filter(Boolean).join(", ")
                )}</span>`
              : ""}
          </td>
        </tr>
        ${divider}
        ${socialBlock}
        ${cfg.disclaimerHtml
          ? `<tr><td style=\"padding-top:${spacing}px\">${cfg.disclaimerHtml}</td></tr>`
          : ""}
      </table>
    </td>
  </tr>
</table>
<!--[ End: Generated by Signature Builder ]-->
`;
  return html;
}

// ---------- Rich Text Mini-Editor (Toolbar + contenteditable) ----------
function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title={title}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="rounded-lg"
    >
      {children}
    </Button>
  );
}

function MiniRichTextEditor({
  html,
  onChange,
  linkColor,
}: {
  html: string;
  onChange: (html: string) => void;
  linkColor: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
  }, [html]);

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const makeLink = () => {
    const url = prompt("Link URL");
    if (!url) return;
    exec("createLink", url);
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="py-2">
        <div className="flex items-center gap-1">
          <ToolbarButton title="Bold" onClick={() => exec("bold")}> 
            <BoldIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => exec("italic")}>
            <ItalicIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => exec("underline")}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <ToolbarButton title="Align left" onClick={() => exec("justifyLeft")}>
            <AlignLeftIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Align center" onClick={() => exec("justifyCenter")}>
            <AlignCenterIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Align right" onClick={() => exec("justifyRight")}>
            <AlignRightIcon className="h-4 w-4" />
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <ToolbarButton title="Insert link" onClick={makeLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={ref}
          contentEditable
          className="min-h-[96px] w-full rounded-xl border bg-white p-3 text-sm focus:outline-none"
          style={{ caretColor: linkColor }}
          onInput={handleInput}
          onBlur={handleInput}
          suppressContentEditableWarning
        />
      </CardContent>
    </Card>
  );
}

// ---------- Main App ----------
export default function SignatureBuilderApp() {
  const [config, setConfig] = useState<SignatureConfig>(defaultConfig);
  const [showIntro, setShowIntro] = useState(true);
  const [previewHtml, setPreviewHtml] = useState(" ");
  const [freeformMode, setFreeformMode] = useState(false);
  const [freeformHtml, setFreeformHtml] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  // Keep preview in sync with either generated or freeform HTML
  useEffect(() => {
    if (!freeformMode) {
      setPreviewHtml(generateSignatureHTML(config));
    }
  }, [config, freeformMode]);

  useEffect(() => {
    if (freeformMode) {
      setPreviewHtml(freeformHtml || generateSignatureHTML(config));
    }
  }, [freeformMode, freeformHtml, config]);

  const handleChange = (key: keyof SignatureConfig, value: unknown) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const addSocial = () =>
    setConfig((c) => ({ ...c, social: [...c.social, { label: "New", href: "" }] }));

  const removeSocial = (idx: number) =>
    setConfig((c) => ({ ...c, social: c.social.filter((_, i) => i !== idx) }));

  const copyHtmlAction = async () => {
    const ok = await copyHtml(previewHtml);
    alert(ok ? "Signature HTML copied to clipboard" : "Copy failed. Please download the HTML and copy manually.");
  };

  const copyRenderedAsHtml = async () => {
    const node = document.getElementById("signature-preview-inner");
    if (!node) return alert("Preview not found");
    const html = node.innerHTML;
    const ok = await copyHtml(html);
    alert(ok ? "Rendered signature copied" : "Copy failed.");
  };

  const downloadHTML = () => download("signature.html", previewHtml);

  const exportPNG = async () => {
    const node = document.getElementById("signature-preview-table");
    if (!node) return alert("Preview not found");
    try {
      const dataUrl = await toPng(node as HTMLElement, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "signature.png";
      a.click();
    } catch (e) {
      console.error(e);
      alert("PNG export failed. Try copying HTML instead.");
    }
  };

  const onLogoUpload = async (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleChange("logoUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const onHeadshotUpload = async (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleChange("headshotUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const ResetButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfig(defaultConfig)}
      className="ml-auto"
    >
      Reset
    </Button>
  );

  const importGeneratedToFreeform = () => {
    setFreeformHtml(generateSignatureHTML(config));
    setFreeformMode(true);
  };

  const clearFreeform = () => setFreeformHtml("");

  return (
    <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 gap-4 p-4 md:grid-cols-[420px_1fr]">
      {/* LEFT: Settings */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Signature Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="identity">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="advanced">
                  <span className="inline-flex items-center gap-2"><Cog className="h-4 w-4"/>Advanced</span>
                </TabsTrigger>
                <TabsTrigger value="editor">
                  <span className="inline-flex items-center gap-2"><TypeIcon className="h-4 w-4"/>Editor</span>
                </TabsTrigger>
              </TabsList>

              {/* Identity */}
              <TabsContent value="identity" className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First name</Label>
                    <Input value={config.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input value={config.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={config.title} onChange={(e) => handleChange("title", e.target.value)} />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input value={config.department} onChange={(e) => handleChange("department", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Company</Label>
                    <Input value={config.company} onChange={(e) => handleChange("company", e.target.value)} />
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={config.email} onChange={(e) => handleChange("email", e.target.value)} />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input value={config.website} onChange={(e) => handleChange("website", e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={config.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                  </div>
                  <div>
                    <Label>Mobile</Label>
                    <Input value={config.mobile} onChange={(e) => handleChange("mobile", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Address line 1</Label>
                    <Input value={config.address1} onChange={(e) => handleChange("address1", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Address line 2</Label>
                    <Input value={config.address2} onChange={(e) => handleChange("address2", e.target.value)} />
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 inline-flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Logo URL</Label>
                    <Input value={config.logoUrl} onChange={(e) => handleChange("logoUrl", e.target.value)} placeholder="https://..." />
                    <div className="mt-2 text-xs text-muted-foreground">or upload:</div>
                    <Input type="file" accept="image/*" onChange={(e) => onLogoUpload(e.target.files?.[0])} />
                  </div>
                  <div>
                    <Label className="mb-1 inline-flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Headshot URL</Label>
                    <Input value={config.headshotUrl} onChange={(e) => handleChange("headshotUrl", e.target.value)} placeholder="https://..." />
                    <div className="mt-2 text-xs text-muted-foreground">or upload:</div>
                    <Input type="file" accept="image/*" onChange={(e) => onHeadshotUpload(e.target.files?.[0])} />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">{ResetButton}</div>
              </TabsContent>

              {/* Design */}
              <TabsContent value="design" className="space-y-3 pt-3">
                <div className="grid grid-cols-1 gap-3">
                  {/* Layout presets */}
                  <div className="rounded-xl border p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><LayoutGrid className="h-4 w-4"/> Layout</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={config.showLogo} onCheckedChange={(v) => handleChange("showLogo", v)} />
                        <Label className="cursor-pointer">Show logo</Label>
                      </div>
                      {config.showLogo && (
                        <div>
                          <Label>Logo position</Label>
                          <select
                            className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                            value={config.logoPosition}
                            onChange={(e) => handleChange("logoPosition", e.target.value as "left" | "top")}
                          >
                            <option value="top">Top (above text)</option>
                            <option value="left">Left (beside text)</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <Label>Separator between items</Label>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <select
                          className="w-full rounded-md border bg-background p-2 text-sm"
                          value={config.separatorStyle}
                          onChange={(e) => handleChange("separatorStyle", e.target.value as "dot" | "pipe" | "slash" | "dash" | "none" | "custom")}
                        >
                          <option value="dot">• dot</option>
                          <option value="pipe">| pipe</option>
                          <option value="slash">/ slash</option>
                          <option value="dash">– dash</option>
                          <option value="none">(none)</option>
                          <option value="custom">custom</option>
                        </select>
                        {config.separatorStyle === "custom" && (
                          <Input
                            placeholder="Custom separator (e.g., ✦)"
                            value={config.customSeparator}
                            maxLength={3}
                            onChange={(e) => handleChange("customSeparator", e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Font family</Label>
                  <select
                    className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                    value={config.fontFamily}
                    onChange={(e) => handleChange("fontFamily", e.target.value)}
                  >
                    {fonts.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: f }}>
                        {f.split(",")[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Font size (px)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={18}
                      value={config.fontSize}
                      onChange={(e) => handleChange("fontSize", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Line spacing (px)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      value={config.spacing}
                      onChange={(e) => handleChange("spacing", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Text color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.textColor} onChange={(e) => handleChange("textColor", e.target.value)} />
                      <Input value={config.textColor} onChange={(e) => handleChange("textColor", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Accent color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.accent} onChange={(e) => handleChange("accent", e.target.value)} />
                      <Input value={config.accent} onChange={(e) => handleChange("accent", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Link color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.linkColor} onChange={(e) => handleChange("linkColor", e.target.value)} />
                      <Input value={config.linkColor} onChange={(e) => handleChange("linkColor", e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={config.nameBold} onCheckedChange={(v) => handleChange("nameBold", v)} />
                    <Label className="cursor-pointer">Bold name</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={config.titleItalic} onCheckedChange={(v) => handleChange("titleItalic", v)} />
                    <Label className="cursor-pointer">Italicize title/department</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.showDivider} onCheckedChange={(v) => handleChange("showDivider", v)} />
                    <Label className="cursor-pointer">Show divider</Label>
                  </div>
                </div>
                {config.showDivider && (
                  <div>
                    <Label>Divider color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.dividerColor} onChange={(e) => handleChange("dividerColor", e.target.value)} />
                      <Input value={config.dividerColor} onChange={(e) => handleChange("dividerColor", e.target.value)} />
                    </div>
                  </div>
                )}
                <div className="pt-2 flex items-center gap-2">{ResetButton}</div>
              </TabsContent>

              {/* Social */}
              <TabsContent value="social" className="space-y-3 pt-3">
                <div className="flex items-center gap-2">
                  <Switch checked={config.showSocial} onCheckedChange={(v) => handleChange("showSocial", v)} />
                  <Label className="cursor-pointer">Show social links</Label>
                </div>
                {config.showSocial && (
                  <>
                    <div className="flex items-center gap-2">
                      <Switch checked={config.socialUseIcons} onCheckedChange={(v) => handleChange("socialUseIcons", v)} />
                      <Label className="cursor-pointer">Use icon-style labels (more visual; may be blocked)</Label>
                    </div>
                    <div className="space-y-2">
                      {config.social.map((s, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                          <Input
                            placeholder="Label (e.g., LinkedIn)"
                            value={s.label}
                            onChange={(e) =>
                              setConfig((c) => {
                                const social = [...c.social];
                                social[i] = { ...social[i], label: e.target.value };
                                return { ...c, social };
                              })
                            }
                          />
                          <Input
                            placeholder="https://..."
                            value={s.href}
                            onChange={(e) =>
                              setConfig((c) => {
                                const social = [...c.social];
                                social[i] = { ...social[i], href: e.target.value };
                                return { ...c, social };
                              })
                            }
                          />
                          <Button variant="outline" size="icon" onClick={() => removeSocial(i)}>
                            <Scissors className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="secondary" onClick={addSocial}>Add social link</Button>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Advanced (hide unusual settings) */}
              <TabsContent value="advanced" className="space-y-4 pt-3">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="workflow">
                    <AccordionTrigger>Paste/Export Options & Workflow</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>Copy as HTML</strong> works best for Apple Mail, Outlook for Mac, Gmail web. Outlook for Windows (desktop) often prefers &quot;Paste Special → HTML&quot; or using the downloaded <code>signature.html</code>.</p>
                        <p><strong>PNG Export</strong> is convenient but not recommended for accessibility and dark mode; use HTML for clickable links.</p>
                        <p>To ensure links are tracked, set UTM parameters below.</p>
                        <div className="grid grid-cols-1 gap-2 pt-2">
                          <div>
                            <Label>Append UTM parameters to links</Label>
                            <Input placeholder="utm_source=email_signature" value={config.utmParams} onChange={(e) => handleChange("utmParams", e.target.value)} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={config.includeVcard} onCheckedChange={(v) => handleChange("includeVcard", v)} />
                            <Label>Include vCard link (download .vcf)</Label>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="editor">
                    <AccordionTrigger>Custom note / disclaimer (rich text)</AccordionTrigger>
                    <AccordionContent>
                      <MiniRichTextEditor
                        html={config.disclaimerHtml}
                        onChange={(html) => handleChange("disclaimerHtml", html)}
                        linkColor={config.linkColor}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">Tip: keep disclaimers concise (2 lines). Avoid images or background colors for Outlook compatibility.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="layout">
                    <AccordionTrigger>Layout & Internationalization</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex items-center gap-3">
                        <Switch checked={config.rtl} onCheckedChange={(v) => handleChange("rtl", v)} />
                        <Label>Right-to-left text (RTL)</Label>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="rare">
                    <AccordionTrigger>Rare / Not usual settings</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>• Keep total image width under 600px to avoid wrapping in some clients.</p>
                        <p>• Host images on HTTPS and set explicit width/height attributes.</p>
                        <p>• Avoid web fonts; use system-safe fonts for Outlook.</p>
                        <p>• Do not rely on dark mode; colors may invert.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              {/* Freeform Editor */}
              <TabsContent value="editor" className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={freeformMode}
                      onCheckedChange={(v) => {
                        if (v && !freeformHtml) setFreeformHtml(generateSignatureHTML(config));
                        setFreeformMode(v);
                      }}
                    />
                    <Label className="cursor-pointer">Edit signature as rich text (freeform)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={importGeneratedToFreeform}>Import generated</Button>
                    <Button size="sm" variant="ghost" onClick={clearFreeform}>Clear</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">This mode lets you edit the actual signature HTML (text, separators, line breaks). Keep table structure intact for Outlook compatibility.</p>
                <MiniRichTextEditor
                  html={freeformMode ? (freeformHtml || generateSignatureHTML(config)) : generateSignatureHTML(config)}
                  onChange={setFreeformHtml}
                  linkColor={config.linkColor}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Pre-session Best Practices (collapsible dialog shown first) */}
        <Dialog open={showIntro} onOpenChange={setShowIntro}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Signature Best Practices (Quick Prep)</DialogTitle>
              <DialogDescription>
                Build a clean, professional signature that works across Outlook, Apple Mail, and Gmail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <ul className="list-disc pl-6 space-y-1">
                <li>Use <strong>system-safe fonts</strong> (Arial, Calibri, Segoe UI, Georgia) for Outlook compatibility.</li>
                <li><strong>Tables + inline CSS</strong> render reliably in Outlook; avoid complex layouts or background images.</li>
                <li>Keep it <strong>2–5 lines of core info</strong>. Emphasize name, title, company, and a primary contact method.</li>
                <li>Host logos/icons on <strong>HTTPS</strong> and set explicit <strong>width/height</strong> to prevent resizing.</li>
                <li>Prefer <strong>text social links</strong>; icons are frequently blocked or stripped.</li>
                <li>Don’t embed large disclaimers. Keep legal text short to avoid email bloat.</li>
                <li>Test paste workflow in your mail app. Outlook (Windows) may require <em>Paste Special → HTML</em>.</li>
              </ul>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowIntro(false)}>Start building</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* RIGHT: Preview + Export */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl inline-flex items-center gap-2"><Eye className="h-5 w-5"/>Live Preview</CardTitle>
              <div className="text-xs text-muted-foreground">Two-column app: left settings • right preview/export</div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={previewRef} id="signature-preview-inner" className="rounded-2xl border bg-white/60 p-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                {/* Render the generated or freeform HTML */}
                <div
                  id="signature-preview-table"
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Download / Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Button onClick={copyHtmlAction} className="w-full" variant="default">
                <Copy className="mr-2 h-4 w-4" /> Copy HTML
              </Button>
              <Button onClick={copyRenderedAsHtml} className="w-full" variant="secondary">
                <Copy className="mr-2 h-4 w-4" /> Copy Rendered
              </Button>
              <Button onClick={downloadHTML} className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" /> Download .html
              </Button>
              <Button onClick={exportPNG} className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" /> Export PNG
              </Button>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Paste into Outlook (Windows Desktop)</h3>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Download <code>signature.html</code> and open it in a browser.</li>
                  <li>Select the signature block and copy.</li>
                  <li>Outlook → File → Options → Mail → Signatures → New.</li>
                  <li>Use <strong>Paste</strong> or <strong>Paste Special → HTML</strong>.</li>
                </ol>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Paste into Apple Mail / Gmail</h3>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Click <strong>Copy HTML</strong> (or Copy Rendered).</li>
                  <li>Apple Mail: Preferences → Signatures → paste into the editor.</li>
                  <li>Gmail Web: Settings → See all settings → General → Signature.</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Attribution */}
      <div className="col-span-full mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
        🌴 Vibe-coded in Pasadena, California, by{" "}
        <a
          href="https://tervahagn.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Vahagn Ter-Sarkisyan
        </a>{" "}
        and open for free of charge use.
      </div>
    </div>
  );
}
