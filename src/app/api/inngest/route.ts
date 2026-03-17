import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { processFiscalEvents } from "@/inngest/fiscal-worker";

export const dynamic = 'force-dynamic';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processFiscalEvents
  ],
});
