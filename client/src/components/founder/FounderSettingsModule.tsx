import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Globe, Mail, MapPin, Phone, RefreshCw, Save, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function FounderSettingsModule() {
  const settingsQuery = trpc.content.siteSettings.useQuery();
  const utils = trpc.useUtils();

  const [formValues, setFormValues] = useState<Record<string, string>>({
    centre_name: "Bilingual Idol Language Centre",
    contact_email: "info@bilc.my",
    contact_phone: "+60 3-2789 1234",
    whatsapp_number: "+60 12-345 6789",
    address: "Level 12, Menara Idol, Jalan Ampang, 50450 Kuala Lumpur, Malaysia",
    operating_hours: "Monday - Saturday: 8:30 AM - 6:30 PM (Sunday: Closed)",
    emergency_contact: "founder@bilc.my",
    brand_tagline: "Empowering global voices through bilingual mastery and cultural fluency.",
    registration_status: "Open for 2026 Term 2 Intake",
  });

  const [isModified, setIsModified] = useState(false);

  React.useEffect(() => {
    if (settingsQuery.data && Object.keys(settingsQuery.data).length > 0) {
      setFormValues((prev) => ({
        ...prev,
        ...settingsQuery.data,
      }));
    }
  }, [settingsQuery.data]);

  const updateMutation = trpc.content.updateSiteSettings.useMutation({
    onSuccess: () => {
      utils.content.siteSettings.invalidate();
      toast.success("Platform settings saved successfully.");
      setIsModified(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update platform settings.");
    },
  });

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setIsModified(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formValues);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fff8e6] text-[#b47d00] border border-[#ffd580]">
              <ShieldCheck size={13} />
              Founder Root Configuration
            </span>
            <span className="text-xs text-[#53657a]">CRUD: System Settings</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#10253e] mt-1">Centre & System Settings</h2>
          <p className="text-sm text-[#53657a]">
            Manage platform branding, emergency contacts, physical address, and global public metadata.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => settingsQuery.refetch()}
            disabled={settingsQuery.isFetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw size={14} className={settingsQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending || !isModified}
            className="h-9 gap-1.5 bg-[#173fad] hover:bg-[#12328b] text-white"
          >
            <Save size={14} />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institutional Identity */}
        <Card className="border-[#dce4e7] shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
              <Building2 size={18} className="text-[#173fad]" />
              Institutional Identity
            </CardTitle>
            <CardDescription className="text-xs text-[#53657a]">
              Official centre title, marketing tagline, and public status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="centre_name" className="text-xs font-semibold text-[#10253e]">
                Official Centre Name
              </Label>
              <Input
                id="centre_name"
                value={formValues.centre_name || ""}
                onChange={(e) => handleFieldChange("centre_name", e.target.value)}
                placeholder="e.g. Bilingual Idol Language Centre"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand_tagline" className="text-xs font-semibold text-[#10253e]">
                Brand Tagline
              </Label>
              <Input
                id="brand_tagline"
                value={formValues.brand_tagline || ""}
                onChange={(e) => handleFieldChange("brand_tagline", e.target.value)}
                placeholder="Official tagline"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registration_status" className="text-xs font-semibold text-[#10253e]">
                Admissions Intake Status
              </Label>
              <Input
                id="registration_status"
                value={formValues.registration_status || ""}
                onChange={(e) => handleFieldChange("registration_status", e.target.value)}
                placeholder="e.g. Open for 2026 Term 2 Intake"
                className="h-9 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Support */}
        <Card className="border-[#dce4e7] shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
              <Phone size={18} className="text-[#173fad]" />
              Communication & Inquiries
            </CardTitle>
            <CardDescription className="text-xs text-[#53657a]">
              Public phone numbers, official email, and WhatsApp line.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact_email" className="text-xs font-semibold text-[#10253e]">
                  General Email
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formValues.contact_email || ""}
                  onChange={(e) => handleFieldChange("contact_email", e.target.value)}
                  placeholder="info@bilc.my"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact" className="text-xs font-semibold text-[#10253e]">
                  Founder / Admin Hotline
                </Label>
                <Input
                  id="emergency_contact"
                  value={formValues.emergency_contact || ""}
                  onChange={(e) => handleFieldChange("emergency_contact", e.target.value)}
                  placeholder="founder@bilc.my"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact_phone" className="text-xs font-semibold text-[#10253e]">
                  Office Phone
                </Label>
                <Input
                  id="contact_phone"
                  value={formValues.contact_phone || ""}
                  onChange={(e) => handleFieldChange("contact_phone", e.target.value)}
                  placeholder="+60 3-2789 1234"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp_number" className="text-xs font-semibold text-[#10253e]">
                  Official WhatsApp
                </Label>
                <Input
                  id="whatsapp_number"
                  value={formValues.whatsapp_number || ""}
                  onChange={(e) => handleFieldChange("whatsapp_number", e.target.value)}
                  placeholder="+60 12-345 6789"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Physical Premises & Operating Hours */}
        <Card className="border-[#dce4e7] shadow-sm md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-[#10253e] flex items-center gap-2">
              <MapPin size={18} className="text-[#173fad]" />
              Campus Location & Operating Hours
            </CardTitle>
            <CardDescription className="text-xs text-[#53657a]">
              Physical centre address and scheduled weekly opening hours for staff and students.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold text-[#10253e]">
                  Full Campus Address
                </Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={formValues.address || ""}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="Street, Building, City, State, Postcode, Country"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="operating_hours" className="text-xs font-semibold text-[#10253e]">
                  Operating Schedule
                </Label>
                <Textarea
                  id="operating_hours"
                  rows={3}
                  value={formValues.operating_hours || ""}
                  onChange={(e) => handleFieldChange("operating_hours", e.target.value)}
                  placeholder="e.g. Mon-Sat 8:30am-6:30pm"
                  className="text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
