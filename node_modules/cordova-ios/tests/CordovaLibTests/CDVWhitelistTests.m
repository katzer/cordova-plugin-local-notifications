/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <XCTest/XCTest.h>

#import <Cordova/CDVWhitelist.h>
#import "CDVIntentAndNavigationFilter.h"

@interface CDVWhitelistTests : XCTestCase
@end

@implementation CDVWhitelistTests

- (void)setUp
{
    [super setUp];

    // setup code here
}

- (void)tearDown
{
    // Tear-down code here.

    [super tearDown];
}

- (void)testAllowedSchemes
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"*.apache.org",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist schemeIsAllowed:@"http"]);
    XCTAssertTrue([whitelist schemeIsAllowed:@"https"]);
    XCTAssertTrue([whitelist schemeIsAllowed:@"ftp"]);
    XCTAssertTrue([whitelist schemeIsAllowed:@"ftps"]);
    XCTAssertFalse([whitelist schemeIsAllowed:@"gopher"]);
}

- (void)testSubdomainWildcard
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"*.apache.org",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://build.apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://sub1.sub0.build.apache.org"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org.ca"]]);
}

- (void)testCatchallWildcardOnly
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"*",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"https://build.apache.prg"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"ftp://MyDangerousSite.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"ftps://apache.org.SuspiciousSite.com"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"gopher://apache.org"]]);
}

- (void)testURISchemesNotFollowedByDoubleSlashes
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
                             @"tel:*",
                             @"sms:*",
                             nil];
    
    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];
    
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"tel:1234567890"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"sms:1234567890"]]);
}

- (void)testCatchallWildcardByProto
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"http://*",
        @"https://*",
        @"ftp://*",
        @"ftps://*",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"https://build.apache.prg"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"ftp://MyDangerousSite.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"ftps://apache.org.SuspiciousSite.com"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"gopher://apache.org"]]);
}

- (void)testExactMatch
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"www.apache.org",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://www.apache.org"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://build.apache.org"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org"]]);
}

- (void)testNoMatchInQueryParam
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"www.apache.org",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"www.malicious-site.org?url=http://www.apache.org"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"www.malicious-site.org?url=www.apache.org"]]);
}

- (void)testIpExactMatch
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"192.168.1.1",
        @"192.168.2.1",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://192.168.1.1"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://192.168.2.1"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://192.168.3.1"]]);
}

- (void)testIpWildcardMatch
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"192.168.1.*",
        @"192.168.2.*",
        nil];
    
    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org"]]);
    
    // Ever since Cordova 3.1, whitelist wildcards are simplified, only "*" and "*.apache.org" (subdomain example) are allowed. Therefore the next four tests should fail
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://192.168.1.1"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://192.168.1.2"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://192.168.2.1"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://192.168.2.2"]]);
    
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://192.168.3.1"]]);
}

- (void)testHostnameExtraction
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"http://apache.org/",
        @"http://apache.org/foo/bar?x=y",
        @"ftp://apache.org/foo/bar?x=y",
        @"ftps://apache.org/foo/bar?x=y",
        @"http://apache.*/foo/bar?x=y",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org/"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://google.com/"]]);
}

- (void)testWhitelistRejectionString
{
    NSArray* allowedHosts = [NSArray arrayWithObject:@"http://www.yahoo.com/"];  // Doesn't matter in this test.
    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    NSURL* testUrl = [NSURL URLWithString:@"http://www/google.com"];
    NSString* errorString = [whitelist errorStringForURL:testUrl];
    NSString* expectedErrorString = [NSString stringWithFormat:kCDVDefaultWhitelistRejectionString, [testUrl absoluteString]];

    XCTAssertTrue([expectedErrorString isEqualToString:errorString], @"Default error string has an unexpected value.");

    whitelist.whitelistRejectionFormatString = @"Hey, '%@' is, like, bogus man!";
    errorString = [whitelist errorStringForURL:testUrl];
    expectedErrorString = [NSString stringWithFormat:whitelist.whitelistRejectionFormatString, [testUrl absoluteString]];
    XCTAssertTrue([expectedErrorString isEqualToString:errorString], @"Customized whitelist rejection string has unexpected value.");
}

- (void)testSpecificProtocol
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"http://www.apache.org",
        @"cordova://www.google.com",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://www.apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"cordova://www.google.com"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"cordova://www.apache.org"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://www.google.com"]]);
}

