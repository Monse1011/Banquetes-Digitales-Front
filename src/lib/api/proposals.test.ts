import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadProposal, generateProposal, getProposal, sendProposal } from './proposals';
afterEach(()=>vi.unstubAllGlobals());
describe('proposal API',()=>{
  it('generates using the saved agreement identifier without sending email',async()=>{
    const fetch=vi.fn().mockResolvedValue(Response.json({data:{proposal_id:8,request_status:'Propuesta generada'}},{status:201}));vi.stubGlobal('fetch',fetch);
    expect(await generateProposal(5,12)).toMatchObject({proposal_id:8});
    expect(fetch.mock.calls[0][0]).toBe('/api/logistics/requests/5/proposals');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({data:{derived_information_id:12}});
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('consults the real stored proposal',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({data:{proposal_id:8,name:'proposal.pdf'}})));
    expect(await getProposal(5)).toMatchObject({name:'proposal.pdf'});
  });
  it('downloads binary PDF using session cookies',async()=>{
    const fetch=vi.fn().mockResolvedValue(new Response('%PDF-test',{headers:{'Content-Type':'application/pdf'}}));vi.stubGlobal('fetch',fetch);
    expect(await (await downloadProposal(5)).text()).toBe('%PDF-test');
    expect(fetch.mock.calls[0][1].credentials).toBe('same-origin');
  });
  it('surfaces duplicate generation errors',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({message:'Ya generada'},{status:409})));
    await expect(generateProposal(5,12)).rejects.toMatchObject({status:409});
  });
});

describe('send proposal API', () => {
  it('accepts the plain-text 200 response and uses the existing PDF endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('OK', {status: 200}));
    vi.stubGlobal('fetch', fetch);
    await expect(sendProposal(15)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('/api/logistics/requests/15/proposals/send');
    expect(fetch.mock.calls[0][1]).toMatchObject({method: 'POST', credentials: 'same-origin'});
    expect(fetch.mock.calls[0][1].body).toBeUndefined();
  });
  it('surfaces SMTP failure without retrying the email automatically', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({message: 'No fue posible enviar la propuesta.'}, {status: 500}));
    vi.stubGlobal('fetch', fetch);
    await expect(sendProposal(15)).rejects.toThrow('No fue posible enviar la propuesta.');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
