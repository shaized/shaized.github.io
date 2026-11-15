'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const T=require('./tools-core.js');

// CVSS v3.1 base scores checked against published FIRST/NVD examples.
for(const[vector,score,severity]of[
 ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',9.8,'Critical'],
 ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',10,'Critical'],
 ['CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H',9.9,'Critical'],
 ['CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',6.1,'Medium'],
 ['CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',7.8,'High'],
 ['CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N',5.9,'Medium'],
 ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H',7.5,'High'],
 ['CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:U/C:L/I:N/A:N',2.3,'Low'],
 ['CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:N',0,'None'],
 ['CVSS:3.0/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N',5.4,'Medium'],
 ['av:a/ac:l/pr:n/ui:n/s:u/c:h/i:h/a:h',8.8,'High']
]){const r=T.cvss31(vector);assert.ok(r,vector);assert.equal(r.score,score,vector);assert.equal(r.severity,severity,vector);assert.ok(r.vector.startsWith('CVSS:3.1/AV:'));}
for(const bad of['','CVSS:3.1/AV:N','CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H','AV:N/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H','AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:P','<script>'])assert.equal(T.cvss31(bad),null,bad);
assert.equal(T.cvss31({AV:'N',AC:'L',PR:'N',UI:'N',S:'U',C:'H',I:'H',A:'H'}).score,9.8);

// Indicator extraction from mixed, partly defanged text.
const sample=`Beacon to hxxps://evil-cdn[.]example[.]com/a/b?x=1, then 203.0.113[.]24 and 198.51.100.7.
Mail from attacker[@]mail.example.org. Dropped invoice.pdf and loader.exe (not domains).
MD5 d41d8cd98f00b204e9800998ecf8427e SHA1 da39a3ee5e6b4b0d3255bfef95601890afd80709
SHA256 E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855
Related: cve-2024-3400, CVE-2024-3400 and CVE-2023-123456. Version 10.2.3 and 999.1.1.1 are not addresses. Also see sub.portal.example.net.`;
const found=T.extractIndicators(sample);
assert.deepEqual(found.urls,['https://evil-cdn.example.com/a/b?x=1']);
assert.deepEqual(found.ipv4,['203.0.113.24','198.51.100.7']);
assert.deepEqual(found.emails,['attacker@mail.example.org']);
assert.deepEqual(found.md5,['d41d8cd98f00b204e9800998ecf8427e']);
assert.deepEqual(found.sha1,['da39a3ee5e6b4b0d3255bfef95601890afd80709']);
assert.deepEqual(found.sha256,['e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855']);
assert.deepEqual(found.cves,['CVE-2024-3400','CVE-2023-123456']);
assert.deepEqual(found.domains,['evil-cdn.example.com','sub.portal.example.net']);
assert.deepEqual(T.extractIndicators(''),{urls:[],domains:[],ipv4:[],emails:[],sha256:[],sha1:[],md5:[],cves:[]});
assert.equal(T.extractIndicators('x'.repeat(500000)+' 192.0.2.1').ipv4.length,0,'input is capped');

// Defang and refang are inverse for ordinary indicators.
assert.equal(T.defang('https://evil.example.com/path'),'hxxps[://]evil[.]example[.]com/path');
assert.equal(T.defang('192.0.2.10'),'192[.]0[.]2[.]10');
assert.equal(T.defang('user@example.org'),'user[@]example[.]org');
for(const value of['https://evil.example.com/path','192.0.2.10','user@example.org','http://a.example/b.c'])assert.equal(T.refang(T.defang(value)),value);
assert.equal(T.refang('hxxp://bad(.)example{.}com and a [dot] b [at] c'),'http://bad.example.com and a.b@c');

// Time parsing.
assert.equal(T.parseTime('1700000000').iso,'2023-11-14T22:13:20.000Z');
assert.equal(T.parseTime('1700000000').unit,'seconds');
assert.equal(T.parseTime('1700000000000').iso,'2023-11-14T22:13:20.000Z');
assert.equal(T.parseTime('1700000000000000').unit,'microseconds');
assert.equal(T.parseTime('1700000000000000000').iso,'2023-11-14T22:13:20.000Z');
assert.equal(T.parseTime('2026-11-04 20:00:05').iso,'2026-11-04T20:00:05.000Z');
assert.equal(T.parseTime('2026-11-04T20:00:05+02:00').iso,'2026-11-04T18:00:05.000Z');
assert.equal(T.parseTime('2026-11-04').seconds,1793750400);
assert.equal(T.parseTime('0').iso,'1970-01-01T00:00:00.000Z');
for(const bad of['','not a date','9'.repeat(30),'2026-13-45'])assert.equal(T.parseTime(bad),null,bad);
assert.equal(T.relativeTime(0,3*86400000),'3 days ago');
assert.equal(T.relativeTime(7200000,0),'in 2 hours');
assert.equal(T.relativeTime(500,0),'now');

