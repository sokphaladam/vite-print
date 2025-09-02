/* eslint-disable @typescript-eslint/no-explicit-any */
import { requestDatabase } from "@/server/request-api";
import { useEffect, useRef, useState } from "react";

interface Props {
  token: string | null;
}

interface table_print_queue {
  id?: number;
  created_at: string;
  created_by: string;
  content: any;
  printer_info: any;
}

export function PrintQueue(props: Props) {
  const [printers, setPrinters] = useState<table_print_queue[]>([]);
  const isHandlerRegistered = useRef(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (props.token && !isHandlerRegistered.current) {
      const handler = async (data: unknown) => {
        // Prevent duplicate calls
        if (isProcessing.current) {
          console.log("Already processing, skipping...");
          return;
        }

        isProcessing.current = true;
        console.log(data);

        try {
          const res = (await requestDatabase("/api/print-queue", "GET")) as {
            result: table_print_queue[];
          };
          backend.printJob([], {});
          setPrinters(res.result);
        } catch (error) {
          console.error("Error fetching print queue:", error);
        } finally {
          isProcessing.current = false;
        }
      };

      backend.onCronEvent(handler);
      isHandlerRegistered.current = true;

      // Cleanup function
      return () => {
        isHandlerRegistered.current = false;
        isProcessing.current = false;
      };
    }
  }, [props]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-emerald-700 tracking-tight">
            Print Queue
          </h2>
          <div className="text-sm text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
            {printers.length} items
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {printers.length === 0 ? (
            <div className="text-center py-12 text-emerald-600 text-lg">
              No print jobs in queue
            </div>
          ) : (
            printers.map((printer, index) => (
              <div
                key={printer.id || index}
                className="bg-white rounded-lg border border-emerald-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-base font-medium text-emerald-800 truncate">
                        {printer.printer_info?.name || "Unknown Printer"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Created by:{" "}
                      <span className="font-medium">{printer.created_by}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(printer.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded border">
                      #{printer.id || index + 1}
                    </div>
                  </div>
                </div>

                {printer.content && (
                  <div className="mt-3 pt-3 border-t border-emerald-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Content:
                    </h4>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-words max-h-40 overflow-y-auto border">
                      {JSON.stringify(printer.content, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
