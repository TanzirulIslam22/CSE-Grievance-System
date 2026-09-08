import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext.jsx";
import { getCaseById, updateCaseStatus, getCaseMessages, sendCaseMessage, revealCaseIdentity } from "../api/cases.js";
import { getEvidence, uploadEvidence, deleteEvidence, getEvidenceDownloadUrl } from "../api/evidence.js";
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, PRIVACY_LABELS, PRIVACY_BADGE_CLASSES } from "../types/index.js";
import { Send, ArrowLeft, Shield, Eye, EyeOff, ShieldAlert, Paperclip, Download, Trash2, Loader2, Lock } from "lucide-react";

const STATUS_TRANSITIONS_MAP = {
  submitted: ["acknowledged", "rejected"],
  acknowledged: ["under_review", "rejected"],
  under_review: ["investigation", "action_taken", "rejected"],
  investigation: ["action_taken", "rejected"],
  action_taken: ["resolved", "under_review"],
  resolved: ["closed"],
  rejected: ["closed"],
  closed: [],
};

export function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isHodOrAdmin = ["hod", "admin"].includes(user?.role || "");

  const [newMessage, setNewMessage] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: () => getCaseById(id),
    enabled: !!id,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => getCaseMessages(id),
    enabled: !!id,
  });

  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ["evidence", id],
    queryFn: () => getEvidence(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: () => updateCaseStatus(id, selectedStatus, statusReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      setSelectedStatus("");
      setStatusReason("");
    },
  });

  const messageMutation = useMutation({
    mutationFn: () => sendCaseMessage(id, newMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      setNewMessage("");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadEvidence(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence", id] });
    },
  });

  const deleteEvidenceMutation = useMutation({
    mutationFn: (evidenceId) => deleteEvidence(evidenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence", id] });
    },
  });

  const revealMutation = useMutation({
    mutationFn: () => revealCaseIdentity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });

  const caseItem = caseData?.case;
  const messages = messagesData?.messages || [];
  const evidenceList = evidenceData?.evidence || [];

  if (caseLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center">
        <p className="text-surface-500">Case not found.</p>
        <button onClick={() => navigate(-1)} className="mt-2 text-sm text-primary-600">Go back</button>
      </div>
    );
  }

  const allowedNext = STATUS_TRANSITIONS_MAP[caseItem.status] || [];

  const isConfidentialHidden =
    caseItem.privacyMode === "confidential" && !caseItem.identityRevealed;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Case header */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-primary-700">{caseItem.caseId}</span>
              <span className={`badge-${caseItem.status}`}>{STATUS_LABELS[caseItem.status]}</span>
              <span className={`badge ${caseItem.priority === "urgent" ? "bg-danger-50 text-danger-700" : caseItem.priority === "high" ? "bg-accent-50 text-accent-800" : "bg-surface-100 text-surface-600"}`}>
                {PRIORITY_LABELS[caseItem.priority]}
              </span>
              <span className="badge bg-surface-100 text-surface-600">{CATEGORY_LABELS[caseItem.category]}</span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-surface-900">{caseItem.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {caseItem.privacyMode === "confidential" ? (
              <span className={`badge ${PRIVACY_BADGE_CLASSES.confidential}`}>
                <Lock className="mr-1 h-3 w-3" /> {isConfidentialHidden ? "Confidential (identity hidden)" : "Confidential (identity revealed)"}
              </span>
            ) : caseItem.privacyMode === "protected" ? (
              <span className={`badge ${PRIVACY_BADGE_CLASSES.protected}`}><EyeOff className="mr-1 h-3 w-3" /> {PRIVACY_LABELS.protected}</span>
            ) : (
              <span className={`badge ${PRIVACY_BADGE_CLASSES.identified}`}><Eye className="mr-1 h-3 w-3" /> {PRIVACY_LABELS.identified}</span>
            )}
          </div>
        </div>

        {isHodOrAdmin && caseItem.submitter && !isConfidentialHidden && (
          <div className="mt-4 rounded-lg bg-surface-50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary-500" />
              <span className="font-medium text-surface-900">{caseItem.submitter.name}</span>
              <span className="text-surface-400">&bull;</span>
              <span className="text-surface-500">{caseItem.submitter.email}</span>
              <span className="text-surface-400">&bull;</span>
              <span className="text-surface-500">ID: {caseItem.submitter.studentOrEmployeeId}</span>
            </div>
          </div>
        )}

        {isHodOrAdmin && isConfidentialHidden && (
          <div className="mt-4 rounded-lg border border-danger-100 bg-danger-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-danger-700">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>
                  This case was submitted confidentially. The submitter&apos;s identity is hidden until you reveal it.
                  The reveal will be permanently logged in the audit trail.
                </span>
              </div>
              <button
                className="btn-primary text-xs"
                disabled={revealMutation.isPending}
                onClick={() => revealMutation.mutate()}
              >
                {revealMutation.isPending ? "Revealing..." : "Reveal submitter identity"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-surface-700">{caseItem.description}</div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
          {caseItem.courseOrContext && <span>Course: {caseItem.courseOrContext}</span>}
          {caseItem.involvedParties && <span>Involved: {caseItem.involvedParties}</span>}
          <span>Submitted: {new Date(caseItem.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(caseItem.updatedAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Status update (HoD only) */}
      {isHodOrAdmin && allowedNext.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-surface-900">Update Status</h3>
          <div className="flex flex-wrap items-end gap-3">
            <select className="input-field w-auto" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">Select new status</option>
              {allowedNext.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <input type="text" className="input-field flex-1" placeholder="Reason (optional)" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
            <button className="btn-primary" disabled={!selectedStatus || statusMutation.isPending} onClick={() => statusMutation.mutate()}>
              {statusMutation.isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      )}

      {/* Evidence */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-900">Evidence</h3>
          <label className="btn-secondary cursor-pointer text-xs px-3 py-1.5">
            <Paperclip className="mr-1 h-3 w-3" />
            {uploadMutation.isPending ? "Uploading..." : "Attach file"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {evidenceLoading ? (
          <div className="py-4 text-center text-sm text-surface-500">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Loading evidence...
          </div>
        ) : evidenceList.length === 0 ? (
          <p className="py-4 text-center text-sm text-surface-500">No evidence attached yet.</p>
        ) : (
          <ul className="divide-y divide-surface-100">
            {evidenceList.map((ev) => (
              <li key={ev._id} className="flex items-center gap-3 py-2.5">
                <Paperclip className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-surface-900">{ev.fileName}</p>
                  <p className="text-xs text-surface-500">
                    {(ev.fileSize / 1024).toFixed(1)} KB &middot; {new Date(ev.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <a
                  href={getEvidenceDownloadUrl(ev._id)}
                  className="btn-secondary px-2.5 py-1.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                {deleteEvidenceMutation.isPending ? (
                  <button className="btn-secondary px-2.5 py-1.5" disabled>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </button>
                ) : (
                  <button
                    className="btn-secondary px-2.5 py-1.5 text-danger-600 hover:text-danger-700"
                    onClick={() => deleteEvidenceMutation.mutate(ev._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Messages */}
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-surface-900">Communication</h3>

        {messagesLoading ? (
          <div className="py-8 text-center text-sm text-surface-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-surface-500">No messages yet. Start the conversation below.</p>
        ) : (
          <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg._id} className={`rounded-lg p-3 ${msg.senderRole === "hod" ? "ml-8 bg-primary-50" : "mr-8 bg-surface-50"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-surface-700">{msg.senderDisplayName}</span>
                  <span className="text-xs text-surface-400">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-surface-800">{msg.body}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && newMessage.trim()) {
                e.preventDefault();
                messageMutation.mutate();
              }
            }}
          />
          <button className="btn-primary" disabled={!newMessage.trim() || messageMutation.isPending} onClick={() => messageMutation.mutate()}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
