import api from "./client";

export async function uploadEvidence(caseId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/evidence/${caseId}/evidence`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getEvidence(caseId) {
  const { data } = await api.get(`/evidence/${caseId}/evidence`);
  return data;
}

export async function deleteEvidence(evidenceId) {
  const { data } = await api.delete(`/evidence/${evidenceId}`);
  return data;
}

export function getEvidenceDownloadUrl(evidenceId) {
  return `/api/evidence/${evidenceId}/download`;
}
