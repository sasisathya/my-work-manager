'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateSubtaskModalProps {
  parentIssueKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedSubtask {
  summary: string;
  description: string;
}

export const CreateSubtaskModal = React.memo(function CreateSubtaskModal({
  parentIssueKey,
  open,
  onOpenChange,
  onSuccess,
}: CreateSubtaskModalProps) {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedSubtask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Parse text format: "Summary | Description" or just "Summary"
  const parseSubtaskText = (text: string): ParsedSubtask => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('Please enter a subtask summary');
    }

    const parts = trimmedText.split('|').map(p => p.trim());

    if (parts.length === 1) {
      return {
        summary: parts[0],
        description: '',
      };
    } else {
      return {
        summary: parts[0],
        description: parts.slice(1).join('|'), // Handle multiple pipes
      };
    }
  };

  const handleProceed = () => {
    try {
      setError('');
      const parsed = parseSubtaskText(rawText);

      if (!parsed.summary) {
        setError('Summary cannot be empty');
        return;
      }

      setParsedData(parsed);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse text');
    }
  };

  const handleCreate = async () => {
    if (!parsedData) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/jira/subtask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentIssueKey,
          summary: parsedData.summary,
          description: parsedData.description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create subtask');
      }

      // Reset and close
      setStep('input');
      setRawText('');
      setParsedData(null);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subtask');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setParsedData(null);
    setError('');
  };

  const handleClose = () => {
    setStep('input');
    setRawText('');
    setParsedData(null);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {step === 'input' ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Subtask</DialogTitle>
              <DialogDescription>
                Enter subtask details for {parentIssueKey}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subtask-input">
                  Subtask Details
                  <span className="text-xs text-gray-400 ml-2">
                    Format: "Summary | Description" (or just "Summary")
                  </span>
                </Label>
                <Textarea
                  id="subtask-input"
                  placeholder="Example: Fix login bug | Users cannot login with special characters in password"
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setError('');
                  }}
                  className="min-h-[120px] resize-none"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleProceed} disabled={!rawText.trim() || isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Preview
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Subtask Details</DialogTitle>
              <DialogDescription>
                Review the parsed subtask details before creating
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Parsed Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-400">Summary</Label>
                    <p className="text-sm font-medium text-white mt-1 break-words">
                      {parsedData?.summary}
                    </p>
                  </div>

                  {parsedData?.description && (
                    <div>
                      <Label className="text-xs text-gray-400">Description</Label>
                      <p className="text-sm text-gray-300 mt-1 break-words whitespace-pre-wrap">
                        {parsedData.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-gray-400">Parent Issue</Label>
                    <p className="text-sm font-medium text-blue-400 mt-1">{parentIssueKey}</p>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Subtask
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});
