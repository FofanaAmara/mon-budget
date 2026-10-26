import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { localAuthSetCookie, upstreamAuthCookies, startLocalHttpAuthGateway } from '../../scripts/financial-spaces/local-http-auth.mjs';

test('local profile preserves cookie values, HttpOnly, SameSite, expiry and chunk suffixes', () => {
  const cookie = '__Secure-neon-auth.session_token.0=signed%2Bvalue; Path=/; Expires=Wed, 28 Oct 2026 12:00:00 GMT; HttpOnly; Secure; SameSite=Lax; Domain=.example.test';
  assert.equal(localAuthSetCookie(cookie), 'mes-finances-local-neon-auth.session_token.0=signed%2Bvalue; Path=/; Expires=Wed, 28 Oct 2026 12:00:00 GMT; HttpOnly; SameSite=Lax');
  assert.equal(localAuthSetCookie('__Secure-neon-auth.session_token=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax'),
    'mes-finances-local-neon-auth.session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
  const unrelated = '__Secure-other=untouched; Secure; HttpOnly; Path=/';
  assert.equal(localAuthSetCookie(unrelated), unrelated);
  assert.equal(localAuthSetCookie('__Secure-neon-auth-foreign=x; Secure'), '__Secure-neon-auth-foreign=x; Secure');
});

test('only local Neon cookies become canonical; previous HTTPS identity is not reused', () => {
  assert.equal(upstreamAuthCookies('theme=dark; __Secure-neon-auth.session_token=previous; mes-finances-local-neon-auth.session_token=current; mes-finances-local-neon-auth.session_data.0=chunk'),
    'theme=dark; __Secure-neon-auth.session_token=current; __Secure-neon-auth.session_data.0=chunk');
  assert.equal(upstreamAuthCookies('__Secure-neon-auth.session_token=previous'), '');
  assert.equal(upstreamAuthCookies(), '');
});

test('real loopback gateway forwards auth, RSC and logout consistently and refuses foreign Host', async () => {
  const backend = http.createServer((req, res) => {
    const chunks=[];
    req.on('data', chunk=>chunks.push(chunk));
    req.on('end',()=>{
      if(req.url==='/login') res.setHeader('Set-Cookie', [
        '__Secure-neon-auth.session_token=opaque-signature; Secure; HttpOnly; Path=/; SameSite=Lax',
        'theme=light; Path=/'
      ]);
      if(req.url==='/logout')res.setHeader('Set-Cookie','__Secure-neon-auth.session_token=; Max-Age=0; Secure; HttpOnly; Path=/; SameSite=Lax');
      res.setHeader('Content-Type','application/json');
      res.end(JSON.stringify({cookie:req.headers.cookie,origin:req.headers.origin,rsc:req.headers.rsc,body:Buffer.concat(chunks).toString()}));
    });
  });
  backend.listen(0,'127.0.0.1');
  await once(backend,'listening');
  let gateway, publicPort;
  const request=(path,headers={},body)=>new Promise((resolve,reject)=>{
    const req=http.request({hostname:'127.0.0.1',port:publicPort,path,method:body?'POST':'GET',headers:{host:'localhost:3002',...headers}},res=>{
      const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString()}));
    });req.on('error',reject);req.end(body);
  });
  try {
    publicPort=await new Promise((resolve,reject)=>{
      gateway=startLocalHttpAuthGateway({port:0,upstreamPort:backend.address().port,onListening:resolve,onError:reject});
    });
    const login=await request('/login',{'origin':'http://localhost:3002'},'example login payload');
    assert.equal(login.status,200);
    assert.deepEqual(login.headers['set-cookie'],['mes-finances-local-neon-auth.session_token=opaque-signature; HttpOnly; Path=/; SameSite=Lax','theme=light; Path=/']);
    const rsc=await request('/private?_rsc=test',{cookie:login.headers['set-cookie'][0].split(';')[0],rsc:'1',origin:'http://localhost:3002'});
    assert.deepEqual(JSON.parse(rsc.body),{cookie:'__Secure-neon-auth.session_token=opaque-signature',origin:'http://localhost:3002',rsc:'1',body:''});
    const logout=await request('/logout');
    assert.match(logout.headers['set-cookie'][0],/^mes-finances-local-neon-auth.session_token=; Max-Age=0;/);
    const foreign=await request('/',{host:'foreign.example'});assert.equal(foreign.status,400);
  }finally{gateway?.close();backend.closeAllConnections();await new Promise(resolve=>backend.close(resolve));}
});
