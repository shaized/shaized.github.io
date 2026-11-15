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
console.log('PASS: CVSS 3.1 scoring and validation, indicator extraction, defang/refang round trip, time parsing, KEV matching, homepage summary consistency.');
