"use client";

import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function GerarToast() {
  const handleNotification = () => {
    toast.custom(
      (t) => (
        <div className="bg-background flex items-start rounded-lg shadow-sm border gap-4 p-4 w-[320px]">
          <Avatar className="mt-0.5">
            <AvatarImage
              src="https://cdn.21st.dev/assets/mirror/5b/5b5b2f3487692d40f629010ea6448d150907f780d8c262c4ca194b7386115c2d.jpg"
              alt="Sarah"
            />
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">New message from Sarah</div>
            <p className="text-muted-foreground text-sm">
              Hey! Are you available for a quick call?
            </p>
            <Button
              className="mt-2"
              variant="outline"
              size="sm"
              onClick={() => toast.dismiss(t)}
            >
              Reply
            </Button>
          </div>
        </div>
      ),
      { duration: 4000 } // auto-dismiss após 4s
    );
  };

  return (
    <>
      <Button variant="outline" onClick={handleNotification}>
        Custom Toast
      </Button>
      <Toaster />
    </>
  );
}

export default GerarToast;
