import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveInteractionModal } from '@/components/modals/LiveInteractionModal';

export function LiveInteractionDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Live Interaction Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Click the button below to open the Live Interaction Modal and test its functionality.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="w-full">
            Open Live Interaction
          </Button>
        </CardContent>
      </Card>

      <LiveInteractionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        interactionId="demo-interaction-123"
        currentUserId="demo-user-456"
        isDM={true}
      />
    </div>
  );
}