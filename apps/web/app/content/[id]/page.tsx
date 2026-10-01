import ContentPlatform from "../../../components/content-platform";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ContentPlatform detailId={id}/>;}