// KEV matching against the bundled catalog.
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'kev-catalog.json'),'utf8'));
const known=catalog.vulnerabilities[0].cveID;
const result=T.matchKev([known.toLowerCase(),known,'CVE-1999-0001'],catalog);
assert.equal(result.listed.length,1);assert.equal(result.listed[0].cveID,known);assert.deepEqual(result.absent,['CVE-1999-0001']);
assert.deepEqual(T.matchKev(['CVE-2024-0001'],null),{listed:[],absent:['CVE-2024-0001']});

// The summary shown on the homepage must agree with the catalog it was built from.
const summary=JSON.parse(fs.readFileSync(path.join(__dirname,'kev-summary.json'),'utf8'));
assert.equal(summary.count,catalog.count);assert.equal(summary.dateReleased,catalog.dateReleased);
assert.equal(summary.ransomware,catalog.vulnerabilities.filter(v=>v.knownRansomwareCampaignUse==='Known').length);
assert.equal(summary.months.length,12);assert.ok(summary.vendors.length<=8&&summary.vendors.every(v=>typeof v.name==='string'&&Number.isInteger(v.count)));
assert.ok(summary.latest.every(v=>/^CVE-\d{4}-\d{4,}$/.test(v.cveID)));

// Layered decoding.
const b64=v=>Buffer.from(v).toString('base64');
assert.deepEqual(T.decodeLayers(b64('whoami /all')),[{kind:'Base64 (UTF-8)',output:'whoami /all'}]);
assert.deepEqual(T.decodeLayers(Buffer.from('Get-Process','utf16le').toString('base64')),[{kind:'Base64 (UTF-16LE)',output:'Get-Process'}]);
assert.deepEqual(T.decodeLayers('68 74 74 70 3a 2f 2f 61 2e 65 78 61 6d 70 6c 65'),[{kind:'Hex (UTF-8)',output:'http://a.example'}]);
assert.deepEqual(T.decodeLayers(encodeURIComponent(b64('cmd /c echo hello world'))).map(s=>s.kind),['URL encoding','Base64 (UTF-8)']);
assert.equal(T.decodeLayers(b64(b64('nested payload here'))).at(-1).output,'nested payload here');
assert.equal(T.decodeLayers(Buffer.from('hello-world?').toString('base64url')).at(-1).output,'hello-world?');
for(const plain of['','hello','password','testtest','12345678','The quick brown fox'])assert.deepEqual(T.decodeLayers(plain),[],plain);

// JWT decoding (never verification).
const seg=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt=T.decodeJwt(`${seg({alg:'HS256',typ:'JWT'})}.${seg({sub:'analyst',iat:1700000000,exp:1700003600})}.c2ln`,1700000100000);
assert.equal(jwt.algorithm,'HS256');assert.equal(jwt.payload.sub,'analyst');assert.equal(jwt.times.exp,'2023-11-14T23:13:20.000Z');assert.equal(jwt.signaturePresent,true);
assert.ok(jwt.notes.some(n=>n.includes('Symmetric')));assert.ok(!jwt.notes.some(n=>n.includes('expired')));
const unsigned=T.decodeJwt(`Bearer ${seg({alg:'none'})}.${seg({sub:'x',exp:1})}.`,1700000100000);
assert.ok(unsigned.notes.some(n=>n.includes('unsigned')));assert.ok(unsigned.notes.some(n=>n.includes('no signature')));assert.ok(unsigned.notes.some(n=>n.includes('expired')));
assert.ok(T.decodeJwt(`${seg({alg:'RS256'})}.${seg({sub:'x'})}.sig`).notes.some(n=>n.includes('no expiry')));
for(const bad of['','a.b','a.b.c','not.a.jwt.at.all',`${seg([1])}.${seg({})}.x`,`${seg({alg:'RS256'})}.${Buffer.from('nope').toString('base64url')}.x`])assert.equal(T.decodeJwt(bad),null,bad);

