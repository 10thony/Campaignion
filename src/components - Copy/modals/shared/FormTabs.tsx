import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

interface FormTab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface FormTabsProps {
  tabs: FormTab[];
  defaultValue?: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

const FormTabs: React.FC<FormTabsProps> = ({
  tabs,
  defaultValue,
  className = "",
  orientation = "horizontal",
}) => {
  const defaultTab = defaultValue || tabs[0]?.value;

  return (
    <Tabs defaultValue={defaultTab} className={`w-full ${className}`}>
      <TabsList className="flex w-full flex-row">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className="flex items-center gap-2"
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="space-y-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  children,
  className = "",
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};

export { FormTabs, FormSection };
export type { FormTab }; 