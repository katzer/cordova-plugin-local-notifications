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

#import "CDVWebViewTest.h"
#import <Cordova/CDVViewController.h>
#import <Cordova/CDVUserAgentUtil.h>
#import "AppDelegate.h"

@interface CDVUserAgentTestViewController : UIViewController
@property (nonatomic) CDVViewController* vc1;
@property (nonatomic) CDVViewController* vc2;
@end

@implementation CDVUserAgentTestViewController
@synthesize vc1 = _vc1, vc2 = _vc2;

- (id)init
{
    self = [super init];
    if (self) {
        _vc1 = [[CDVViewController alloc] init];
        _vc2 = [[CDVViewController alloc] init];
    }
    return self;
}

- (void)loadView
{
    _vc1.wwwFolderName = @"www";
    _vc1.startPage = @"index.html";
    [self addChildViewController:_vc1];

    _vc2.wwwFolderName = @"www";
    _vc2.startPage = @"index.html";
    [self addChildViewController:_vc2];

    CGRect applicationFrame = [[UIScreen mainScreen] applicationFrame];
    UIView* contentView = [[UIView alloc] initWithFrame:applicationFrame];

    CGRect sub1, sub2;
    CGRectDivide(applicationFrame, &sub1, &sub2, applicationFrame.size.height / 2, CGRectMinYEdge);
    [_vc1.view setBounds:sub1];
    [_vc2.view setBounds:sub2];

    [contentView addSubview:_vc1.view];
    [contentView addSubview:_vc2.view];

    self.view = contentView;
}

@end

@interface CDVUserAgentTest : CDVWebViewTest
@end

@implementation CDVUserAgentTest

- (void)setUp
{
    [super setUp];
}

- (void)tearDown
{
    [super tearDown];
}

- (void)testDefaultUserAgent
{
    CDVUserAgentTestViewController* rootVc = [[CDVUserAgentTestViewController alloc] init];

    self.appDelegate.window.rootViewController = rootVc;

    // These tests only work on a UIWebView, which is the default web engine

    UIWebView* vc1WebView = (UIWebView*)rootVc.vc1.webView;
    UIWebView* vc2WebView = (UIWebView*)rootVc.vc2.webView;

    // sanity check
    if (![vc1WebView isKindOfClass:[UIWebView class]] && ![vc2WebView isKindOfClass:[UIWebView class]]) {
        return;
    }

    NSString* getWebUserAgent = @"navigator.userAgent";
    [self waitForConditionName:@"getting user-agents" block:^BOOL {
        return vc1WebView.request != nil && vc2WebView.request != nil;
    }];
    NSString* webUserAgent = [vc1WebView stringByEvaluatingJavaScriptFromString:getWebUserAgent];
    NSString* cordovaUserAgent = rootVc.vc1.userAgent;

    XCTAssertTrue([cordovaUserAgent hasPrefix:webUserAgent], @"Default Cordova user agent should be based on navigator.userAgent.");
}

- (void)testMultipleViews
{
    CDVUserAgentTestViewController* rootVc = [[CDVUserAgentTestViewController alloc] init];

    self.appDelegate.window.rootViewController = rootVc;

    UIWebView* vc1WebView = (UIWebView*)rootVc.vc1.webView;
    UIWebView* vc2WebView = (UIWebView*)rootVc.vc2.webView;

    // sanity check
    if (![vc1WebView isKindOfClass:[UIWebView class]] && ![vc2WebView isKindOfClass:[UIWebView class]]) {
        return;
    }

    NSString* getUserAgentCode = @"navigator.userAgent";
    [self waitForConditionName:@"getting user-agents" block:^BOOL {
        return vc1WebView.request != nil && vc2WebView.request != nil;
    }];
    NSString* ua1 = [vc1WebView stringByEvaluatingJavaScriptFromString:getUserAgentCode];
    NSString* ua2 = [vc2WebView stringByEvaluatingJavaScriptFromString:getUserAgentCode];

    XCTAssertTrue([ua1 isEqual:ua2], @"User-Agents should be different.");
}

- (void)testBaseUserAgent
{
    CDVUserAgentTestViewController* rootVc = [[CDVUserAgentTestViewController alloc] init];

    rootVc.vc1.baseUserAgent = @"A different baseline user agent 1";
    rootVc.vc2.baseUserAgent = @"A different baseline user agent 2";

    self.appDelegate.window.rootViewController = rootVc;

    UIWebView* vc1WebView = (UIWebView*)rootVc.vc1.webView;
    UIWebView* vc2WebView = (UIWebView*)rootVc.vc2.webView;

    // sanity check
    if (![vc1WebView isKindOfClass:[UIWebView class]] && ![vc2WebView isKindOfClass:[UIWebView class]]) {
        return;
    }

    [self waitForConditionName:@"getting user-agents" block:^BOOL {
        return vc1WebView.request != nil && vc2WebView.request != nil;
    }];
    NSString* cordovaUserAgent1 = rootVc.vc1.userAgent;
    NSString* cordovaUserAgent2 = rootVc.vc2.userAgent;

    XCTAssertTrue([cordovaUserAgent1 hasPrefix:rootVc.vc1.baseUserAgent], @"Cordova user agent should be based on base user agent.");
    XCTAssertTrue([cordovaUserAgent2 hasPrefix:rootVc.vc2.baseUserAgent], @"Cordova user agent should be based on base user agent.");
}

- (void)testUserAgentReleaseLock
{
    __block NSInteger myLockToken;

    [CDVUserAgentUtil acquireLock:^(NSInteger lockToken) {
        myLockToken = lockToken;
        [CDVUserAgentUtil releaseLock:&myLockToken];

        NSInteger nullInteger = 0;
        // test releasing NULL token
        [CDVUserAgentUtil releaseLock:&nullInteger];
        NSInteger* ni = nil;
        // test releasing nil object
        [CDVUserAgentUtil releaseLock:ni];
    }];
}


@end
