import api from "./client.js";

export async function downloadCsv(url, filenamePrefix) {
  const { data } = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(data);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = blobUrl;
  a.download = `${filenamePrefix}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}