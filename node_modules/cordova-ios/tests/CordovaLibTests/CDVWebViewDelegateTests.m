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

#import <Cordova/CDVUIWebViewDelegate.h>

@interface CDVWebViewDelegate2 : CDVUIWebViewDelegate {}

- (void)setState:(NSInteger)state;
- (NSInteger)state;

@end

@implementation  CDVWebViewDelegate2

- (void)setState:(NSInteger)state
{
    _state = state;
}

- (NSInteger)state
{
    return _state;
}

@end

@interface CDVUIWebViewDelegate ()

// expose private interface
- (BOOL)shouldLoadRequest:(NSURLRequest*)request;

@end

@interface CDVWebViewDelegateTests : XCTestCase
@end

@implementation CDVWebViewDelegateTests

- (void)setUp
{
    [super setUp];
}

- (void)tearDown
{
    [super tearDown];
}

- (void)testFailLoadStateCancelled
{
    NSInteger initialState = 1; // STATE_WAITING_FOR_LOAD_START;
    NSInteger expectedState = 5; // STATE_CANCELLED;
    NSError* errorCancelled = [NSError errorWithDomain:NSCocoaErrorDomain code:NSURLErrorCancelled userInfo:nil];

    CDVWebViewDelegate2* wvd = [[CDVWebViewDelegate2 alloc] initWithDelegate:nil]; // not really testing delegate handling

    wvd.state = initialState;
    [wvd webView:[UIWebView new] didFailLoadWithError:errorCancelled];

    XCTAssertTrue(wvd.state == expectedState, @"If the load error was through an iframe redirect (NSURLErrorCancelled), the state should be STATE_CANCELLED");
}

- (void)testShouldLoadRequest
{
    CDVUIWebViewDelegate* wvd = [[CDVUIWebViewDelegate alloc] initWithDelegate:nil]; // not really testing delegate handling

    NSURLRequest* mailtoUrl = [NSURLRequest requestWithURL:[NSURL URLWithString:@"mailto:dev@cordova.apache.org"]];
    NSURLRequest* telUrl = [NSURLRequest requestWithURL:[NSURL URLWithString:@"tel:12345"]];
    NSURLRequest* plainUrl = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://apache.org"]];
    NSURLRequest* dataUrl = [NSURLRequest requestWithURL:[NSURL URLWithString:@"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="]];
    NSURLRequest* blobUrl = [NSURLRequest requestWithURL:[NSURL URLWithString:@"blob:d3958f5c-0777-0845-9dcf-2cb28783acaf"]];


    XCTAssertTrue([wvd shouldLoadRequest:mailtoUrl], @"mailto urls should be allowed");
    XCTAssertTrue([wvd shouldLoadRequest:telUrl], @"tel urls should be allowed");
    // as long as this is in the whitelist it should pass
    XCTAssertTrue([wvd shouldLoadRequest:plainUrl], @"http urls should be allowed");

    XCTAssertTrue([wvd shouldLoadRequest:dataUrl], @"data urls should be allowed");
    XCTAssertTrue([wvd shouldLoadRequest:blobUrl], @"blob urls should be allowed");
}

- (void)testFragmentIdentifiersWithHttpUrl
{
    [self doTestFragmentIdentifiersWithBaseUrl:@"http://cordova.apache.org" fragment:@"myfragment"];
}

- (void)testFragmentIdentifiersWithFileUrl
{
    [self doTestFragmentIdentifiersWithBaseUrl:@"file:///var/mobile/GASGEQGQsdga3313/www/index.html" fragment:@"myfragment"];
}

- (void)testFragmentIdentifiersWithFileUrlAndMalformedFragment
{
    [self doTestFragmentIdentifiersWithBaseUrl:@"file:///var/mobile/GASGEQGQsdga3313/www/index.html" fragment:@"/var/mobile/GASGEQGQsdga3313/www/index.html"];
}

- (void)doTestFragmentIdentifiersWithBaseUrl:(NSString*)baseUrl fragment:(NSString*)fragment
{
    CDVUIWebViewDelegate* wvd = [[CDVUIWebViewDelegate alloc] initWithDelegate:nil]; // not really testing delegate handling

    NSString* originalUrlString = baseUrl;
    NSURL* originalUrl = [NSURL URLWithString:originalUrlString];
    NSURL* originalUrlWithFragmentOnly = [NSURL URLWithString:[NSString stringWithFormat:@"%@#%@", originalUrlString, fragment]];
    NSURL* originalUrlWithFragmentOnlyNoIdentifier = [NSURL URLWithString:[NSString stringWithFormat:@"%@#", originalUrlString]];
    NSURL* originalUrlWithQueryParamsAndFragment = [NSURL URLWithString:[NSString stringWithFormat:@"%@?foo=bar#%@", originalUrlString, fragment]];

    NSURLRequest* originalRequest = [NSURLRequest requestWithURL:originalUrl];
    NSURLRequest* originalRequestWithFragmentOnly = [NSURLRequest requestWithURL:originalUrlWithFragmentOnly];
    NSURLRequest* originalRequestWithFragmentOnlyNoIdentifier = [NSURLRequest requestWithURL:originalUrlWithFragmentOnlyNoIdentifier];
    NSURLRequest* originalRequestWithQueryParamsAndFragment = [NSURLRequest requestWithURL:originalUrlWithQueryParamsAndFragment];
    NSURLRequest* notOriginalRequest = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://httpd.apache.org"]];

    XCTAssertTrue([wvd request:originalRequest isEqualToRequestAfterStrippingFragments:originalRequest], @"originalRequest should be a be equal to originalRequest after stripping fragments");
    XCTAssertTrue([wvd request:originalRequestWithFragmentOnly isEqualToRequestAfterStrippingFragments:originalRequest], @"originalRequestWithFragment should be equal to originalRequest after stripping fragment");
    XCTAssertTrue([wvd request:originalRequestWithFragmentOnlyNoIdentifier isEqualToRequestAfterStrippingFragments:originalRequest], @"originalRequestWithFragmentNoIdentifier should be equal to originalRequest after stripping fragment");
    XCTAssertFalse([wvd request:originalRequestWithQueryParamsAndFragment isEqualToRequestAfterStrippingFragments:originalRequest], @"originalRequestWithQueryParamsAndFragment should not be equal to originalRequest after stripping fragment");
    XCTAssertFalse([wvd request:notOriginalRequest isEqualToRequestAfterStrippingFragments:originalRequest], @"notOriginalRequest should not be equal to originalRequest after stripping fragment");

    // equality tests
    XCTAssertTrue([wvd request:originalRequestWithFragmentOnly isEqualToRequestAfterStrippingFragments:originalRequestWithFragmentOnly], @"originalRequestWithFragment should be a equal to itself after stripping fragments");
    XCTAssertTrue([wvd request:originalRequestWithFragmentOnlyNoIdentifier isEqualToRequestAfterStrippingFragments:originalRequestWithFragmentOnlyNoIdentifier], @"originalRequestWithFragmentNoIdentifier should be a equal to itself after stripping fragments");
    XCTAssertTrue([wvd request:originalRequestWithQueryParamsAndFragment isEqualToRequestAfterStrippingFragments:originalRequestWithQueryParamsAndFragment], @"originalRequestWithQueryParamsAndFragment should be equal to itself after stripping fragments");
}

@end
