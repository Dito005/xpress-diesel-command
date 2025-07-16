import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot } from "lucide-react";
import { AIHelper } from "./AIHelper";

export const FloatingAIHelper = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" /> AI Assistant
            </DialogTitle>
          </DialogHeader>
          <AIHelper />
        </DialogContent>
      </Dialog>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-primary shadow-lg shadow-glow-orange hover:bg-primary/90"
      >
        <Bot className="h-8 w-8" />
      </Button>
    </>
  );
};