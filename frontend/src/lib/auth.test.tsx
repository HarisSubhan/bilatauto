import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./auth";

const mocks=vi.hoisted(()=>({navigate:vi.fn().mockResolvedValue(undefined),invalidate:vi.fn().mockResolvedValue(undefined)}));
vi.mock("@tanstack/react-router",()=>({useRouter:()=>mocks}));
vi.mock("@/lib/db",()=>{
  let listener: ((event:string,session:null)=>void)|undefined;
  return {db:{from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null}),then:(resolve:(value:unknown)=>void)=>resolve({data:[]})})})}),auth:{
    onAuthStateChange:(fn:typeof listener)=>{listener=fn;return {data:{subscription:{unsubscribe:()=>{listener=undefined;}}}};},
    getSession:async()=>({data:{session:{access_token:"test-only",user:{id:"test",email:"test@example.invalid"}}}}),
    signOut:async()=>{listener?.("SIGNED_OUT",null);},
  }}};
});
function Account(){const auth=useAuth();return <><span>{auth.user?"Signed in":"Signed out"}</span><button onClick={()=>void auth.signOut()}>Sign out</button></>;}
describe("instant sign-out",()=>{
  it("clears the session and private query data and navigates to login without reload",async()=>{
    const client=new QueryClient();client.setQueryData(["private-invoices"],[{id:"402"}]);
    render(<QueryClientProvider client={client}><AuthProvider><Account/></AuthProvider></QueryClientProvider>);
    await screen.findByText("Signed in");
    fireEvent.click(screen.getByRole("button",{name:"Sign out"}));
    expect(screen.getByText("Signed out")).toBeInTheDocument();
    await waitFor(()=>expect(mocks.navigate).toHaveBeenCalledWith({to:"/auth",replace:true}));
    expect(client.getQueryData(["private-invoices"])).toBeUndefined();
  });
});