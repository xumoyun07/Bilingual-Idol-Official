import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  CheckCircle2,
  Globe,
  HelpCircle,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export function MarketingAnalyticsModule() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fff0ed] text-[#a34732] border border-[#ffd1c7]">
              <BarChart3 size={13} />
              Marketing Module
            </span>
            <span className="text-xs text-[#53657a]">Growth & Conversion Performance</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Marketing Analytics & Lead Funnel</h2>
          <p className="text-sm text-[#53657a]">
            Review admissions conversion metrics, visitor inquiries by marketing channel, and campaign ROI.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#dce4e7] shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-[#53657a]">Total Inquiries (YTD)</span>
            <div className="text-2xl font-bold text-[#10253e]">148</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <TrendingUp size={13} />
              <span>+24.5% vs last term</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dce4e7] shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-[#53657a]">Enrollment Conversion Rate</span>
            <div className="text-2xl font-bold text-[#173fad]">38.2%</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span>56 confirmed enrollments</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dce4e7] shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-[#53657a]">Active Campaign Promo</span>
            <div className="text-2xl font-bold text-[#10253e]">3 Campaigns</div>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              <Sparkles size={13} />
              <span>EARLY2026 leading (42 redemptions)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dce4e7] shadow-sm">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-[#53657a]">Average Cost per Acquisition</span>
            <div className="text-2xl font-bold text-[#10253e]">RM 44.50</div>
            <div className="text-xs text-[#53657a]">Target: &lt; RM 60.00</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Channel Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#dce4e7] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
              <Globe size={18} className="text-[#173fad]" />
              Inquiry Lead Sources
            </CardTitle>
            <CardDescription className="text-xs text-[#53657a]">
              Distribution of incoming student inquiries by marketing channel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#10253e]">Direct Website Enrollment Form</span>
                <span className="text-[#173fad]">45% (67 leads)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                <div className="h-full bg-[#173fad] rounded-full" style={{ width: "45%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#10253e]">WhatsApp Consultation Widget</span>
                <span className="text-emerald-600">28% (41 leads)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "28%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#10253e]">Online Placement Diagnostic Test</span>
                <span className="text-purple-600">18% (27 leads)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "18%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#10253e]">Walk-in / Direct Referral</span>
                <span className="text-amber-600">9% (13 leads)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "9%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dce4e7] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
              <MousePointerClick size={18} className="text-[#173fad]" />
              Course Popularity & Demand
            </CardTitle>
            <CardDescription className="text-xs text-[#53657a]">
              Leading course programs by registration inquiry volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8fafc] border border-[#edf2f5]">
              <div>
                <p className="font-bold text-xs text-[#10253e]">General English for Adults</p>
                <p className="text-[11px] text-[#53657a]">Intermediate & Upper-Intermediate</p>
              </div>
              <Badge className="bg-[#e8eeff] text-[#173fad] hover:bg-[#e8eeff]">54 Inquiries</Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8fafc] border border-[#edf2f5]">
              <div>
                <p className="font-bold text-xs text-[#10253e]">IELTS Academic Masterclass</p>
                <p className="text-[11px] text-[#53657a]">Band 7.0+ Intensive</p>
              </div>
              <Badge className="bg-[#efe8fb] text-[#6e4c9a] hover:bg-[#efe8fb]">38 Inquiries</Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8fafc] border border-[#edf2f5]">
              <div>
                <p className="font-bold text-xs text-[#10253e]">Kids English & Young Explorers</p>
                <p className="text-[11px] text-[#53657a]">Ages 5 - 12</p>
              </div>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">32 Inquiries</Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8fafc] border border-[#edf2f5]">
              <div>
                <p className="font-bold text-xs text-[#10253e]">Bahasa Melayu & Mandarin</p>
                <p className="text-[11px] text-[#53657a]">Conversational</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">24 Inquiries</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
