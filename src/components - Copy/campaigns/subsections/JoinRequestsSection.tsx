import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import "./JoinRequestsSection.css";

interface JoinRequestsSectionProps {
  campaignId: string;
  onRequestProcessed: () => void;
}

const JoinRequestsSection: React.FC<JoinRequestsSectionProps> = ({
  campaignId,
  onRequestProcessed,
}) => {
  const { user } = useUser();
  const [denyReason, setDenyReason] = useState<string>("");
  const [denyingRequestId, setDenyingRequestId] = useState<string | null>(null);
  const [showDenyForm, setShowDenyForm] = useState<string | null>(null);

  // Get join requests for this campaign
  const joinRequests = useQuery(
    api.joinRequests.getJoinRequestsByCampaign,
    user?.id ? { campaignId: campaignId as any, clerkId: user.id } : "skip"
  );

  const approveJoinRequest = useMutation(api.joinRequests.approveJoinRequest);
  const denyJoinRequest = useMutation(api.joinRequests.denyJoinRequest);

  const handleApprove = async (requestId: string) => {
    if (!user?.id) return;

    try {
      await approveJoinRequest({
        joinRequestId: requestId as any,
        clerkId: user.id,
      });
      onRequestProcessed();
    } catch (error: any) {
      console.error("Error approving request:", error);
      alert("Failed to approve request: " + error.message);
    }
  };

  const handleDeny = async (requestId: string) => {
    if (!user?.id) return;

    setDenyingRequestId(requestId);
    try {
      await denyJoinRequest({
        joinRequestId: requestId as any,
        clerkId: user.id,
        denyReason: denyReason || undefined,
      });
      setDenyReason("");
      setShowDenyForm(null);
      onRequestProcessed();
    } catch (error: any) {
      console.error("Error denying request:", error);
      alert("Failed to deny request: " + error.message);
    } finally {
      setDenyingRequestId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + " " + 
           new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { text: "Pending", class: "pending" },
      APPROVED: { text: "Approved", class: "approved" },
      DENIED: { text: "Denied", class: "denied" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (!joinRequests || joinRequests.length === 0) {
    return (
      <div className="join-requests-section">
        <div className="section-header">
          <h3>Join Requests</h3>
          <span className="section-subtitle">Manage player requests to join this campaign</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h4>No Join Requests</h4>
          <p>No players have requested to join this campaign yet.</p>
        </div>
      </div>
    );
  }

  const pendingRequests = joinRequests.filter(request => request.status === "PENDING");
  const processedRequests = joinRequests.filter(request => request.status !== "PENDING");

  return (
    <div className="join-requests-section">
      <div className="section-header">
        <h3>Join Requests</h3>
        <span className="section-subtitle">
          {pendingRequests.length} pending, {processedRequests.length} processed
        </span>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="requests-group">
          <h4 className="group-title">Pending Requests</h4>
          <div className="requests-list">
            {pendingRequests.map((request) => (
              <div key={request._id} className="request-card pending">
                <div className="request-header">
                  <div className="requester-info">
                    <h5>{request.requester?.firstName} {request.requester?.lastName}</h5>
                    <p className="requester-email">{request.requester?.email}</p>
                  </div>
                  <div className="request-meta">
                    {getStatusBadge(request.status)}
                    <span className="request-date">{formatDate(request.createdAt)}</span>
                  </div>
                </div>
                
                <div className="character-info">
                  <h6>Character: {request.playerCharacter?.name}</h6>
                  <p className="character-details">
                    Level {request.playerCharacter?.level} {request.playerCharacter?.race} {request.playerCharacter?.class}
                  </p>
                </div>

                <div className="request-actions">
                  <button
                    className="approve-button"
                    onClick={() => handleApprove(request._id)}
                    disabled={denyingRequestId === request._id}
                  >
                    ✅ Approve
                  </button>
                  
                  {showDenyForm === request._id ? (
                    <div className="deny-form">
                      <textarea
                        placeholder="Optional reason for denial..."
                        value={denyReason}
                        onChange={(e) => setDenyReason(e.target.value)}
                        className="deny-reason-input"
                        rows={2}
                      />
                      <div className="deny-form-actions">
                        <button
                          className="confirm-deny-button"
                          onClick={() => handleDeny(request._id)}
                          disabled={denyingRequestId === request._id}
                        >
                          {denyingRequestId === request._id ? "Denying..." : "Confirm Denial"}
                        </button>
                        <button
                          className="cancel-deny-button"
                          onClick={() => {
                            setShowDenyForm(null);
                            setDenyReason("");
                          }}
                          disabled={denyingRequestId === request._id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="deny-button"
                      onClick={() => setShowDenyForm(request._id)}
                      disabled={denyingRequestId === request._id}
                    >
                      ❌ Deny
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="requests-group">
          <h4 className="group-title">Processed Requests</h4>
          <div className="requests-list">
            {processedRequests.map((request) => (
              <div key={request._id} className={`request-card ${request.status.toLowerCase()}`}>
                <div className="request-header">
                  <div className="requester-info">
                    <h5>{request.requester?.firstName} {request.requester?.lastName}</h5>
                    <p className="requester-email">{request.requester?.email}</p>
                  </div>
                  <div className="request-meta">
                    {getStatusBadge(request.status)}
                    <span className="request-date">{formatDate(request.updatedAt || request.createdAt)}</span>
                  </div>
                </div>
                
                <div className="character-info">
                  <h6>Character: {request.playerCharacter?.name}</h6>
                  <p className="character-details">
                    Level {request.playerCharacter?.level} {request.playerCharacter?.race} {request.playerCharacter?.class}
                  </p>
                </div>

                {request.denyReason && (
                  <div className="deny-reason">
                    <strong>Denial Reason:</strong> {request.denyReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinRequestsSection; 