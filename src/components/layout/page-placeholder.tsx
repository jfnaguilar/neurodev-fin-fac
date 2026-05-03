import React from "react";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PagePlaceholderProps {
  title: string;
  breadcrumb: string;
  description?: string;
}

export function PagePlaceholder({ title, breadcrumb, description }: PagePlaceholderProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{breadcrumb}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Construction className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Em desenvolvimento</p>
            <p className="text-sm text-muted-foreground mt-1">
              {description ?? "Esta funcionalidade está sendo implementada e estará disponível em breve."}
            </p>
          </div>
          <Badge variant="secondary">Fase 2</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
