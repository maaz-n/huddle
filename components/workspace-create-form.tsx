"use client";

import React, { useState } from 'react';
import { Rocket, Users, ArrowRight, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { createWorkspace } from '@/actions/workspace';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function WorkspaceForm() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()


  const handleCreate = async () => {
    setIsLoading(true);
    const response = await createWorkspace(name);
    if (response.success) {
        toast.success(response.message);
        router.push(`/?workspace=${response.workspace?.id}`)
    } else {
        toast.error(response.message)
    }
    setIsLoading(false)
  };

  return (
    <>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-2">
          <Label htmlFor="workspaceName">Workspace Name</Label>
          <Input 
            id="workspaceName" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My First Workspace" 
            className="h-11 focus-visible:ring-primary"
          />
        </div>

      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button 
          className="w-full h-11" 
          disabled={!name || isLoading}
          onClick={handleCreate}
        >
          {isLoading ? "Creating..." : "Create Workspace"}
          {!isLoading && <Rocket className="ml-2 h-4 w-4" />}
        </Button>
        
        <div className="relative py-2 w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-medium">Or</span>
          </div>
        </div>

        <Button variant="outline" className="w-full h-11 border-dashed">
          <Users className="mr-2 h-4 w-4" />
          Join existing via invite
          <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </CardFooter>
    </>
  );
}