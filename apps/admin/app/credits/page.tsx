import AdminDomainExplorer from "../../components/admin-domain-explorer";
export default function Page(){return <AdminDomainExplorer resource="credit_products" title="Credits" eyebrow="Commercial" description="Authoritative AI credit product catalog. Purchase and settlement remain inside the canonical Economy/Payment boundary." columns={["id","product_key","name","credits","price_amount","currency","status","created_at"]}/>
}