- (void)testWildcardPlusOtherUrls
{
    // test for https://issues.apache.org/jira/browse/CB-3394

    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"*",
        @"cordova.apache.org",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://*.apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"https://www.google.com"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"ftp://cordova.apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://cordova.apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"https://cordova.apache.org"]]);
}

- (void)testWildcardScheme
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"*://*.test.com",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"http://apache.org"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"gopher://testtt.com"]]);
    
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"gopher://test.com"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://test.com"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://my.test.com"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"https://test.com"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"https://my.test.com"]]);

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://test.com/my/path"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://my.test.com/my/path"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"https://test.com/my/path"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"https://my.test.com/my/path"]]);

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"gopher://test.com#foo"]]);
    XCTAssertFalse([whitelist URLIsAllowed:[NSURL URLWithString:@"#foo"]]);
}

- (void)testCredentials
{
    NSArray* allowedHosts = [NSArray arrayWithObjects:
        @"http://*.apache.org",
        @"http://www.google.com",
        nil];

    CDVWhitelist* whitelist = [[CDVWhitelist alloc] initWithArray:allowedHosts];

    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://user:pass@www.apache.org"]]);
    XCTAssertTrue([whitelist URLIsAllowed:[NSURL URLWithString:@"http://user:pass@www.google.com"]]);
}

- (void)testAllowIntentsAndNavigations
{
    NSArray* allowIntents = @[ @"https://*" ];
    NSArray* allowNavigations = @[ @"https://*.apache.org" ];
    
    CDVWhitelist* intentsWhitelist = [[CDVWhitelist alloc] initWithArray:allowIntents];
    CDVWhitelist* navigationsWhitelist = [[CDVWhitelist alloc] initWithArray:allowNavigations];
    
    // Test allow-navigation superceding allow-intent
    XCTAssertEqual([CDVIntentAndNavigationFilter filterUrl:[NSURL URLWithString:@"https://apache.org/foo.html"] intentsWhitelist:intentsWhitelist navigationsWhitelist:navigationsWhitelist], CDVIntentAndNavigationFilterValueNavigationAllowed);
    // Test wildcard https as allow-intent
    XCTAssertEqual([CDVIntentAndNavigationFilter filterUrl:[NSURL URLWithString:@"https://google.com"] intentsWhitelist:intentsWhitelist navigationsWhitelist:navigationsWhitelist], CDVIntentAndNavigationFilterValueIntentAllowed);
    // Test http (not allowed in either)
    XCTAssertEqual([CDVIntentAndNavigationFilter filterUrl:[NSURL URLWithString:@"http://google.com"] intentsWhitelist:intentsWhitelist navigationsWhitelist:navigationsWhitelist], CDVIntentAndNavigationFilterValueNoneAllowed);
    
    
    NSURL* telUrl = [NSURL URLWithString:@"tel:5555555"];
    NSMutableURLRequest* telRequest = [NSMutableURLRequest requestWithURL:telUrl];
    telRequest.mainDocumentURL = telUrl;
    
    // mainDocumentURL and URL are the same in the NSURLRequest
    // Only UIWebViewNavigationTypeLinkClicked and UIWebViewNavigationTypeOther should return YES
    XCTAssertTrue([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeLinkClicked]);
    XCTAssertTrue([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeOther]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeReload]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeBackForward]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeFormSubmitted]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeFormResubmitted]);
    
    telRequest.mainDocumentURL = nil;
    // mainDocumentURL and URL are not the same in the NSURLRequest
    // Only UIWebViewNavigationTypeLinkClicked should return YES
    XCTAssertTrue([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeLinkClicked]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeOther]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeReload]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeBackForward]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeFormSubmitted]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOpenURLRequest:telRequest navigationType:UIWebViewNavigationTypeFormResubmitted]);
    
    NSURLRequest* request = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://apache.org"]];
    // Only CDVIntentAndNavigationFilterValueNavigationAllowed should return YES
    // navigationType doesn't matter
    XCTAssertTrue([CDVIntentAndNavigationFilter shouldOverrideLoadWithRequest:request navigationType:UIWebViewNavigationTypeOther filterValue:CDVIntentAndNavigationFilterValueNavigationAllowed]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOverrideLoadWithRequest:request navigationType:UIWebViewNavigationTypeOther filterValue:CDVIntentAndNavigationFilterValueIntentAllowed]);
    XCTAssertFalse([CDVIntentAndNavigationFilter shouldOverrideLoadWithRequest:request navigationType:UIWebViewNavigationTypeOther filterValue:CDVIntentAndNavigationFilterValueNoneAllowed]);
}


@end
