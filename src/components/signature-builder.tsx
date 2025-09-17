"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import * as htmlToImage from "html-to-image";

type Layout = "logo-left" | "logo-top" | "no-logo";

const fontChoices = [
  "Arial, Helvetica, sans-serif",
  "Tahoma, Geneva, sans-serif",
  "Verdana, Geneva, sans-serif",
  "Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  "Georgia, Times, \"Times New Roman\", serif",
];

function useSignatureState() {
  const [fullName, setFullName] = useState("Alex Smith");
  const [title, setTitle] = useState("Senior Product Designer");
  const [company, setCompany] = useState("Acme Inc.");
  const [email, setEmail] = useState("alex@acme.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [website, setWebsite] = useState("https://acme.com");
  const [address, setAddress] = useState("");
  const [fontFamily, setFontFamily] = useState(fontChoices[0]);
  const [textColor, setTextColor] = useState("#333333");
  const [linkColor, setLinkColor] = useState("#0B63F6");
  const [accentColor, setAccentColor] = useState("#0B63F6");
  const [separator, setSeparator] = useState("•");
  const [customSeparator, setCustomSeparator] = useState("");
  const [layout, setLayout] = useState<Layout>("logo-left");
  const [logoUrl, setLogoUrl] = useState("");
  const [headshotUrl, setHeadshotUrl] = useState("");
  const [showHeadshot, setShowHeadshot] = useState(false);
  const [rtl, setRtl] = useState(false);

  const sep = customSeparator || separator;

  return {
    fullName,
    setFullName,
    title,
    setTitle,
    company,
    setCompany,
    email,
    setEmail,
    phone,
    setPhone,
    website,
    setWebsite,
    address,
    setAddress,
    fontFamily,
    setFontFamily,
    textColor,
    setTextColor,
    linkColor,
    setLinkColor,
    accentColor,
    setAccentColor,
    separator,
    setSeparator,
    customSeparator,
    setCustomSeparator,
    layout,
    setLayout,
    logoUrl,
    setLogoUrl,
    headshotUrl,
    setHeadshotUrl,
    showHeadshot,
    setShowHeadshot,
    rtl,
    setRtl,
    sep,
  } as const;
}

type State = ReturnType<typeof useSignatureState>;

function SignatureMarkup({ s }: { s: State }) {
  // Build the signature using email‑client friendly markup (tables + inline styles)
  const commonText = {
    fontFamily: s.fontFamily,
    color: s.textColor,
    lineHeight: 1.35,
    fontSize: 14,
  } as const;

  const linkStyle = {
    color: s.linkColor,
    textDecoration: "none",
  } as const;

  const showLogoCol = s.layout === "logo-left" && (s.logoUrl || (s.showHeadshot && s.headshotUrl));

  const contactBits: Array<React.ReactElement> = [];
  if (s.phone) contactBits.push(<span key="p">{s.phone}</span>);
  if (s.email)
    contactBits.push(
      <a key="e" href={`mailto:${s.email}`} style={linkStyle}>
        {s.email}
      </a>
    );
  if (s.website)
    contactBits.push(
      <a key="w" href={s.website} style={linkStyle}>
        {s.website.replace(/^https?:\/\//, "")}
      </a>
    );

  const ContactJoined = () => (
    <>
      {contactBits.map((el, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: s.accentColor, padding: "0 6px" }}>{s.sep}</span>}
          {el}
        </span>
      ))}
    </>
  );

  return (
    <table
      cellPadding={0}
      cellSpacing={0}
      style={{ borderCollapse: "collapse", background: "#ffffff" }}
      dir={s.rtl ? "rtl" : "ltr"}
    >
      <tbody>
        {s.layout === "logo-top" && s.logoUrl ? (
          <tr>
            <td style={{ paddingBottom: 10 }}>
              <img
                src={s.logoUrl}
                alt="Logo"
                style={{ display: "block", maxWidth: 220, height: "auto" }}
              />
            </td>
          </tr>
        ) : null}
        <tr>
          {showLogoCol ? (
            <td style={{ verticalAlign: "top", paddingRight: 18 }}>
              <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
                <tbody>
                  {s.showHeadshot && s.headshotUrl ? (
                    <tr>
                      <td style={{ paddingBottom: s.logoUrl ? 10 : 0 }}>
                        <img
                          src={s.headshotUrl}
                          alt="Headshot"
                          width={72}
                          height={72}
                          style={{ borderRadius: "50%", display: "block" }}
                        />
                      </td>
                    </tr>
                  ) : null}
                  {s.logoUrl ? (
                    <tr>
                      <td>
                        <img
                          src={s.logoUrl}
                          alt="Logo"
                          style={{ display: "block", maxWidth: 120, height: "auto" }}
                        />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </td>
          ) : null}
          <td style={{ verticalAlign: "top" }}>
            <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ ...commonText, fontWeight: 700, fontSize: 16 }}>{s.fullName}</td>
                </tr>
                {(s.title || s.company) && (
                  <tr>
                    <td style={{ ...commonText, color: s.accentColor }}>
                      {[s.title, s.company].filter(Boolean).join(" · ")}
                    </td>
                  </tr>
                )}
                {(s.phone || s.email || s.website) && (
                  <tr>
                    <td style={{ ...commonText, paddingTop: 6 }}>
                      <ContactJoined />
                    </td>
                  </tr>
                )}
                {s.address && (
                  <tr>
                    <td style={{ ...commonText, color: "#777", paddingTop: 6 }}>{s.address}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function SignatureBuilder() {
  const s = useSignatureState();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const signatureRef = useRef<HTMLDivElement | null>(null);

  const htmlString = useMemo(() => {
    // We read this dynamically from the DOM when copying, but this is
    // useful if we need a snapshot for download.
    return signatureRef.current?.innerHTML ?? "";
  }, [s.fullName, s.title, s.company, s.email, s.phone, s.website, s.address, s.fontFamily, s.textColor, s.linkColor, s.accentColor, s.separator, s.customSeparator, s.layout, s.logoUrl, s.headshotUrl, s.showHeadshot, s.rtl]);

  async function copyHtml() {
    const html = signatureRef.current?.innerHTML || "";
    await navigator.clipboard.writeText(html);
  }

  async function copyRendered() {
    const html = signatureRef.current?.outerHTML || "";
    await navigator.clipboard.writeText(html);
  }

  function downloadHtml() {
    const html = signatureRef.current?.innerHTML || "";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signature.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPng() {
    if (!containerRef.current) return;
    const node = containerRef.current;
    // Convert only the signature box, not the whole UI
    const signatureNode = signatureRef.current;
    if (!signatureNode) return;
    const dataUrl = await htmlToImage.toPng(signatureNode as unknown as HTMLElement, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "signature.png";
    a.click();
  }

  const sepOptions = ["•", "|", "/", "–", "custom"] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold mb-4">Email Signature Builder</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" value={s.fullName} onChange={(e) => s.setFullName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={s.title} onChange={(e) => s.setTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={s.company} onChange={(e) => s.setCompany(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={s.email} onChange={(e) => s.setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={s.phone} onChange={(e) => s.setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={s.website} onChange={(e) => s.setWebsite(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address/Tagline</Label>
                    <Input id="address" value={s.address} onChange={(e) => s.setAddress(e.target.value)} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Font family</Label>
                    <select
                      className="border-input dark:bg-input/30 rounded-md border h-9 px-3 text-sm w-full"
                      value={s.fontFamily}
                      onChange={(e) => s.setFontFamily(e.target.value)}
                    >
                      {fontChoices.map((f) => (
                        <option key={f} value={f}>
                          {f.split(",")[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Layout</Label>
                    <select
                      className="border-input dark:bg-input/30 rounded-md border h-9 px-3 text-sm w-full"
                      value={s.layout}
                      onChange={(e) => s.setLayout(e.target.value as Layout)}
                    >
                      <option value="logo-left">Logo left</option>
                      <option value="logo-top">Logo top</option>
                      <option value="no-logo">No logo</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={s.rtl} onCheckedChange={s.setRtl} id="rtl" />
                    <Label htmlFor="rtl">RTL content</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={s.showHeadshot} onCheckedChange={s.setShowHeadshot} id="headshot" />
                    <Label htmlFor="headshot">Include headshot</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="min-w-24">Text</Label>
                    <input type="color" value={s.textColor} onChange={(e) => s.setTextColor(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="min-w-24">Links</Label>
                    <input type="color" value={s.linkColor} onChange={(e) => s.setLinkColor(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="min-w-24">Accent</Label>
                    <input type="color" value={s.accentColor} onChange={(e) => s.setAccentColor(e.target.value)} />
                  </div>
                  <div>
                    <Label>Separator</Label>
                    <div className="flex gap-2 mt-1">
                      {sepOptions.map((opt) => (
                        <Button
                          key={opt}
                          type="button"
                          variant={s.separator === opt ? "default" : "outline"}
                          size="sm"
                          onClick={() => s.setSeparator(opt)}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                    {s.separator === "custom" && (
                      <div className="mt-2">
                        <Input
                          placeholder="Enter custom separator"
                          value={s.customSeparator}
                          onChange={(e) => s.setCustomSeparator(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assets" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input id="logo" value={s.logoUrl} onChange={(e) => s.setLogoUrl(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="headshotUrl">Headshot URL</Label>
                    <Input id="headshotUrl" value={s.headshotUrl} onChange={(e) => s.setHeadshotUrl(e.target.value)} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button onClick={copyHtml}>Copy HTML</Button>
              <Button variant="outline" onClick={copyRendered}>
                Copy Rendered
              </Button>
              <Button variant="outline" onClick={downloadHtml}>
                Download .html
              </Button>
              <Button variant="secondary" onClick={exportPng}>
                Export PNG
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card ref={containerRef}>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "rounded-md border p-6 bg-white text-black max-w-full overflow-auto",
                "[&_*]:!leading-[1.35]"
              )}
            >
              <div ref={signatureRef} className="inline-block">
                <SignatureMarkup s={s} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Tip: The preview uses tables and inline styles to match Outlook/Gmail behavior.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