// IPv4 networks.
const net=T.cidrInfo('10.20.30.40/22');
assert.deepEqual([net.network,net.broadcast,net.first,net.last,net.mask,net.wildcard,net.total,net.usable,net.scope],['10.20.28.0','10.20.31.255','10.20.28.1','10.20.31.254','255.255.252.0','0.0.3.255',1024,1022,'Private (RFC 1918)']);
assert.deepEqual([T.cidrInfo('203.0.113.9').total,T.cidrInfo('203.0.113.9').scope],[1,'Documentation (TEST-NET-3)']);
assert.deepEqual([T.cidrInfo('192.0.2.0/31').usable,T.cidrInfo('192.0.2.0/31').first,T.cidrInfo('192.0.2.0/31').last],[2,'192.0.2.0','192.0.2.1']);
assert.deepEqual([T.cidrInfo('0.0.0.0/0').total,T.cidrInfo('0.0.0.0/0').mask,T.cidrInfo('0.0.0.0/0').broadcast],[4294967296,'0.0.0.0','255.255.255.255']);
assert.equal(T.cidrInfo('8.8.8.8/32').scope,'Public (globally routable)');assert.equal(T.cidrInfo('100.64.1.1/10').scope,'Shared address space (carrier-grade NAT)');
assert.equal(T.cidrInfo('255.255.255.255/32').network,'255.255.255.255');
for(const bad of['','10.0.0.0/33','256.1.1.1/24','10.0.0/24','example.com','10.0.0.0/-1'])assert.equal(T.cidrInfo(bad),null,bad);
assert.equal(T.cidrContains('10.20.28.0/22','10.20.31.200'),true);assert.equal(T.cidrContains('10.20.28.0/22','10.20.32.1'),false);assert.equal(T.cidrContains('10.20.28.0/22','nope'),null);

// Email headers.
const mail=T.parseEmailHeaders(`Return-Path: <bounce@mailer.example.net>
Received: from mx.recipient.example (mx.recipient.example [198.51.100.20])
	by inbox.recipient.example with ESMTPS id abc; Tue, 14 Nov 2023 22:13:30 +0000
Received: from relay.example.net (relay.example.net [203.0.113.24])
	by mx.recipient.example with ESMTP id xyz;
	Tue, 14 Nov 2023 22:13:20 +0000
Authentication-Results: mx.recipient.example; spf=pass smtp.mailfrom=mailer.example.net;
	dkim=fail header.d=example.org; dmarc=fail header.from=example.org
From: "Accounts Team" <accounts@example.org>
Reply-To: payments@different.example
Subject: Updated bank details
Date: Tue, 14 Nov 2023 22:13:18 +0000
Message-ID: <1@example.org>

Body text with a fake header: Reply-To: ignored@example.com`);
assert.equal(mail.fromAddress,'accounts@example.org');assert.equal(mail.subject,'Updated bank details');
assert.deepEqual(mail.auth,{spf:'pass',dkim:'fail',dmarc:'fail'});
assert.equal(mail.hops.length,2);assert.deepEqual([mail.hops[0].from,mail.hops[0].ip,mail.hops[0].time,mail.hops[1].delaySeconds],['relay.example.net','203.0.113.24','2023-11-14T22:13:20.000Z',10]);
assert.equal(mail.flags.length,4);assert.ok(mail.flags[0].includes('different.example'));assert.ok(mail.flags.some(f=>f.startsWith('DMARC')));
const clean=T.parseEmailHeaders('From: a@example.org\nReply-To: a@mail.example.org\nAuthentication-Results: mx; spf=pass; dkim=pass; dmarc=pass\nSubject: hi');
assert.deepEqual(clean.flags,[]);assert.deepEqual(clean.hops,[]);
assert.ok(T.parseEmailHeaders('From: a@example.org\nSubject: hi').flags.some(f=>f.includes('No Authentication-Results')));
assert.equal(T.parseEmailHeaders('just some text'),null);assert.equal(T.parseEmailHeaders(''),null);
console.log('PASS: layered decoding, JWT reading, IPv4 networks, email headers; CVSS 3.1 scoring and validation, indicator extraction, defang/refang round trip, time parsing, KEV matching, homepage summary consistency.');
