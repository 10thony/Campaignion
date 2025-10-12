import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { ChevronUp, ChevronDown, Shield } from "lucide-react";

export const UserDebug: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const convexUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!isSignedIn) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Not signed in
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Sign in to access user data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`shadow-lg border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-64' : 'w-80'
      }`}>
        <CardHeader className="pb-3 cursor-pointer" onClick={toggleCollapse}>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium">
                {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
                User Debug Panel
              </CardTitle>
              <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                {isCollapsed ? 'Click to expand' : 'Development information'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
        }`}>
          <CardContent className="pt-0 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Clerk ID</span>
                <code className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-mono">
                  {user?.id?.slice(0, 8)}...
                </code>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Email</span>
                <span className="text-xs text-blue-700 dark:text-blue-300 truncate max-w-32">
                  {user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
              
              <Separator className="bg-blue-200 dark:bg-blue-800" />
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Convex User</span>
                {convexUser ? (
                  <Badge variant="default" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                    ✅ Found
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                    ❌ Not found
                  </Badge>
                )}
              </div>
              
              {convexUser && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Role</span>
                  <Badge 
                    variant={convexUser.role === 'admin' ? 'destructive' : 'default'}
                    className={
                      convexUser.role === 'admin' 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                        : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                    }
                  >
                    {convexUser.role}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}; 