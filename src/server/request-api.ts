export async function requestDatabase<ResponseType = unknown>(
  url: string,
  method: "GET" | "POST" | "DELETE" | "PUT" = "GET",
  body?: unknown
): Promise<ResponseType> {
  const token = window.localStorage.getItem("token");
  const raw = await fetch(url, {
    method,
    headers: {
      "Content-Type": method !== "GET" ? "application/json" : "",
      Authorization: `Bearer ${token ? token || "" : ""}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await raw.json();

  return json as ResponseType;
}
