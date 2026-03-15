"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Upload, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminThemePage() {
  const [primaryColor, setPrimaryColor] = useState("#0000FF");
  const [secondaryColor, setSecondaryColor] = useState("#050510");

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">מיתוג ועיצוב</h1>
        <p className="text-sm text-text-secondary mt-1">צבעים, פונטים ולוגו</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Colors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary-light" />
              <CardTitle className="text-base">צבעים</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">צבע ראשי</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-surface-border bg-transparent"
                />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} dir="ltr" className="flex-1" />
              </div>
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">צבע רקע</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-surface-border bg-transparent"
                />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} dir="ltr" className="flex-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">לוגו</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-surface-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-text-muted mb-3" />
              <p className="text-sm text-text-secondary">גרור לוגו לכאן או לחץ להעלאה</p>
              <p className="text-xs text-text-muted mt-1">PNG, SVG — עד 2MB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button>
          <Save className="h-4 w-4" />
          שמור שינויים
        </Button>
      </div>
    </div>
  );
}
