import AdminDomainExplorer from "../../components/admin-domain-explorer";
export default function Page(){return <AdminDomainExplorer resource="approvals" title="Approval Queue" eyebrow="Governance" description="Authoritative approval requests from the existing Agent Authority boundary. This surface is evidence-only; approval decisions remain in the canonical approval/runtime boundary." columns={["id","requester_user_id","requester_agent_id","action","resource_type","resource_id","status","risk_level","decision_by_user_id","decision_reason","created_at","decided_at"]}/>
}
