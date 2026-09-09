import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Link as LinkIcon,
  Lock,
  LogOut,
  Megaphone,
  MessageSquare,
  Plus,
  Radio,
  Settings,
  ShieldAlert,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MarketingDashboard() {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });
  const [activeTab, setActiveTab] = useState("overview");

  // MK9: Reports
  const [reportPeriod, setReportPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [reportGroupBy, setReportGroupBy] = useState<"source" | "course" | "campaign">("source");
  const reportQuery = trpc.marketing.getReport.useQuery({ period: reportPeriod, groupBy: reportGroupBy });

  // MK6: Content blocks, events, blog, testimonials
  const contentBlocksQuery = trpc.marketing.listContentBlocks.useQuery({});
  const eventsQuery = trpc.marketing.listEvents.useQuery();
  const blogQuery = trpc.marketing.listBlogPosts.useQuery({});
  const testimonialsQuery = trpc.marketing.listTestimonials.useQuery();
  const landingPagesQuery = trpc.marketing.listLandingPages.useQuery();
  const whatsappQuery = trpc.marketing.listWhatsappEntryPoints.useQuery();
  const chatbotFaqQuery = trpc.marketing.listChatbotFaq.useQuery();
  const socialLinksQuery = trpc.marketing.listSocialLinks.useQuery();

  // MK7: Media
  const mediaQuery = trpc.marketing.listMediaAssets.useQuery({});

  // MK8: Audience Segments
  const segmentsQuery = trpc.marketing.listAudienceSegments.useQuery();

  // MK10: Settings
  const ctaQuery = trpc.marketing.getCtaSettings.useQuery();
  const trackingQuery = trpc.marketing.getTrackingSettings.useQuery();
  const leadSourcesQuery = trpc.marketing.listLeadSources.useQuery();
  const templatesQuery = trpc.marketing.listMessageTemplates.useQuery();

  // Forms / Dialog states
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceCode, setNewSourceCode] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<"banner" | "logo" | "creative" | "other">("banner");
  const [newMediaTags, setNewMediaTags] = useState("");

  const [newBlockPage, setNewBlockPage] = useState("home");
  const [newBlockKey, setNewBlockKey] = useState("");
  const [newBlockType, setNewBlockType] = useState("text");
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockContent, setNewBlockContent] = useState("");

  const [newSegmentName, setNewSegmentName] = useState("");
  const [newSegmentAge, setNewSegmentAge] = useState("");
  const [newSegmentLang, setNewSegmentLang] = useState("");

  const [newWpLabel, setNewWpLabel] = useState("");
  const [newWpNumber, setNewWpNumber] = useState("+60");
  const [newWpMessage, setNewWpMessage] = useState("");

  // Mutations
  const utils = trpc.useUtils();

  const createLeadSourceMutation = trpc.marketing.createLeadSource.useMutation({
    onSuccess: () => {
      toast.success("Lead source added to directory");
      setNewSourceName("");
      setNewSourceCode("");
      utils.marketing.listLeadSources.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteLeadSourceMutation = trpc.marketing.deleteLeadSource.useMutation({
    onSuccess: () => {
      toast.success("Lead source removed");
      utils.marketing.listLeadSources.invalidate();
    },
  });

  const createMediaMutation = trpc.marketing.createMediaAsset.useMutation({
    onSuccess: () => {
      toast.success("Media asset saved");
      setNewMediaUrl("");
      setNewMediaTags("");
      utils.marketing.listMediaAssets.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMediaMutation = trpc.marketing.deleteMediaAsset.useMutation({
    onSuccess: () => {
      toast.success("Asset removed");
      utils.marketing.listMediaAssets.invalidate();
    },
  });

  const createContentBlockMutation = trpc.marketing.createContentBlock.useMutation({
    onSuccess: () => {
      toast.success("Content block created and published");
      setNewBlockKey("");
      setNewBlockTitle("");
      setNewBlockContent("");
      utils.marketing.listContentBlocks.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteContentBlockMutation = trpc.marketing.deleteContentBlock.useMutation({
    onSuccess: () => {
      toast.success("Content block deleted");
      utils.marketing.listContentBlocks.invalidate();
    },
  });

  const createSegmentMutation = trpc.marketing.createAudienceSegment.useMutation({
    onSuccess: () => {
      toast.success("Audience segment saved");
      setNewSegmentName("");
      setNewSegmentAge("");
      setNewSegmentLang("");
      utils.marketing.listAudienceSegments.invalidate();
    },
  });

  const createWpMutation = trpc.marketing.createWhatsappEntryPoint.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp entry point added");
      setNewWpLabel("");
      setNewWpMessage("");
      utils.marketing.listWhatsappEntryPoints.invalidate();
    },
  });

  const updateCtaMutation = trpc.marketing.updateCtaSettings.useMutation({
    onSuccess: () => toast.success("CTA settings saved"),
    onError: (err) => toast.error(err.message),
  });

  const [ctaApplyText, setCtaApplyText] = useState("");
  const [ctaApplyLink, setCtaApplyLink] = useState("");
  const [ctaConsultText, setCtaConsultText] = useState("");

  React.useEffect(() => {
    if (ctaQuery.data) {
      setCtaApplyText(ctaQuery.data["cta.apply_now.text"] || "Apply Now");
      setCtaApplyLink(ctaQuery.data["cta.apply_now.link"] || "/enroll");
      setCtaConsultText(ctaQuery.data["cta.book_consultation.text"] || "Book Free Consultation");
    }
  }, [ctaQuery.data]);

  const handleExportCsv = async () => {
    try {
      const res = await fetch(`/api/portal/marketing/reports/export.csv?groupBy=${reportGroupBy}&period=${reportPeriod}`);
      if (!res.ok) throw new Error("Failed to export CSV");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketing_report_${reportGroupBy}_${reportPeriod}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("CSV report downloaded");
    } catch {
      toast.error("Could not export report");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">Loading Marketing Workspace...</p>
      </div>
    );
  }

  const isMarketingAllowed = ["marketing", "admin", "super_admin", "founder"].includes(user?.role ?? "");
  if (!isMarketingAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-600 max-w-md mt-2 mb-6">
          You do not have marketing or content management permissions. Please switch to an authorized account.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-bold text-lg text-blue-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              BI
            </span>
            <span className="hidden sm:inline">Bilingual Idol</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-800">Marketing & Content Management</h1>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 text-xs">
              MK6–MK11 Active
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-600 text-xs">
              My Profile
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="text-slate-700 border-slate-300 text-xs gap-1.5"
          >
            <LogOut size={14} />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-xs inline-flex h-auto">
              <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 size={15} />
                Overview & Reports (MK9)
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1.5 text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <FileText size={15} />
                Content & CMS (MK6)
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5 text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <ImageIcon size={15} />
                Media Library (MK7)
              </TabsTrigger>
              <TabsTrigger value="audiences" className="gap-1.5 text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users size={15} />
                Audiences (MK8)
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-1.5 text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <MessageSquare size={15} />
                Channels & FAQ
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Settings size={15} />
                Settings & Directory (MK10)
              </TabsTrigger>
              <TabsTrigger value="restrictions" className="gap-1.5 text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Lock size={15} />
                Guardrails (MK11)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW & REPORTS (MK9) */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Acquisition & Marketing Analytics</h2>
                <p className="text-sm text-slate-500">Real-time breakdown of leads, inquiries, and conversion performance.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center text-xs">
                  <span className="px-2 font-medium text-slate-500">Period:</span>
                  {(["7d", "30d", "90d", "all"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setReportPeriod(p)}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        reportPeriod === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-1 flex items-center text-xs">
                  <span className="px-2 font-medium text-slate-500">Group by:</span>
                  {(["source", "course", "campaign"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setReportGroupBy(g)}
                      className={`px-2.5 py-1 rounded font-medium capitalize transition-colors ${
                        reportGroupBy === g ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                <Button onClick={handleExportCsv} variant="outline" size="sm" className="gap-1.5 bg-white border-slate-300">
                  <Download size={14} />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* High-level KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">Total Leads</CardDescription>
                  <CardTitle className="text-3xl font-extrabold text-blue-950">{reportQuery.data?.totalLeads ?? 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">Inbound inquiries across all digital and direct touchpoints</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">Admissions Contacted</CardDescription>
                  <CardTitle className="text-3xl font-extrabold text-slate-900">
                    {reportQuery.data?.breakdown?.reduce((acc, b) => acc + b.contacted, 0) ?? 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">Prospects engaged by education counselors</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">Enrolled Students</CardDescription>
                  <CardTitle className="text-3xl font-extrabold text-emerald-600">{reportQuery.data?.totalEnrolled ?? 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">Successfully matriculated into active language cohorts</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider font-semibold text-slate-500">Conversion Rate</CardDescription>
                  <CardTitle className="text-3xl font-extrabold text-indigo-600">
                    {reportQuery.data?.conversionRate ?? "0.00"}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500">Lead-to-enrollment efficiency metric</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Breakdown Table */}
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Performance Breakdown by {reportGroupBy}</CardTitle>
                <CardDescription className="text-xs">Detailed audit of inquiry channels and respective intake conversions.</CardDescription>
              </CardHeader>
              <CardContent>
                {reportQuery.data?.breakdown && reportQuery.data.breakdown.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Total Leads</th>
                          <th className="py-2.5 px-3">Contacted</th>
                          <th className="py-2.5 px-3">Enrolled</th>
                          <th className="py-2.5 px-3">Conversion Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportQuery.data.breakdown.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-3 px-3 font-medium text-slate-900 capitalize">{row.group}</td>
                            <td className="py-3 px-3 text-slate-700">{row.total}</td>
                            <td className="py-3 px-3 text-slate-700">{row.contacted}</td>
                            <td className="py-3 px-3 text-emerald-700 font-semibold">{row.enrolled}</td>
                            <td className="py-3 px-3">
                              <Badge variant="outline" className="bg-slate-50 font-mono text-xs">
                                {row.conversionRate}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    <p className="text-sm">No lead records logged for the selected period.</p>
                    <p className="text-xs text-slate-400 mt-1">Direct inquiries will automatically surface in this view.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CONTENT & CMS (MK6) */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Direct Content Publishing</h2>
                <p className="text-sm text-slate-500">
                  Instant publishing workflow without moderation roadblocks. Marketing updates go live immediately.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Create New Content Block */}
              <Card className="bg-white border-slate-200 shadow-xs lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Plus size={16} className="text-blue-600" />
                    New Content Block
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Sanitized automatically against malicious XSS scripts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Target Page</label>
                    <Input
                      value={newBlockPage}
                      onChange={(e) => setNewBlockPage(e.target.value)}
                      placeholder="e.g. home, about, programs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Section Key</label>
                    <Input
                      value={newBlockKey}
                      onChange={(e) => setNewBlockKey(e.target.value)}
                      placeholder="e.g. hero_banner, intake_notice"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Title</label>
                    <Input
                      value={newBlockTitle}
                      onChange={(e) => setNewBlockTitle(e.target.value)}
                      placeholder="Optional heading"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Content (HTML / Text)</label>
                    <Textarea
                      rows={4}
                      value={newBlockContent}
                      onChange={(e) => setNewBlockContent(e.target.value)}
                      placeholder="Content text or safe markup"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!newBlockKey) {
                        toast.error("Please provide a Section Key");
                        return;
                      }
                      createContentBlockMutation.mutate({
                        pageSlug: newBlockPage,
                        sectionKey: newBlockKey,
                        blockType: newBlockType,
                        title: newBlockTitle,
                        content: newBlockContent,
                      });
                    }}
                    disabled={createContentBlockMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Publish Directly
                  </Button>
                </CardContent>
              </Card>

              {/* Right Column: Existing Live Blocks */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-white border-slate-200 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-slate-900">Active Content Blocks</CardTitle>
                    <CardDescription className="text-xs">Directly published on the public site.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contentBlocksQuery.data && contentBlocksQuery.data.length > 0 ? (
                      <div className="space-y-3">
                        {contentBlocksQuery.data.map((block) => (
                          <div
                            key={block.id}
                            className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-50/50 text-blue-700 text-xs">
                                  {block.pageSlug} / {block.sectionKey}
                                </Badge>
                                <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                                  <CheckCircle2 size={12} /> Live
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-900">{block.title || "Untitled Block"}</h4>
                              <p className="text-xs text-slate-600 line-clamp-2">{block.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteContentBlockMutation.mutate({ id: block.id })}
                              className="text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 py-4 text-center">No custom content blocks configured yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Sub-sections grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white border-slate-200 shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                        <span>Upcoming Events</span>
                        <Badge variant="secondary" className="text-xs">{eventsQuery.data?.length ?? 0}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 space-y-2">
                      {eventsQuery.data?.slice(0, 3).map((e) => (
                        <div key={e.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                          <span className="font-medium truncate">{e.title}</span>
                          <span className="text-emerald-600">{e.isPublished ? "Published" : "Draft"}</span>
                        </div>
                      ))}
                      {(!eventsQuery.data || eventsQuery.data.length === 0) && (
                        <p className="text-slate-400">No events scheduled.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200 shadow-xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                        <span>Landing Pages</span>
                        <Badge variant="secondary" className="text-xs">{landingPagesQuery.data?.length ?? 0}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-600 space-y-2">
                      {landingPagesQuery.data?.slice(0, 3).map((lp) => (
                        <div key={lp.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                          <span className="font-medium truncate">/{lp.slug}</span>
                          <span className="text-slate-500">{lp.title}</span>
                        </div>
                      ))}
                      {(!landingPagesQuery.data || landingPagesQuery.data.length === 0) && (
                        <p className="text-slate-400">No custom landing pages created.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: MEDIA LIBRARY (MK7) */}
          <TabsContent value="media" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Marketing Media Library</h2>
                <p className="text-sm text-slate-500">
                  Manage promotional banners, campaign logos, visual creatives, and campaign assets.
                </p>
              </div>
            </div>

            {/* Upload / Add Form */}
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900">Add Campaign Asset</CardTitle>
                <CardDescription className="text-xs">Register creative asset URL and optional search tags.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Asset Type</label>
                    <select
                      value={newMediaType}
                      onChange={(e) => setNewMediaType(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs"
                    >
                      <option value="banner">Banner</option>
                      <option value="creative">Social Creative</option>
                      <option value="logo">Brand Logo</option>
                      <option value="other">Other Asset</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Asset URL</label>
                    <Input
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder="https://... or /media/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tags (comma separated)</label>
                    <Input
                      value={newMediaTags}
                      onChange={(e) => setNewMediaTags(e.target.value)}
                      placeholder="e.g. promo, summer-camp, ielts"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!newMediaUrl) {
                      toast.error("Please provide an asset URL");
                      return;
                    }
                    createMediaMutation.mutate({
                      type: newMediaType,
                      url: newMediaUrl,
                      tags: newMediaTags.split(",").map((t) => t.trim()).filter(Boolean),
                    });
                  }}
                  disabled={createMediaMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save to Media Library
                </Button>
              </CardContent>
            </Card>

            {/* Asset Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaQuery.data?.map((asset) => (
                <Card key={asset.id} className="bg-white border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    <img
                      src={asset.url}
                      alt={asset.type}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Creative+Asset";
                      }}
                    />
                  </div>
                  <CardContent className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {asset.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMediaMutation.mutate({ id: asset.id })}
                          className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                      <p className="text-xs font-mono text-slate-500 truncate" title={asset.url}>
                        {asset.url}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!mediaQuery.data || mediaQuery.data.length === 0) && (
                <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
                  <ImageIcon className="mx-auto w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium">No campaign assets uploaded.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Use the form above to add banners and promotional graphics.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 4: AUDIENCES & SEGMENTS (MK8) */}
          <TabsContent value="audiences" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Audience Segmentation</h2>
              <p className="text-sm text-slate-500">
                Create targeted lead cohorts based on language, intake interest, and marketing channels.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white border-slate-200 shadow-xs lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">Create Audience Cohort</CardTitle>
                  <CardDescription className="text-xs">Define demographic criteria rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Cohort Name</label>
                    <Input
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                      placeholder="e.g. GCC IELTS Applicants"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Target Age Group</label>
                    <Input
                      value={newSegmentAge}
                      onChange={(e) => setNewSegmentAge(e.target.value)}
                      placeholder="e.g. Teens & adults, Children"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Language Preference</label>
                    <Input
                      value={newSegmentLang}
                      onChange={(e) => setNewSegmentLang(e.target.value)}
                      placeholder="e.g. Arabic, Mandarin, English"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!newSegmentName) {
                        toast.error("Cohort name is required");
                        return;
                      }
                      createSegmentMutation.mutate({
                        name: newSegmentName,
                        filterCriteria: {
                          ageGroup: newSegmentAge,
                          languagePreference: newSegmentLang,
                        },
                      });
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Cohort
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xs lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">Active Audience Segments</CardTitle>
                  <CardDescription className="text-xs">Snapshot rules for automated outbound communications.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {segmentsQuery.data?.map((seg) => (
                      <div key={seg.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-900">{seg.name}</h4>
                        <pre className="text-xs font-mono text-slate-600 mt-1 bg-white p-2 rounded border border-slate-100">
                          {seg.filterCriteria}
                        </pre>
                      </div>
                    ))}
                    {(!segmentsQuery.data || segmentsQuery.data.length === 0) && (
                      <p className="text-sm text-slate-500 py-4 text-center">No segments configured.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 5: CHANNELS & ENTRY POINTS */}
          <TabsContent value="channels" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Communication Entry Points & Chatbot FAQ</h2>
              <p className="text-sm text-slate-500">
                Configure direct WhatsApp consultation buttons and conversational assistant knowledge.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* WhatsApp Entry Points */}
              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">WhatsApp Fast-Tracks</CardTitle>
                  <CardDescription className="text-xs">Direct click-to-chat advisory contacts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <Input
                      placeholder="Label (e.g. International Admissions Desk)"
                      value={newWpLabel}
                      onChange={(e) => setNewWpLabel(e.target.value)}
                    />
                    <Input
                      placeholder="WhatsApp Number (e.g. +60123456789)"
                      value={newWpNumber}
                      onChange={(e) => setNewWpNumber(e.target.value)}
                    />
                    <Input
                      placeholder="Prefilled Message"
                      value={newWpMessage}
                      onChange={(e) => setNewWpMessage(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newWpLabel || !newWpNumber) {
                          toast.error("Please provide both Label and Number");
                          return;
                        }
                        createWpMutation.mutate({
                          label: newWpLabel,
                          whatsappNumber: newWpNumber,
                          prefilledMessage: newWpMessage,
                        });
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Add WhatsApp Route
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {whatsappQuery.data?.map((wp) => (
                      <div key={wp.id} className="p-3 bg-white border border-slate-200 rounded flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{wp.label}</p>
                          <p className="text-slate-500 font-mono">{wp.whatsappNumber}</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Chatbot Knowledge */}
              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">Chatbot Knowledge Base (FAQ)</CardTitle>
                  <CardDescription className="text-xs">Keywords matched for automated admissions answers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chatbotFaqQuery.data?.map((faq) => (
                      <div key={faq.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <p className="font-semibold text-slate-900">{faq.question}</p>
                        <p className="text-slate-600">{faq.answerText}</p>
                        <div className="flex gap-1 pt-1 flex-wrap">
                          {(() => {
                            let list: string[] = [];
                            if (Array.isArray(faq.keywords)) {
                              list = faq.keywords;
                            } else if (typeof faq.keywords === "string") {
                              try {
                                const parsed = JSON.parse(faq.keywords);
                                if (Array.isArray(parsed)) list = parsed;
                                else list = [faq.keywords];
                              } catch {
                                list = faq.keywords.split(",").map((s) => s.trim());
                              }
                            }
                            return list.map((k, i) => (
                              <Badge key={i} variant="outline" className="bg-white text-[10px]">
                                {k}
                              </Badge>
                            ));
                          })()}
                        </div>
                      </div>
                    ))}
                    {(!chatbotFaqQuery.data || chatbotFaqQuery.data.length === 0) && (
                      <p className="text-sm text-slate-500 py-4 text-center">No FAQ knowledge entries configured.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 6: SETTINGS & DIRECTORY (MK10) */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Marketing Settings & Editable Directories</h2>
              <p className="text-sm text-slate-500">
                Customize CTA buttons, configure tracking pixels, manage lead sources, and message templates.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CTA Customizer */}
              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">Global Call-to-Action (CTA) Customization</CardTitle>
                  <CardDescription className="text-xs">
                    Controls primary navigation labels across public pages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Primary CTA Button Text</label>
                    <Input value={ctaApplyText} onChange={(e) => setCtaApplyText(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Primary CTA Destination Link</label>
                    <Input value={ctaApplyLink} onChange={(e) => setCtaApplyLink(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Consultation CTA Text</label>
                    <Input value={ctaConsultText} onChange={(e) => setCtaConsultText(e.target.value)} />
                  </div>
                  <Button
                    onClick={() => {
                      updateCtaMutation.mutate({
                        "cta.apply_now.text": ctaApplyText,
                        "cta.apply_now.link": ctaApplyLink,
                        "cta.book_consultation.text": ctaConsultText,
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save CTA Configurations
                  </Button>
                </CardContent>
              </Card>

              {/* Editable Lead Sources Directory */}
              <Card className="bg-white border-slate-200 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">Editable Lead Sources Directory</CardTitle>
                  <CardDescription className="text-xs">
                    Dynamic lookup directory replacing hardcoded enums for custom campaign tagging.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Display Name (e.g. EduFair 2026)"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                    />
                    <Input
                      placeholder="Code (e.g. edufair_2026)"
                      value={newSourceCode}
                      onChange={(e) => setNewSourceCode(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={() => {
                        if (!newSourceName || !newSourceCode) {
                          toast.error("Please fill both name and code");
                          return;
                        }
                        createLeadSourceMutation.mutate({
                          name: newSourceName,
                          code: newSourceCode,
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {leadSourcesQuery.data?.map((src) => (
                      <div key={src.id} className="py-2 px-1 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-900">{src.name}</span>
                          <span className="text-slate-400 font-mono ml-2">({src.code})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLeadSourceMutation.mutate({ id: src.id })}
                          className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tracking & Analytics Pixels */}
              <Card className="bg-white border-slate-200 shadow-xs lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                    <span>Analytics & Pixel Tracking</span>
                    <Badge variant="outline" className={trackingQuery.data?.allowMarketingPixelManagement ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                      {trackingQuery.data?.allowMarketingPixelManagement ? "Marketing Access Granted" : "Requires Super Admin Authorization"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Integration identifiers for GA4, Google Tag Manager, and Meta Pixel. Protected by system setting flag.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-xs font-semibold text-slate-700">Google Analytics 4</p>
                      <p className="text-xs font-mono text-slate-600 mt-1">{trackingQuery.data?.pixels?.GA_MEASUREMENT_ID || "Not Configured"}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-xs font-semibold text-slate-700">Google Tag Manager</p>
                      <p className="text-xs font-mono text-slate-600 mt-1">{trackingQuery.data?.pixels?.GTM_CONTAINER_ID || "Not Configured"}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="text-xs font-semibold text-slate-700">Meta Pixel</p>
                      <p className="text-xs font-mono text-slate-600 mt-1">{trackingQuery.data?.pixels?.META_PIXEL_ID || "Not Configured"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 7: GUARDRAILS & RESTRICTIONS (MK11) */}
          <TabsContent value="restrictions" className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">MK11 Strict Access Control Guardrails</CardTitle>
                    <CardDescription className="text-xs">
                      Enforced by server middleware and assertMarketingAllowed runtime checks.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  The Marketing role is designed for frictionless publishing and campaign optimization, while strictly isolating sensitive student records, financial transactions, and academic grading:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {[
                    { title: "No User Account Deletion", desc: "Cannot delete users or alter credentials." },
                    { title: "No Attendance Record Tampering", desc: "Read/write access to class attendance is blocked." },
                    { title: "No Student Grade Modification", desc: "Examinations and grade cards are protected." },
                    { title: "No Class Session Creation", desc: "Timetables remain exclusively with Academic Operations." },
                    { title: "No Teacher Assignments", desc: "Teacher allocation is locked to Operations & Academic Directors." },
                    { title: "No Payment or Refund Changes", desc: "Financial ledgers are isolated from marketing accounts." },
                    { title: "No Student Document Access", desc: "Passports and visa files are restricted to admissions officers." },
                    { title: "No Role Provisioning", desc: "User permissions are strictly managed by Super Admin." },
                  ].map((rule, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{rule.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{rule.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
