/* eslint-disable @typescript-eslint/no-explicit-any */
import { requestDatabase } from "@/server/request-api";
import type { PosPrintData, PosPrintOptions } from "electron-pos-printer";
import { useEffect, useRef, useState } from "react";
import {
  Printer,
  Clock,
  User,
  FileText,
  Hash,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  token: string | null;
}

interface table_print_queue {
  id?: number;
  created_at: string;
  created_by: string;
  content: PosPrintData[];
  printer_info: {
    name?: string;
    printer_name?: string;
    status?: string;
    [key: string]: any;
  };
}

// Helper function to render print content in a user-friendly way
const renderPrintContent = (content: PosPrintData[]) => {
  if (!Array.isArray(content)) return null;

  return content.map((item, index) => {
    if (item.type === "text") {
      return (
        <div key={index} className="mb-2">
          <div className="text-sm font-mono bg-slate-50 px-3 py-2 rounded border-l-4 border-l-blue-400">
            {item.value}
          </div>
          {item.style && (
            <div className="text-xs text-gray-500 mt-1 ml-3">
              Style: {JSON.stringify(item.style, null, 2)}
            </div>
          )}
        </div>
      );
    } else if (item.type === "image") {
      return (
        <div key={index} className="mb-2">
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded border-l-4 border-l-blue-400">
            <Package className="h-4 w-4" />
            <span>Image: {item.path || "Base64 image"}</span>
          </div>
        </div>
      );
    } else if (item.type === "table") {
      return (
        <div key={index} className="mb-2">
          <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded border-l-4 border-l-green-400">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Table Data</span>
            </div>
            {item.tableHeader && (
              <div className="text-xs text-gray-600 mb-1">
                Headers: {item.tableHeader.join(", ")}
              </div>
            )}
            {item.tableBody && (
              <div className="text-xs text-gray-600">
                Rows: {item.tableBody.length}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div key={index} className="mb-2">
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border-l-4 border-l-gray-400">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Type: {item.type}</span>
            </div>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        </div>
      );
    }
  });
};

// Helper function to get print job status
const getPrintJobStatus = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMinutes = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60)
  );

  if (diffMinutes < 2) {
    return {
      status: "processing",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      icon: RefreshCw,
    };
  } else if (diffMinutes < 5) {
    return {
      status: "pending",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      icon: Clock,
    };
  } else {
    return {
      status: "delayed",
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: AlertTriangle,
    };
  }
};

// Helper function to extract useful summary from content
const getContentSummary = (content: PosPrintData[]) => {
  if (!Array.isArray(content)) return "Invalid content";

  const textItems = content.filter((item) => item.type === "text").length;
  const imageItems = content.filter((item) => item.type === "image").length;
  const tableItems = content.filter((item) => item.type === "table").length;
  const otherItems = content.length - textItems - imageItems - tableItems;

  const parts = [];
  if (textItems > 0) parts.push(`${textItems} text`);
  if (imageItems > 0) parts.push(`${imageItems} image`);
  if (tableItems > 0) parts.push(`${tableItems} table`);
  if (otherItems > 0) parts.push(`${otherItems} other`);

  return parts.join(", ") + ` item${content.length !== 1 ? "s" : ""}`;
};

export function PrintQueue(props: Props) {
  const [printers, setPrinters] = useState<table_print_queue[]>([]);
  const isHandlerRegistered = useRef(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (props.token && !isHandlerRegistered.current) {
      const handler = async () => {
        // Prevent duplicate calls
        if (isProcessing.current) {
          console.log("Already processing, skipping...");
          return;
        }

        isProcessing.current = true;

        try {
          const res = (await requestDatabase("/api/print-queue", "GET")) as {
            result: table_print_queue[];
          };
          res.result.forEach((item) => {
            const printInfo: PosPrintData[] = item.content;
            const printOption: PosPrintOptions = {
              preview: false,
              margin: "0 0 0 0",
              copies: 1,
              printerName: item.printer_info.printer_name,
              timeOutPerLine: 500,
              silent: true,
              pageSize: "80mm",
              boolean: true,
            };
            backend
              .printJob(printInfo, printOption)
              .then(async (response) => {
                console.log("Print job response:", response);
                await requestDatabase("/api/print-queue/delete", "DELETE", {
                  ids: [item.id],
                });
              })
              .catch((err) => {
                console.error("Error printing job:", err);
              });
          });
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
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-white to-blue-50 overflow-hidden">
      <div className="h-full flex flex-col p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Printer className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-700 tracking-tight">
                Print Queue
              </h2>
              <p className="text-sm text-emerald-600">
                Monitor and manage your print jobs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-emerald-700 bg-emerald-100 px-4 py-2 rounded-full border border-emerald-200">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span className="font-medium">{printers.length} items</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Queue Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {printers.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-emerald-700 mb-2">
                All caught up!
              </h3>
              <p className="text-emerald-600">
                No print jobs in queue at the moment
              </p>
            </div>
          ) : (
            printers.map((printer, index) => {
              const jobStatus = getPrintJobStatus(printer.created_at);
              const StatusIcon = jobStatus.icon;
              const contentSummary = getContentSummary(printer.content);

              return (
                <div
                  key={printer.id || index}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Job Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`p-2 rounded-lg ${jobStatus.bgColor}`}
                          >
                            <StatusIcon
                              className={`h-5 w-5 ${jobStatus.color}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Printer className="h-4 w-4 text-gray-400" />
                              <span className="text-lg font-semibold text-gray-900 truncate">
                                {printer.printer_info?.name ||
                                  printer.printer_info?.printer_name ||
                                  "Unknown Printer"}
                              </span>
                            </div>
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${jobStatus.bgColor} ${jobStatus.color}`}
                            >
                              <span className="capitalize">
                                {jobStatus.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Created by:</span>
                            <span className="text-gray-900">
                              {printer.created_by}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Date:</span>
                            <span className="text-gray-900">
                              {new Date(
                                printer.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Time:</span>
                            <span className="text-gray-900">
                              {new Date(
                                printer.created_at
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span className="font-medium">
                              #{printer.id || index + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Summary */}
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Content Summary
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {contentSummary}
                    </p>

                    {/* Detailed Content */}
                    <div className="space-y-2">
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                          <span>View detailed content</span>
                          <svg
                            className="h-4 w-4 transform group-open:rotate-180 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </summary>
                        <div className="mt-3 pl-4 border-l-2 border-gray-200">
                          {renderPrintContent(printer.content)}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
